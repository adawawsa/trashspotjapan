require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');
const fs = require('fs');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import services
const cronService = require('./services/cronService');

// Import routes
const trashBinRoutes = require('./routes/trashBinRoutes');
const areaRoutes = require('./routes/areaRoutes');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
      connectSrc: ["'self'", 'https://maps.googleapis.com']
    }
  }
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/trash-bins', trashBinRoutes);
app.use('/api/v1/areas', areaRoutes);

// Home page route
app.get('/', (req, res) => {
  // Check if Google Maps API key is available
  const hasGoogleMapsKey = process.env.GOOGLE_MAPS_API_KEY
    && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
    && !process.env.GOOGLE_MAPS_API_KEY.includes('test_');

  // Debug log
  logger.info(`Google Maps API Key configured: ${!!hasGoogleMapsKey}`);
  if (hasGoogleMapsKey) {
    logger.info(`API Key preview: ${process.env.GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
  }

  // Inject API key into the HTML
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Inject Google Maps API key
  const apiKeyScript = hasGoogleMapsKey
    ? `<script>window.GOOGLE_MAPS_API_KEY = '${process.env.GOOGLE_MAPS_API_KEY}'; `
      + 'console.log(\'Google Maps API key loaded\');</script>'
    : '<script>window.GOOGLE_MAPS_API_KEY = null; '
      + 'console.warn(\'Google Maps API key not configured - using mock mode\');</script>';

  html = html.replace('</head>', `${apiKeyScript}\n</head>`);

  res.send(html);
});

// Static files (after specific routes)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// View engine setup
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  logger.info('New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.info('Received WebSocket message:', data);

      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          ws.area = data.area; // eslint-disable-line no-param-reassign
          ws.send(JSON.stringify({ type: 'subscribed', area: data.area }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Broadcast function for real-time updates
function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Send to all clients or filter by area if applicable
      if (!client.area || (data.area && data.area === client.area)) {
        client.send(message);
      }
    }
  });
}

// Export broadcast function for use in other modules
app.locals.broadcastUpdate = broadcastUpdate;

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize cron jobs
  cronService.init();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  cronService.stopAll();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

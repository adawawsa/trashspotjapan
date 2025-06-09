const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const trashBinController = require('../controllers/trashBinController');
const { validateSearchQuery, validateFeedback } = require('../middleware/validation');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'feedback-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Search trash bins
router.get('/search', validateSearchQuery, trashBinController.searchTrashBins);

// Get trash bin by ID
router.get('/:id', trashBinController.getTrashBinById);

// Submit user feedback
router.post('/feedback', upload.single('image'), validateFeedback, trashBinController.submitFeedback);

// Get trash bins by area (for map view)
router.get('/area/:areaId', trashBinController.getTrashBinsByArea);

module.exports = router;

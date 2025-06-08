# Trash Spot Japan

AI-powered platform for finding trash bins in Japan for foreign tourists.

## Features

- Location-based trash bin search
- Multi-language support (Japanese, English, Chinese)
- Google Maps integration
- AI-powered automatic data updates using Gemini and OpenAI
- Real-time updates via WebSocket
- Trash type filtering
- User feedback system

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- Elasticsearch >= 7
- Google Maps API Key
- OpenAI API Key
- Google AI API Key

## Installation

1. Clone the repository
```bash
git clone https://github.com/wada/trashspotjapan.git
cd trashspotjapan
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database
```bash
# Create PostgreSQL database
createdb trashspotjapan

# Run migrations
npm run migrate
```

5. Seed initial data (optional)
```bash
npm run seed
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Testing

Run tests:
```bash
npm test
```

## API Documentation

### Endpoints

- `GET /api/v1/trash-bins/search` - Search for trash bins
- `GET /api/v1/trash-bins/:id` - Get trash bin details
- `POST /api/v1/trash-bins/feedback` - Submit user feedback
- `GET /api/v1/areas/:area_id/trash-bins` - Get trash bins by area

## Deployment

1. Set environment variables for production
2. Build and start:
```bash
npm start
```

## Architecture

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js with Express.js
- Database: PostgreSQL with Redis cache
- Search: Elasticsearch
- Maps: Google Maps JavaScript API
- AI: Google Gemini & OpenAI GPT-4

## License

MIT
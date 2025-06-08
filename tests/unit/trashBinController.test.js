const request = require('supertest');
const express = require('express');
const trashBinRoutes = require('../../src/routes/trashBinRoutes');
const { pgPool, redisClient } = require('../../src/config/database');

// Mock the services
jest.mock('../../src/services/trashBinService');
const trashBinService = require('../../src/services/trashBinService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/trash-bins', trashBinRoutes);

describe('Trash Bin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/trash-bins/search', () => {
    it('should return trash bins for valid coordinates', async () => {
      const mockTrashBins = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: { en: 'Test Trash Bin', ja: 'テストゴミ箱' },
          location: { lat: 35.6762, lng: 139.6503 },
          distance_meters: 150,
          trash_types: ['burnable', 'plastic'],
          facility_type: 'convenience_store',
          quality_score: 0.85,
        },
      ];

      trashBinService.searchNearbyTrashBins.mockResolvedValue(mockTrashBins);

      const response = await request(app)
        .get('/api/v1/trash-bins/search')
        .query({
          lat: 35.6762,
          lng: 139.6503,
          radius: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.trash_bins).toEqual(mockTrashBins);
      expect(response.body.data.count).toBe(1);
    });

    it('should return 400 for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/v1/trash-bins/search')
        .query({ radius: 500 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Latitude and longitude are required');
    });

    it('should handle service errors', async () => {
      trashBinService.searchNearbyTrashBins.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/v1/trash-bins/search')
        .query({
          lat: 35.6762,
          lng: 139.6503,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/trash-bins/:id', () => {
    it('should return trash bin for valid ID', async () => {
      const mockTrashBin = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: { en: 'Test Trash Bin', ja: 'テストゴミ箱' },
        location: { lat: 35.6762, lng: 139.6503 },
        trash_types: ['burnable', 'plastic'],
        facility_type: 'convenience_store',
        quality_score: 0.85,
      };

      trashBinService.getTrashBinById.mockResolvedValue(mockTrashBin);

      const response = await request(app)
        .get('/api/v1/trash-bins/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockTrashBin);
    });

    it('should return 404 for non-existent trash bin', async () => {
      trashBinService.getTrashBinById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/trash-bins/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Trash bin not found');
    });
  });

  describe('POST /api/v1/trash-bins/feedback', () => {
    it('should submit feedback successfully', async () => {
      const mockFeedback = { id: '123e4567-e89b-12d3-a456-426614174001' };
      trashBinService.submitUserFeedback.mockResolvedValue(mockFeedback);

      const feedbackData = {
        trash_bin_id: '123e4567-e89b-12d3-a456-426614174000',
        feedback_type: 'incorrect_location',
        feedback_content: 'The trash bin location is not accurate',
      };

      const response = await request(app)
        .post('/api/v1/trash-bins/feedback')
        .send(feedbackData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Feedback submitted successfully');
    });

    it('should validate feedback data', async () => {
      const invalidFeedbackData = {
        trash_bin_id: 'invalid-uuid',
        feedback_type: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/v1/trash-bins/feedback')
        .send(invalidFeedbackData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });
  });
});
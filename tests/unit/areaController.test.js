const request = require('supertest');
const express = require('express');
const areaRoutes = require('../../src/routes/areaRoutes');

// Mock the services
jest.mock('../../src/services/areaService');
jest.mock('../../src/services/trashBinService');
const areaService = require('../../src/services/areaService');
const trashBinService = require('../../src/services/trashBinService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/areas', areaRoutes);

describe('Area API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/areas', () => {
    it('should return all areas', async () => {
      const mockAreas = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: { en: 'Shibuya', ja: '渋谷' },
          center: { lat: 35.6598, lng: 139.7006 },
          zoom_level: 14,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: { en: 'Shinjuku', ja: '新宿' },
          center: { lat: 35.6938, lng: 139.7036 },
          zoom_level: 14,
        },
      ];

      areaService.getAllAreas.mockResolvedValue(mockAreas);

      const response = await request(app).get('/api/v1/areas');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.areas).toEqual(mockAreas);
      expect(response.body.data.count).toBe(2);
    });

    it('should handle service errors', async () => {
      areaService.getAllAreas.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/api/v1/areas');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/areas/:id', () => {
    it('should return area for valid ID', async () => {
      const mockArea = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: { en: 'Shibuya', ja: '渋谷' },
        center: { lat: 35.6598, lng: 139.7006 },
        zoom_level: 14,
        trash_bin_count: 25,
        trash_type_counts: {
          burnable: 20,
          plastic_bottle: 15,
          can: 18,
        },
      };

      areaService.getAreaById.mockResolvedValue(mockArea);

      const response = await request(app)
        .get('/api/v1/areas/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockArea);
    });

    it('should return 404 for non-existent area', async () => {
      areaService.getAreaById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/areas/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Area not found');
    });
  });

  describe('GET /api/v1/areas/:id/trash-bins', () => {
    it('should return trash bins in area', async () => {
      const mockTrashBins = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: { en: 'Station Trash Bin', ja: '駅のゴミ箱' },
          location: { lat: 35.6598, lng: 139.7006 },
          facility_type: 'station',
          quality_score: 0.9,
        },
      ];

      trashBinService.getTrashBinsByArea.mockResolvedValue(mockTrashBins);

      const response = await request(app)
        .get('/api/v1/areas/123e4567-e89b-12d3-a456-426614174000/trash-bins');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.trash_bins).toEqual(mockTrashBins);
      expect(response.body.data.count).toBe(1);
    });

    it('should apply filters', async () => {
      const mockTrashBins = [];
      trashBinService.getTrashBinsByArea.mockResolvedValue(mockTrashBins);

      const response = await request(app)
        .get('/api/v1/areas/123e4567-e89b-12d3-a456-426614174000/trash-bins')
        .query({
          trash_types: 'burnable,plastic',
          facility_types: 'station,convenience_store',
        });

      expect(response.status).toBe(200);
      expect(trashBinService.getTrashBinsByArea).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        {
          trashTypes: ['burnable', 'plastic'],
          facilityTypes: ['station', 'convenience_store'],
        }
      );
    });
  });
});
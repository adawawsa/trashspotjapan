const { pgPool, redisClient } = require('../config/database');
const logger = require('../utils/logger');

class AreaService {
  // Get all areas
  async getAllAreas() {
    const cacheKey = 'areas:all';

    try {
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = `
        SELECT 
          id,
          name,
          ST_Y(center::geometry) as center_lat,
          ST_X(center::geometry) as center_lng,
          zoom_level,
          ST_AsGeoJSON(boundary)::json as boundary_geojson,
          created_at,
          updated_at
        FROM areas
        WHERE is_active = true
        ORDER BY name->>'en' ASC
      `;

      const result = await pgPool.query(query);

      const areas = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        center: {
          lat: row.center_lat,
          lng: row.center_lng
        },
        zoom_level: row.zoom_level,
        boundary: row.boundary_geojson,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(areas), {
        EX: 3600
      });

      return areas;
    } catch (error) {
      logger.error('Error getting all areas:', error);
      throw error;
    }
  }

  // Get area by ID
  async getAreaById(id) {
    const cacheKey = `area:${id}`;

    try {
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = `
        SELECT 
          a.id,
          a.name,
          ST_Y(a.center::geometry) as center_lat,
          ST_X(a.center::geometry) as center_lng,
          a.zoom_level,
          ST_AsGeoJSON(a.boundary)::json as boundary_geojson,
          a.created_at,
          a.updated_at,
          COUNT(DISTINCT tb.id) as trash_bin_count,
          json_build_object(
            'burnable', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'burnable'),
            'plastic_bottle', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'plastic_bottle'),
            'can', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'can'),
            'glass', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'glass'),
            'paper', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'paper'),
            'plastic', COUNT(DISTINCT tb.id) FILTER (WHERE tb.trash_types ? 'plastic')
          ) as trash_type_counts
        FROM areas a
        LEFT JOIN trash_bins tb ON ST_Within(tb.location, a.boundary) AND tb.is_active = true
        WHERE a.id = $1 AND a.is_active = true
        GROUP BY a.id
      `;

      const result = await pgPool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const area = {
        id: row.id,
        name: row.name,
        center: {
          lat: row.center_lat,
          lng: row.center_lng
        },
        zoom_level: row.zoom_level,
        boundary: row.boundary_geojson,
        trash_bin_count: parseInt(row.trash_bin_count, 10),
        trash_type_counts: row.trash_type_counts,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      // Cache for 30 minutes
      await redisClient.set(cacheKey, JSON.stringify(area), {
        EX: 1800
      });

      return area;
    } catch (error) {
      logger.error('Error getting area by ID:', error);
      throw error;
    }
  }

  // Find area containing point
  async findAreaContainingPoint(lat, lng) {
    try {
      const query = `
        SELECT 
          id,
          name,
          ST_Y(center::geometry) as center_lat,
          ST_X(center::geometry) as center_lng,
          zoom_level
        FROM areas
        WHERE 
          is_active = true
          AND ST_Within(ST_MakePoint($2, $1)::geography, boundary)
        LIMIT 1
      `;

      const result = await pgPool.query(query, [lat, lng]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        center: {
          lat: row.center_lat,
          lng: row.center_lng
        },
        zoom_level: row.zoom_level
      };
    } catch (error) {
      logger.error('Error finding area containing point:', error);
      throw error;
    }
  }
}

module.exports = new AreaService();
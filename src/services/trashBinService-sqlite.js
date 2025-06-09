const { initSQLiteDB, mockRedisClient } = require('../config/database-sqlite');
const logger = require('../utils/logger');

class TrashBinServiceSQLite {
  // Search nearby trash bins using SQLite
  async searchNearbyTrashBins({
    lat, lng, radius, trashTypes, facilityTypes, minQualityScore, limit
  }) {
    const cacheKey = `search:${lat}:${lng}:${radius}:${trashTypes?.join(',')}:${facilityTypes?.join(',')}:${minQualityScore}:${limit}`;

    try {
      // Check cache first
      const cached = await mockRedisClient.get(cacheKey);
      if (cached) {
        logger.info('Returning cached search results');
        return JSON.parse(cached);
      }

      const db = await initSQLiteDB();

      // Build query with distance calculation using Haversine formula
      let query = `
        SELECT 
          rowid as id,
          name,
          lat,
          lng,
          address,
          trash_types,
          facility_type,
          access_conditions,
          operating_hours,
          quality_score,
          trust_score,
          (
            6371000 * 2 * ASIN(
              SQRT(
                POWER(SIN((? - lat) * PI() / 180 / 2), 2) +
                COS(lat * PI() / 180) * COS(? * PI() / 180) *
                POWER(SIN((? - lng) * PI() / 180 / 2), 2)
              )
            )
          ) as distance_meters
        FROM trash_bins 
        WHERE is_active = 1
      `;
      
      const params = [lat, lat, lng];
      let paramIndex = 4;

      // Add radius filter
      query += ` AND (
        6371000 * 2 * ASIN(
          SQRT(
            POWER(SIN((? - lat) * PI() / 180 / 2), 2) +
            COS(lat * PI() / 180) * COS(? * PI() / 180) *
            POWER(SIN((? - lng) * PI() / 180 / 2), 2)
          )
        )
      ) <= ?`;
      params.push(lat, lat, lng, radius);
      paramIndex += 4;

      // Filter by trash types if specified
      if (trashTypes && trashTypes.length > 0) {
        const trashTypeConditions = trashTypes.map(() => `trash_types LIKE ?`).join(' OR ');
        query += ` AND (${trashTypeConditions})`;
        trashTypes.forEach(type => {
          params.push(`%"${type}"%`);
        });
      }

      // Filter by facility types if specified
      if (facilityTypes && facilityTypes.length > 0) {
        const facilityTypeConditions = facilityTypes.map(() => `facility_type = ?`).join(' OR ');
        query += ` AND (${facilityTypeConditions})`;
        facilityTypes.forEach(type => {
          params.push(type);
        });
      }
      
      // Filter by quality score if specified
      if (minQualityScore && minQualityScore > 0) {
        query += ` AND quality_score >= ?`;
        params.push(minQualityScore);
      }

      query += ` ORDER BY distance_meters ASC LIMIT ?`;
      params.push(limit || 50);

      const rows = await db.all(query, params);

      // Format results
      const trashBins = rows.map(row => ({
        id: row.id.toString(),
        name: JSON.parse(row.name || '{"ja":"未設定","en":"Not set","zh":"未设置"}'),
        location: {
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng)
        },
        distance_meters: Math.round(row.distance_meters),
        address: JSON.parse(row.address || '{"ja":"","en":"","zh":""}'),
        trash_types: JSON.parse(row.trash_types || '[]'),
        facility_type: row.facility_type || 'other',
        access_conditions: row.access_conditions ? JSON.parse(row.access_conditions) : null,
        operating_hours: row.operating_hours ? JSON.parse(row.operating_hours) : null,
        quality_score: parseFloat(row.quality_score || 0.5),
        trust_score: parseFloat(row.trust_score || 0.5)
      }));

      // Cache results for 5 minutes
      await mockRedisClient.set(cacheKey, JSON.stringify(trashBins), { EX: 300 });

      logger.info(`Found ${trashBins.length} trash bins within ${radius}m`);
      return trashBins;
    } catch (error) {
      logger.error('Error searching nearby trash bins:', error);
      throw error;
    }
  }

  // Get trash bin by ID
  async getTrashBinById(id) {
    try {
      const cacheKey = `trash_bin:${id}`;
      
      // Check cache first
      const cached = await mockRedisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const db = await initSQLiteDB();
      const row = await db.get(`
        SELECT 
          rowid as id,
          name,
          lat,
          lng,
          address,
          trash_types,
          facility_type,
          access_conditions,
          operating_hours,
          quality_score,
          trust_score,
          last_verified,
          ai_verified,
          created_at,
          updated_at
        FROM trash_bins 
        WHERE rowid = ? AND is_active = 1
      `, [id]);

      if (!row) {
        return null;
      }

      const trashBin = {
        id: row.id.toString(),
        name: JSON.parse(row.name || '{"ja":"未設定","en":"Not set","zh":"未设置"}'),
        location: {
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng)
        },
        address: JSON.parse(row.address || '{"ja":"","en":"","zh":""}'),
        trash_types: JSON.parse(row.trash_types || '[]'),
        facility_type: row.facility_type || 'other',
        access_conditions: row.access_conditions ? JSON.parse(row.access_conditions) : null,
        operating_hours: row.operating_hours ? JSON.parse(row.operating_hours) : null,
        quality_score: parseFloat(row.quality_score || 0.5),
        trust_score: parseFloat(row.trust_score || 0.5),
        last_verified: row.last_verified,
        ai_verified: Boolean(row.ai_verified),
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      // Cache for 10 minutes
      await mockRedisClient.set(cacheKey, JSON.stringify(trashBin), { EX: 600 });

      return trashBin;
    } catch (error) {
      logger.error('Error getting trash bin by ID:', error);
      throw error;
    }
  }

  // Submit user feedback
  async submitUserFeedback({
    trashBinId, feedbackType, feedbackContent, userLocation, imageUrl
  }) {
    try {
      const db = await initSQLiteDB();
      
      const result = await db.run(`
        INSERT INTO user_feedback (
          trash_bin_id, feedback_type, feedback_content, user_lat, user_lng, image_url
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        trashBinId,
        feedbackType,
        feedbackContent,
        userLocation?.lat || null,
        userLocation?.lng || null,
        imageUrl || null
      ]);

      // Update quality score based on feedback
      if (feedbackType === 'correct') {
        await this.updateQualityScore(trashBinId, 0.05); // Increase score
      } else if (['incorrect_location', 'wrong_info'].includes(feedbackType)) {
        await this.updateQualityScore(trashBinId, -0.1); // Decrease score
      }

      // Clear cache
      await mockRedisClient.del(`trash_bin:${trashBinId}`);

      return { id: result.lastID };
    } catch (error) {
      logger.error('Error submitting user feedback:', error);
      throw error;
    }
  }

  // Get trash bins by area
  async getTrashBinsByArea(areaId, filters = {}) {
    try {
      const db = await initSQLiteDB();
      
      // First get the area boundaries
      const area = await db.get('SELECT * FROM areas WHERE rowid = ?', [areaId]);
      if (!area) {
        return [];
      }

      let query = `
        SELECT 
          rowid as id,
          name,
          lat,
          lng,
          address,
          trash_types,
          facility_type,
          quality_score
        FROM trash_bins 
        WHERE is_active = 1
      `;
      
      const params = [];

      // Filter by trash types if specified
      if (filters.trashTypes && filters.trashTypes.length > 0) {
        const trashTypeConditions = filters.trashTypes.map(() => `trash_types LIKE ?`).join(' OR ');
        query += ` AND (${trashTypeConditions})`;
        filters.trashTypes.forEach(type => {
          params.push(`%"${type}"%`);
        });
      }

      // Filter by facility types if specified
      if (filters.facilityTypes && filters.facilityTypes.length > 0) {
        const facilityTypeConditions = filters.facilityTypes.map(() => `facility_type = ?`).join(' OR ');
        query += ` AND (${facilityTypeConditions})`;
        filters.facilityTypes.forEach(type => {
          params.push(type);
        });
      }

      query += ' ORDER BY quality_score DESC';

      const rows = await db.all(query, params);

      return rows.map(row => ({
        id: row.id.toString(),
        name: JSON.parse(row.name || '{"ja":"未設定","en":"Not set","zh":"未设置"}'),
        location: {
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng)
        },
        address: JSON.parse(row.address || '{"ja":"","en":"","zh":""}'),
        trash_types: JSON.parse(row.trash_types || '[]'),
        facility_type: row.facility_type || 'other',
        quality_score: parseFloat(row.quality_score || 0.5)
      }));
    } catch (error) {
      logger.error('Error getting trash bins by area:', error);
      throw error;
    }
  }

  // Update quality score
  async updateQualityScore(trashBinId, adjustment) {
    try {
      const db = await initSQLiteDB();
      
      await db.run(`
        UPDATE trash_bins 
        SET quality_score = MAX(0, MIN(1, quality_score + ?)),
            updated_at = CURRENT_TIMESTAMP
        WHERE rowid = ?
      `, [adjustment, trashBinId]);

      // Clear cache
      await mockRedisClient.del(`trash_bin:${trashBinId}`);
    } catch (error) {
      logger.error('Error updating quality score:', error);
      throw error;
    }
  }
}

module.exports = new TrashBinServiceSQLite();
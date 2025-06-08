const { pgPool, redisClient } = require('../config/database');
const logger = require('../utils/logger');

class TrashBinService {
  // Search nearby trash bins
  async searchNearbyTrashBins({ lat, lng, radius, trashTypes, facilityTypes, limit }) {
    const cacheKey = `search:${lat}:${lng}:${radius}:${trashTypes?.join(',')}:${facilityTypes?.join(',')}:${limit}`;
    
    try {
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Returning cached search results');
        return JSON.parse(cached);
      }

      // Build query
      let query = `
        SELECT 
          id,
          name,
          ST_Y(location::geometry) as lat,
          ST_X(location::geometry) as lng,
          ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters,
          address,
          trash_types,
          facility_type,
          access_conditions,
          operating_hours,
          quality_score,
          trust_score,
          last_verified,
          ai_verified
        FROM trash_bins
        WHERE 
          is_active = true
          AND ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
      `;

      const params = [lat, lng, radius];
      let paramIndex = 4;

      // Add trash type filter
      if (trashTypes && trashTypes.length > 0) {
        query += ` AND trash_types @> $${paramIndex}::jsonb`;
        params.push(JSON.stringify(trashTypes));
        paramIndex++;
      }

      // Add facility type filter
      if (facilityTypes && facilityTypes.length > 0) {
        query += ` AND facility_type = ANY($${paramIndex}::facility_type[])`;
        params.push(facilityTypes);
        paramIndex++;
      }

      query += ` ORDER BY distance_meters ASC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await pgPool.query(query, params);

      // Format results
      const trashBins = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: {
          lat: row.lat,
          lng: row.lng
        },
        distance_meters: Math.round(row.distance_meters),
        address: row.address,
        trash_types: row.trash_types,
        facility_type: row.facility_type,
        access_conditions: row.access_conditions,
        operating_hours: row.operating_hours,
        quality_score: parseFloat(row.quality_score),
        trust_score: parseFloat(row.trust_score),
        last_verified: row.last_verified,
        ai_verified: row.ai_verified
      }));

      // Cache results for 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(trashBins), {
        EX: 300
      });

      return trashBins;
    } catch (error) {
      logger.error('Error searching trash bins:', error);
      throw error;
    }
  }

  // Get trash bin by ID
  async getTrashBinById(id) {
    const cacheKey = `trash_bin:${id}`;

    try {
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = `
        SELECT 
          tb.*,
          ST_Y(tb.location::geometry) as lat,
          ST_X(tb.location::geometry) as lng,
          json_agg(
            json_build_object(
              'id', ds.id,
              'source_type', ds.source_type,
              'reliability_score', ds.reliability_score,
              'collected_at', ds.collected_at
            )
          ) FILTER (WHERE ds.id IS NOT NULL) as data_sources,
          (
            SELECT json_agg(
              json_build_object(
                'accuracy_score', qm.accuracy_score,
                'freshness_score', qm.freshness_score,
                'reliability_score', qm.reliability_score,
                'measured_at', qm.measured_at
              )
            )
            FROM quality_metrics qm
            WHERE qm.trash_bin_id = tb.id
            ORDER BY qm.measured_at DESC
            LIMIT 5
          ) as quality_history
        FROM trash_bins tb
        LEFT JOIN data_sources ds ON ds.trash_bin_id = tb.id
        WHERE tb.id = $1 AND tb.is_active = true
        GROUP BY tb.id
      `;

      const result = await pgPool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const trashBin = {
        id: row.id,
        name: row.name,
        location: {
          lat: row.lat,
          lng: row.lng
        },
        address: row.address,
        trash_types: row.trash_types,
        facility_type: row.facility_type,
        access_conditions: row.access_conditions,
        operating_hours: row.operating_hours,
        quality_score: parseFloat(row.quality_score),
        trust_score: parseFloat(row.trust_score),
        last_verified: row.last_verified,
        ai_verified: row.ai_verified,
        data_sources: row.data_sources || [],
        quality_history: row.quality_history || [],
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      // Cache for 10 minutes
      await redisClient.set(cacheKey, JSON.stringify(trashBin), {
        EX: 600
      });

      return trashBin;
    } catch (error) {
      logger.error('Error getting trash bin by ID:', error);
      throw error;
    }
  }

  // Submit user feedback
  async submitUserFeedback({ trashBinId, feedbackType, feedbackContent, userLocation, imageUrl }) {
    try {
      let query = `
        INSERT INTO user_feedback (
          trash_bin_id, feedback_type, feedback_content, user_location, image_url
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const userLocationPoint = userLocation 
        ? `POINT(${userLocation.lng} ${userLocation.lat})`
        : null;

      const params = [
        trashBinId,
        feedbackType,
        feedbackContent,
        userLocationPoint,
        imageUrl
      ];

      const result = await pgPool.query(query, params);

      // Clear cache for this trash bin
      await redisClient.del(`trash_bin:${trashBinId}`);

      // If feedback indicates removal or closure, update trash bin status
      if (feedbackType === 'removed' || feedbackType === 'closed') {
        await this.updateTrashBinQualityScore(trashBinId);
      }

      return { id: result.rows[0].id };
    } catch (error) {
      logger.error('Error submitting user feedback:', error);
      throw error;
    }
  }

  // Get trash bins by area
  async getTrashBinsByArea(areaId, { trashTypes, facilityTypes }) {
    try {
      let query = `
        SELECT 
          tb.id,
          tb.name,
          ST_Y(tb.location::geometry) as lat,
          ST_X(tb.location::geometry) as lng,
          tb.address,
          tb.trash_types,
          tb.facility_type,
          tb.access_conditions,
          tb.operating_hours,
          tb.quality_score,
          tb.trust_score,
          tb.last_verified,
          tb.ai_verified
        FROM trash_bins tb
        JOIN areas a ON ST_Within(tb.location, a.boundary)
        WHERE 
          a.id = $1
          AND tb.is_active = true
      `;

      const params = [areaId];
      let paramIndex = 2;

      // Add filters
      if (trashTypes && trashTypes.length > 0) {
        query += ` AND tb.trash_types @> $${paramIndex}::jsonb`;
        params.push(JSON.stringify(trashTypes));
        paramIndex++;
      }

      if (facilityTypes && facilityTypes.length > 0) {
        query += ` AND tb.facility_type = ANY($${paramIndex}::facility_type[])`;
        params.push(facilityTypes);
        paramIndex++;
      }

      query += ` ORDER BY tb.quality_score DESC`;

      const result = await pgPool.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: {
          lat: row.lat,
          lng: row.lng
        },
        address: row.address,
        trash_types: row.trash_types,
        facility_type: row.facility_type,
        access_conditions: row.access_conditions,
        operating_hours: row.operating_hours,
        quality_score: parseFloat(row.quality_score),
        trust_score: parseFloat(row.trust_score),
        last_verified: row.last_verified,
        ai_verified: row.ai_verified
      }));
    } catch (error) {
      logger.error('Error getting trash bins by area:', error);
      throw error;
    }
  }

  // Update trash bin quality score
  async updateTrashBinQualityScore(trashBinId) {
    try {
      const query = `
        UPDATE trash_bins 
        SET quality_score = calculate_quality_score($1)
        WHERE id = $1
      `;

      await pgPool.query(query, [trashBinId]);

      // Clear cache
      await redisClient.del(`trash_bin:${trashBinId}`);
    } catch (error) {
      logger.error('Error updating quality score:', error);
      throw error;
    }
  }
}

module.exports = new TrashBinService();
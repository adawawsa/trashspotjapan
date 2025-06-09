const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { initSQLiteDB } = require('../config/database-sqlite');
const logger = require('../utils/logger');

class AIResearchServiceSQLite {
  constructor() {
    // Check if we're in test/development mode with mock API keys
    this.isMockMode = this.isUsingMockKeys();

    if (this.isMockMode) {
      logger.info('AI Research Service: Running in mock mode');
      this.geminiClient = null;
      this.openaiClient = null;
    } else {
      // Initialize AI clients
      if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY !== 'YOUR_GOOGLE_AI_API_KEY_HERE') {
        this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      } else {
        this.geminiClient = null;
        logger.info('AI Research Service: Gemini API key not configured, using OpenAI only');
      }
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE') {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      } else {
        this.openaiClient = null;
        logger.info('AI Research Service: OpenAI API key not configured');
      }
    }

    this.researchPrompt = `
You are an AI assistant specialized in finding and verifying trash bin locations in Japan.
Your task is to research and provide accurate information about public trash bins in the specified area.

For each trash bin found, provide:
1. Exact location (address or landmark with latitude/longitude)
2. Types of trash accepted (burnable, plastic_bottle, can, glass, paper, plastic)
3. Facility type (convenience_store, station, park, vending_machine, shopping_mall, public_facility, other)
4. Access conditions (public access, customers only, during business hours, etc.)
5. Operating hours if applicable
6. Any additional relevant information

Focus on accuracy and verify information from multiple sources when possible.
Provide the response as a JSON object with a "trash_bins" array.

Example format:
{
  "trash_bins": [
    {
      "name": "Station Name Recycling Box",
      "location": {"lat": 35.6812, "lng": 139.7649},
      "address": "Tokyo Station, Chiyoda-ku, Tokyo",
      "trash_types": ["plastic_bottle", "can", "paper"],
      "facility_type": "station",
      "access_conditions": "Public access",
      "operating_hours": "First train to last train"
    }
  ]
}
`;
  }

  // Run weekly AI research update
  async runWeeklyUpdate() {
    const cycleId = this.generateCycleId();
    logger.info(`Starting AI research cycle: ${cycleId}`);

    try {
      // Get all active areas from database
      const areas = await this.getAllAreas();

      for (const area of areas) {
        await this.researchArea(area, cycleId);
      }

      logger.info(`AI research cycle completed: ${cycleId}`);
    } catch (error) {
      logger.error('AI research cycle failed:', error);
      throw error;
    }
  }

  // Get all areas from SQLite database
  async getAllAreas() {
    const db = await initSQLiteDB();
    const areas = await db.all(`
      SELECT 
        rowid as id,
        name,
        center_lat,
        center_lng,
        boundary_json
      FROM areas 
      WHERE is_active = 1
    `);

    return areas.map(area => ({
      id: area.id,
      name: JSON.parse(area.name),
      center: {
        lat: area.center_lat,
        lng: area.center_lng
      },
      boundary: area.boundary_json ? JSON.parse(area.boundary_json) : null
    }));
  }

  // Research specific area
  async researchArea(area, cycleId) {
    const startTime = Date.now();

    try {
      // Record research start
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: JSON.stringify(area.boundary || {}),
        aiService: 'combined',
        status: 'in_progress'
      });

      // Run research with available AI services
      let geminiResults = [];
      let openaiResults = [];
      
      const promises = [];
      
      if (this.geminiClient) {
        promises.push(this.researchWithGemini(area).then(r => { geminiResults = r; }));
      }
      
      if (this.openaiClient) {
        promises.push(this.researchWithOpenAI(area).then(r => { openaiResults = r; }));
      }
      
      await Promise.all(promises);

      // Merge and validate results
      const mergedResults = await this.mergeAndValidateResults(geminiResults, openaiResults);

      // Update database with new findings
      const updateCount = await this.updateTrashBins(mergedResults);

      // Record research completion
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: JSON.stringify(area.boundary || {}),
        aiService: 'combined',
        resultsCount: updateCount,
        qualityScore: this.calculateQualityScore(mergedResults),
        executionTime: Date.now() - startTime,
        status: 'completed'
      });

      logger.info(`Area research completed: ${area.name.en || area.name.ja}, found ${updateCount} trash bins`);
    } catch (error) {
      // Record research failure
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: JSON.stringify(area.boundary || {}),
        aiService: 'combined',
        status: 'failed',
        errorMessage: error.message,
        executionTime: Date.now() - startTime
      });

      logger.error(`Area research failed: ${area.name.en || area.name.ja}`, error);
    }
  }

  // Research with Gemini
  async researchWithGemini(area) {
    if (this.isMockMode) {
      return this.generateMockTrashBins(area, 'gemini');
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `${this.researchPrompt}

Area: ${area.name.en || area.name.ja}
Center: ${area.center.lat}, ${area.center.lng}
Please research trash bins in this area of Japan.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      try {
        const parsed = JSON.parse(text);
        return parsed.trash_bins || [];
      } catch (parseError) {
        logger.error('Failed to parse Gemini response:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Gemini research error:', error);
      return [];
    }
  }

  // Research with OpenAI
  async researchWithOpenAI(area) {
    if (this.isMockMode) {
      return this.generateMockTrashBins(area, 'openai');
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo-1106',  // このモデルはJSON形式をサポート
        messages: [
          {
            role: 'system',
            content: this.researchPrompt + '\n\nIMPORTANT: You must respond with valid JSON only.'
          },
          {
            role: 'user',
            content: `Research trash bins in this area of Japan:
Area: ${area.name.en || area.name.ja}
Center: ${area.center.lat}, ${area.center.lng}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0].message.content;

      // Parse JSON response
      try {
        const parsed = JSON.parse(response);
        return parsed.trash_bins || [];
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('OpenAI research error:', error);
      return [];
    }
  }

  // Merge and validate results from multiple AI sources
  async mergeAndValidateResults(geminiResults, openaiResults) {
    const merged = new Map();

    // Process all results
    const allResults = [...(geminiResults || []), ...(openaiResults || [])];

    for (const result of allResults) {
      if (!this.validateTrashBinData(result)) continue;

      // Generate unique key based on location
      const key = `${result.location.lat.toFixed(6)}_${result.location.lng.toFixed(6)}`;

      if (merged.has(key)) {
        // Merge with existing entry
        const existing = merged.get(key);
        merged.set(key, this.mergeTrashBinData(existing, result));
      } else {
        merged.set(key, result);
      }
    }

    return Array.from(merged.values());
  }

  // Validate trash bin data
  validateTrashBinData(data) {
    return (
      data
      && data.location
      && typeof data.location.lat === 'number'
      && typeof data.location.lng === 'number'
      && data.location.lat >= -90 && data.location.lat <= 90
      && data.location.lng >= -180 && data.location.lng <= 180
      && data.trash_types && Array.isArray(data.trash_types)
      && data.facility_type
    );
  }

  // Merge trash bin data from multiple sources
  mergeTrashBinData(existing, newData) {
    return {
      ...existing,
      ...newData,
      trash_types: [...new Set([...existing.trash_types, ...newData.trash_types])],
      source_count: (existing.source_count || 1) + 1,
      confidence: Math.min(1, (existing.confidence || 0.5) + 0.25)
    };
  }

  // Update trash bins in database
  async updateTrashBins(trashBins) {
    let updateCount = 0;

    for (const trashBin of trashBins) {
      try {
        const exists = await this.checkTrashBinExists(trashBin.location);

        if (exists) {
          await this.updateExistingTrashBin(exists.id, trashBin);
        } else {
          await this.createNewTrashBin(trashBin);
        }

        updateCount++;
      } catch (error) {
        logger.error('Failed to update trash bin:', error);
      }
    }

    return updateCount;
  }

  // Check if trash bin exists at location using Haversine distance
  async checkTrashBinExists(location) {
    const db = await initSQLiteDB();
    
    const result = await db.get(`
      SELECT 
        rowid as id,
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
        AND (
          6371000 * 2 * ASIN(
            SQRT(
              POWER(SIN((? - lat) * PI() / 180 / 2), 2) +
              COS(lat * PI() / 180) * COS(? * PI() / 180) *
              POWER(SIN((? - lng) * PI() / 180 / 2), 2)
            )
          )
        ) <= 50
      ORDER BY distance_meters ASC
      LIMIT 1
    `, [location.lat, location.lat, location.lng, location.lat, location.lat, location.lng]);

    return result || null;
  }

  // Create new trash bin
  async createNewTrashBin(data) {
    const db = await initSQLiteDB();
    
    const query = `
      INSERT INTO trash_bins (
        name, lat, lng, address, trash_types, facility_type,
        access_conditions, operating_hours, quality_score,
        trust_score, ai_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      this.formatMultilingualName(data.name),
      data.location.lat,
      data.location.lng,
      this.formatMultilingualAddress(data.address),
      JSON.stringify(data.trash_types),
      data.facility_type,
      data.access_conditions ? JSON.stringify({ ja: data.access_conditions, en: data.access_conditions, zh: data.access_conditions }) : null,
      data.operating_hours ? JSON.stringify({ ja: data.operating_hours, en: data.operating_hours, zh: data.operating_hours }) : null,
      data.confidence || 0.7,
      data.source_count > 1 ? 0.9 : 0.7,
      1 // ai_verified = true
    ];

    await db.run(query, params);
  }

  // Update existing trash bin
  async updateExistingTrashBin(id, data) {
    const db = await initSQLiteDB();
    
    const query = `
      UPDATE trash_bins 
      SET 
        trash_types = ?,
        quality_score = MAX(quality_score, ?),
        trust_score = MAX(trust_score, ?),
        last_verified = CURRENT_TIMESTAMP,
        ai_verified = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE rowid = ?
    `;

    const params = [
      JSON.stringify(data.trash_types),
      data.confidence || 0.7,
      data.source_count > 1 ? 0.9 : 0.7,
      id
    ];

    await db.run(query, params);
  }

  // Format multilingual name
  formatMultilingualName(name) {
    if (typeof name === 'object') return JSON.stringify(name);

    return JSON.stringify({
      ja: name,
      en: name,
      zh: name
    });
  }

  // Format multilingual address
  formatMultilingualAddress(address) {
    if (typeof address === 'object') return JSON.stringify(address);

    return JSON.stringify({
      ja: address,
      en: address,
      zh: address
    });
  }

  // Calculate quality score
  calculateQualityScore(results) {
    if (!results || results.length === 0) return 0;

    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length;
    const multiSourceRatio = results.filter((r) => r.source_count > 1).length / results.length;

    return Math.min(1, avgConfidence * 0.7 + multiSourceRatio * 0.3);
  }

  // Record research history
  async recordResearchHistory(data) {
    const db = await initSQLiteDB();
    
    const query = `
      INSERT INTO ai_research_history (
        cycle_id, research_type, target_area, ai_service,
        results_count, quality_score, execution_time_ms, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.cycleId,
      data.researchType,
      data.targetArea,
      data.aiService,
      data.resultsCount || 0,
      data.qualityScore || 0,
      data.executionTime || 0,
      data.status,
      data.errorMessage || null
    ];

    await db.run(query, params);
  }

  // Generate cycle ID
  generateCycleId() {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if using mock API keys
  isUsingMockKeys() {
    const googleKey = process.env.GOOGLE_AI_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';

    // モックモードを使用する条件：
    // 1. 両方のAPIキーが未設定またはデフォルト値
    // 2. テスト用のキー
    // 3. テスト環境
    const hasValidGoogleKey = googleKey && googleKey !== 'YOUR_GOOGLE_AI_API_KEY_HERE' && !googleKey.includes('test_');
    const hasValidOpenAIKey = openaiKey && openaiKey !== 'YOUR_OPENAI_API_KEY_HERE' && !openaiKey.includes('test_');
    
    return (
      (!hasValidGoogleKey && !hasValidOpenAIKey)
      || process.env.NODE_ENV === 'test'
    );
  }

  // Generate mock trash bins for development/testing
  generateMockTrashBins(area, aiService) {
    const baseLatLng = area.center;
    const mockBins = [];

    // Generate 2-4 mock trash bins around the area center
    const count = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < count; i++) {
      // Random offset within ~500m of center
      const latOffset = (Math.random() - 0.5) * 0.009; // ~500m
      const lngOffset = (Math.random() - 0.5) * 0.009;

      const facilityTypes = ['convenience_store', 'station', 'park', 'vending_machine'];
      const trashTypes = [
        ['burnable', 'plastic'],
        ['burnable', 'plastic_bottle', 'can'],
        ['plastic_bottle', 'can'],
        ['burnable']
      ];

      mockBins.push({
        name: `AI研究発見ゴミ箱 ${i + 1} (${aiService})`,
        location: {
          lat: baseLatLng.lat + latOffset,
          lng: baseLatLng.lng + lngOffset
        },
        address: `AI研究住所 ${i + 1}, ${area.name.ja || area.name.en}`,
        trash_types: trashTypes[Math.floor(Math.random() * trashTypes.length)],
        facility_type: facilityTypes[Math.floor(Math.random() * facilityTypes.length)],
        access_conditions: '誰でも利用可能',
        operating_hours: '24時間',
        confidence: 0.8 + Math.random() * 0.2,
        source_count: 1
      });
    }

    logger.info(`Generated ${count} mock trash bins for ${area.name.en || area.name.ja} using ${aiService}`);
    return mockBins;
  }

  // Test method for immediate AI research run
  async testResearch() {
    logger.info('Running test AI research...');
    
    try {
      const areas = await this.getAllAreas();
      if (areas.length > 0) {
        const testArea = areas[0]; // Test with first area
        await this.researchArea(testArea, `test_${Date.now()}`);
        logger.info('Test AI research completed successfully');
      } else {
        logger.warn('No areas found for testing');
      }
    } catch (error) {
      logger.error('Test AI research failed:', error);
      throw error;
    }
  }
}

module.exports = new AIResearchServiceSQLite();
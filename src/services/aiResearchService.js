const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { pgPool } = require('../config/database');
const logger = require('../utils/logger');
const areaService = require('./areaService');

class AIResearchService {
  constructor() {
    // Check if we're in test/development mode with mock API keys
    this.isMockMode = this.isUsingMockKeys();
    
    if (this.isMockMode) {
      logger.info('AI Research Service: Running in mock mode');
      this.geminiClient = null;
      this.openaiClient = null;
    } else {
      // Initialize AI clients
      this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    this.researchPrompt = `
You are an AI assistant specialized in finding and verifying trash bin locations in Japan.
Your task is to research and provide accurate information about public trash bins in the specified area.

For each trash bin found, provide:
1. Exact location (address or landmark)
2. Types of trash accepted (burnable, plastic bottles, cans, etc.)
3. Facility type (convenience store, station, park, etc.)
4. Access conditions (public access, customers only, etc.)
5. Operating hours if applicable
6. Any additional relevant information

Focus on accuracy and verify information from multiple sources when possible.
Provide the response in JSON format.
`;
  }

  // Run weekly AI research update
  async runWeeklyUpdate() {
    const cycleId = this.generateCycleId();
    logger.info(`Starting AI research cycle: ${cycleId}`);

    try {
      // Get all active areas
      const areas = await areaService.getAllAreas();
      
      for (const area of areas) {
        await this.researchArea(area, cycleId);
      }
      
      logger.info(`AI research cycle completed: ${cycleId}`);
    } catch (error) {
      logger.error('AI research cycle failed:', error);
      throw error;
    }
  }

  // Research specific area
  async researchArea(area, cycleId) {
    const startTime = Date.now();
    
    try {
      // Record research start
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: area.boundary,
        aiService: 'combined',
        status: 'in_progress'
      });

      // Run research with both AI services
      const [geminiResults, openaiResults] = await Promise.all([
        this.researchWithGemini(area),
        this.researchWithOpenAI(area)
      ]);

      // Merge and validate results
      const mergedResults = await this.mergeAndValidateResults(geminiResults, openaiResults);
      
      // Update database with new findings
      const updateCount = await this.updateTrashBins(mergedResults);

      // Record research completion
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: area.boundary,
        aiService: 'combined',
        resultsCount: updateCount,
        qualityScore: this.calculateQualityScore(mergedResults),
        executionTime: Date.now() - startTime,
        status: 'completed'
      });

      logger.info(`Area research completed: ${area.name.en}, found ${updateCount} trash bins`);
    } catch (error) {
      // Record research failure
      await this.recordResearchHistory({
        cycleId,
        researchType: 'area_research',
        targetArea: area.boundary,
        aiService: 'combined',
        status: 'failed',
        errorMessage: error.message,
        executionTime: Date.now() - startTime
      });

      logger.error(`Area research failed: ${area.name.en}`, error);
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
        return JSON.parse(text);
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
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.researchPrompt
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
        return JSON.parse(response);
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
      data &&
      data.location &&
      typeof data.location.lat === 'number' &&
      typeof data.location.lng === 'number' &&
      data.location.lat >= -90 && data.location.lat <= 90 &&
      data.location.lng >= -180 && data.location.lng <= 180 &&
      data.trash_types && Array.isArray(data.trash_types) &&
      data.facility_type
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

  // Check if trash bin exists at location
  async checkTrashBinExists(location) {
    const query = `
      SELECT id 
      FROM trash_bins 
      WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, 50)
      LIMIT 1
    `;
    
    const result = await pgPool.query(query, [location.lng, location.lat]);
    return result.rows[0] || null;
  }

  // Create new trash bin
  async createNewTrashBin(data) {
    const query = `
      INSERT INTO trash_bins (
        name, location, address, trash_types, facility_type,
        access_conditions, operating_hours, quality_score,
        trust_score, ai_verified
      ) VALUES (
        $1, ST_MakePoint($2, $3)::geography, $4, $5, $6,
        $7, $8, $9, $10, true
      )
    `;
    
    const params = [
      this.formatMultilingualName(data.name),
      data.location.lng,
      data.location.lat,
      this.formatMultilingualAddress(data.address),
      JSON.stringify(data.trash_types),
      data.facility_type,
      data.access_conditions ? JSON.stringify(data.access_conditions) : null,
      data.operating_hours ? JSON.stringify(data.operating_hours) : null,
      data.confidence || 0.7,
      data.source_count > 1 ? 0.9 : 0.7
    ];
    
    await pgPool.query(query, params);
  }

  // Update existing trash bin
  async updateExistingTrashBin(id, data) {
    const query = `
      UPDATE trash_bins 
      SET 
        trash_types = $1,
        quality_score = GREATEST(quality_score, $2),
        trust_score = GREATEST(trust_score, $3),
        last_verified = CURRENT_TIMESTAMP,
        ai_verified = true
      WHERE id = $4
    `;
    
    const params = [
      JSON.stringify(data.trash_types),
      data.confidence || 0.7,
      data.source_count > 1 ? 0.9 : 0.7,
      id
    ];
    
    await pgPool.query(query, params);
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
    const multiSourceRatio = results.filter(r => r.source_count > 1).length / results.length;
    
    return Math.min(1, avgConfidence * 0.7 + multiSourceRatio * 0.3);
  }

  // Record research history
  async recordResearchHistory(data) {
    const query = `
      INSERT INTO ai_research_history (
        cycle_id, research_type, target_area, ai_service,
        results_count, quality_score, execution_time, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::interval, $8, $9)
    `;
    
    const params = [
      data.cycleId,
      data.researchType,
      data.targetArea,
      data.aiService,
      data.resultsCount || 0,
      data.qualityScore || 0,
      `${data.executionTime || 0} milliseconds`,
      data.status,
      data.errorMessage || null
    ];
    
    await pgPool.query(query, params);
  }

  // Generate cycle ID
  generateCycleId() {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if using mock API keys
  isUsingMockKeys() {
    const googleKey = process.env.GOOGLE_AI_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';
    
    return (
      googleKey.includes('test_') || 
      openaiKey.includes('test_') ||
      googleKey === 'YOUR_GOOGLE_AI_API_KEY_HERE' ||
      openaiKey === 'YOUR_OPENAI_API_KEY_HERE' ||
      process.env.NODE_ENV === 'test'
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
        name: `Mock Trash Bin ${i + 1} (${aiService})`,
        location: {
          lat: baseLatLng.lat + latOffset,
          lng: baseLatLng.lng + lngOffset
        },
        address: `Mock Address ${i + 1}, ${area.name.ja || area.name.en}`,
        trash_types: trashTypes[Math.floor(Math.random() * trashTypes.length)],
        facility_type: facilityTypes[Math.floor(Math.random() * facilityTypes.length)],
        access_conditions: 'Public access',
        operating_hours: '24/7',
        confidence: 0.8 + Math.random() * 0.2,
        source_count: 1
      });
    }
    
    logger.info(`Generated ${count} mock trash bins for ${area.name.en || area.name.ja} using ${aiService}`);
    return mockBins;
  }
}

module.exports = new AIResearchService();
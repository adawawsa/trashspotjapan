const express = require('express');

const router = express.Router();
const aiResearchService = require('../services/aiResearchService');
const logger = require('../utils/logger');

// Test AI research manually
router.post('/test-research', async (req, res, next) => {
  try {
    logger.info('Manual AI research test started');

    // Run a limited research test
    await aiResearchService.runWeeklyUpdate();

    res.json({
      status: 'success',
      message: 'AI research test completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI research test failed:', error);
    next(error);
  }
});

// Get AI research history
router.get('/research-history', async (req, res, next) => {
  try {
    // This would normally query the ai_research_history table
    // For now, return a placeholder response
    res.json({
      status: 'success',
      data: {
        history: [],
        count: 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get AI service status
router.get('/status', async (req, res, next) => {
  try {
    const status = {
      mock_mode: aiResearchService.isMockMode,
      google_ai_configured: !!process.env.GOOGLE_AI_API_KEY
        && !process.env.GOOGLE_AI_API_KEY.includes('test_')
        && process.env.GOOGLE_AI_API_KEY !== 'YOUR_GOOGLE_AI_API_KEY_HERE',
      openai_configured: !!process.env.OPENAI_API_KEY
        && !process.env.OPENAI_API_KEY.includes('test_')
        && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE',
      last_update: null, // Would be fetched from database
      next_scheduled_update: '2025-06-09T02:00:00.000Z' // Next Monday 2 AM
    };

    res.json({
      status: 'success',
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

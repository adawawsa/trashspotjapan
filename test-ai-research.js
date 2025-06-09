require('dotenv').config();
const aiResearchService = require('./src/services/aiResearchService');
const logger = require('./src/utils/logger');

const testAIResearch = async () => {
  try {
    logger.info('AI研究機能のテストを開始します...');
    logger.info('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
    logger.info('Mock mode:', aiResearchService.isMockMode);
    
    // テスト用AI研究の実行
    await aiResearchService.testResearch();
    
    logger.info('AI研究のテストが正常に完了しました');
    process.exit(0);
  } catch (error) {
    logger.error('AI研究のテスト中にエラーが発生しました:', error);
    process.exit(1);
  }
};

testAIResearch();
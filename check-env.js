require('dotenv').config();

console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI API Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'N/A');
console.log('Google AI API Key:', process.env.GOOGLE_AI_API_KEY || 'N/A');

const aiService = require('./src/services/aiResearchService');
console.log('AI Service is in mock mode:', aiService.isMockMode);
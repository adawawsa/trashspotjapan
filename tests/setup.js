// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock Redis client
jest.mock('../src/config/database', () => ({
  pgPool: {
    query: jest.fn(),
  },
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
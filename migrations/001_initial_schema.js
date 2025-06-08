const fs = require('fs');
const path = require('path');
const { pgPool } = require('../src/config/database');
const logger = require('../src/utils/logger');

const up = async () => {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pgPool.query(schemaSql);
    
    logger.info('Initial schema migration completed successfully');
  } catch (error) {
    logger.error('Error in initial schema migration:', error);
    throw error;
  }
};

const down = async () => {
  try {
    // Drop all tables in reverse order
    const dropQueries = [
      'DROP TABLE IF EXISTS data_sources CASCADE;',
      'DROP TABLE IF EXISTS user_feedback CASCADE;',
      'DROP TABLE IF EXISTS quality_metrics CASCADE;',
      'DROP TABLE IF EXISTS ai_research_history CASCADE;',
      'DROP TABLE IF EXISTS areas CASCADE;',
      'DROP TABLE IF EXISTS trash_bins CASCADE;',
      'DROP TYPE IF EXISTS research_status;',
      'DROP TYPE IF EXISTS facility_type;',
      'DROP TYPE IF EXISTS trash_type;',
      'DROP EXTENSION IF EXISTS postgis;',
      'DROP EXTENSION IF EXISTS "uuid-ossp";'
    ];

    for (const query of dropQueries) {
      await pgPool.query(query);
    }

    logger.info('Initial schema rollback completed successfully');
  } catch (error) {
    logger.error('Error in initial schema rollback:', error);
    throw error;
  }
};

module.exports = { up, down };
const fs = require('fs');
const path = require('path');
const { pgPool } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Create migrations table if not exists
const createMigrationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pgPool.query(query);
};

// Get executed migrations
const getExecutedMigrations = async () => {
  const query = 'SELECT filename FROM migrations ORDER BY executed_at';
  const result = await pgPool.query(query);
  return result.rows.map(row => row.filename);
};

// Record migration execution
const recordMigration = async (filename) => {
  const query = 'INSERT INTO migrations (filename) VALUES ($1)';
  await pgPool.query(query, [filename]);
};

// Run migrations
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'run.js')
      .sort();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        logger.info(`Running migration: ${file}`);
        
        const migration = require(path.join(migrationsDir, file));
        
        // Start transaction
        const client = await pgPool.connect();
        try {
          await client.query('BEGIN');
          
          // Run migration
          await migration.up();
          
          // Record migration
          await recordMigration(file);
          
          await client.query('COMMIT');
          logger.info(`Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }
    
    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
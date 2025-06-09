const { initSQLiteDB } = require('../src/config/database-sqlite');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    console.log('Initializing SQLite database...');
    
    // Initialize database connection
    const db = await initSQLiteDB();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'init-sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute entire schema at once
    await db.exec(schema);
    
    console.log('✅ Database schema created successfully');
    console.log('📊 Database initialized at: data/trashspot.db');
    
    // Verify tables were created
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `);
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
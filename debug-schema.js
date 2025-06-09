const { initSQLiteDB } = require('./src/config/database-sqlite');

const checkSchema = async () => {
  try {
    const db = await initSQLiteDB();
    const schema = await db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='ai_research_history'");
    console.log('AI research history table schema:', schema[0] ? schema[0].sql : 'Table does not exist');
    
    const columns = await db.all("PRAGMA table_info(ai_research_history)");
    console.log('AI research history table columns:', columns);
  } catch (error) {
    console.error('Error:', error);
  }
};

checkSchema();
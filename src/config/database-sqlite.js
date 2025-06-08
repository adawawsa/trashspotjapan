const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// SQLite database configuration for development
let db;

const initSQLiteDB = async () => {
  if (db) return db;

  try {
    db = await open({
      filename: path.join(__dirname, '../../data/trashspot.db'),
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trash_bins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        address TEXT,
        trash_types TEXT,
        facility_type TEXT NOT NULL,
        access_conditions TEXT,
        operating_hours TEXT,
        quality_score REAL DEFAULT 0.5,
        trust_score REAL DEFAULT 0.5,
        last_verified DATETIME DEFAULT CURRENT_TIMESTAMP,
        ai_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_feedback (
        id TEXT PRIMARY KEY,
        trash_bin_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        feedback_content TEXT,
        user_lat REAL,
        user_lng REAL,
        image_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trash_bin_id) REFERENCES trash_bins(id)
      );

      CREATE TABLE IF NOT EXISTS areas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        center_lat REAL NOT NULL,
        center_lng REAL NOT NULL,
        zoom_level INTEGER DEFAULT 13,
        boundary_json TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
};

// Simple in-memory cache for Redis replacement
const cache = new Map();
const cacheExpiry = new Map();

const mockRedisClient = {
  get: async (key) => {
    const expiry = cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      cache.delete(key);
      cacheExpiry.delete(key);
      return null;
    }
    return cache.get(key) || null;
  },

  set: async (key, value, options = {}) => {
    cache.set(key, value);
    if (options.EX) {
      cacheExpiry.set(key, Date.now() + (options.EX * 1000));
    }
    return 'OK';
  },

  del: async (key) => {
    cache.delete(key);
    cacheExpiry.delete(key);
    return 1;
  }
};

module.exports = {
  initSQLiteDB,
  mockRedisClient
};

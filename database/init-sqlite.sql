-- SQLite Database Schema for Trash Spot Japan
-- This is a simplified version without PostGIS (no geographic functions)

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- JSON string for multilingual names
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  zoom_level INTEGER DEFAULT 15,
  boundary_geojson TEXT, -- JSON string for boundary
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trash bins table
CREATE TABLE IF NOT EXISTS trash_bins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- JSON string for multilingual names
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT, -- JSON string for multilingual addresses
  trash_types TEXT NOT NULL, -- JSON array of accepted trash types
  facility_type TEXT NOT NULL, -- enum: station, convenience_store, park, etc.
  access_conditions TEXT, -- JSON string for multilingual access conditions
  operating_hours TEXT, -- JSON string for multilingual operating hours
  quality_score REAL DEFAULT 0.5,
  trust_score REAL DEFAULT 0.5,
  verification_status TEXT DEFAULT 'unverified', -- enum: verified, unverified, disputed
  last_verified DATETIME,
  ai_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trash_bin_id INTEGER NOT NULL,
  feedback_type TEXT NOT NULL, -- enum: correct, incorrect_location, missing, wrong_info, other
  feedback_content TEXT,
  user_lat REAL,
  user_lng REAL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trash_bin_id) REFERENCES trash_bins(id) ON DELETE CASCADE
);

-- Quality metrics table
CREATE TABLE IF NOT EXISTS quality_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trash_bin_id INTEGER NOT NULL,
  accuracy_score REAL DEFAULT 0.5,
  freshness_score REAL DEFAULT 0.5,
  reliability_score REAL DEFAULT 0.5,
  source_count INTEGER DEFAULT 1,
  verification_method TEXT DEFAULT 'user_feedback', -- enum: user_feedback, ai_verification, manual_verification
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trash_bin_id) REFERENCES trash_bins(id) ON DELETE CASCADE
);

-- Data sources table (for tracking where data came from)
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trash_bin_id INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- enum: user_input, ai_research, government_data, crowdsource
  source_identifier TEXT, -- URL, API endpoint, user ID, etc.
  reliability_score REAL DEFAULT 0.5,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trash_bin_id) REFERENCES trash_bins(id) ON DELETE CASCADE
);

-- AI research history table
CREATE TABLE IF NOT EXISTS ai_research_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id TEXT NOT NULL,
  research_type TEXT NOT NULL, -- enum: area_research, verification, data_enhancement
  target_area TEXT, -- JSON string for area definition
  ai_service TEXT NOT NULL, -- enum: openai, google_ai, combined
  results_count INTEGER DEFAULT 0,
  quality_score REAL DEFAULT 0.0,
  execution_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- enum: pending, in_progress, completed, failed
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trash_bins_location ON trash_bins(lat, lng);
CREATE INDEX IF NOT EXISTS idx_trash_bins_facility_type ON trash_bins(facility_type);
CREATE INDEX IF NOT EXISTS idx_trash_bins_active ON trash_bins(is_active);
CREATE INDEX IF NOT EXISTS idx_user_feedback_trash_bin ON user_feedback(trash_bin_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_trash_bin ON quality_metrics(trash_bin_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_trash_bin ON data_sources(trash_bin_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_areas_timestamp 
  AFTER UPDATE ON areas 
  BEGIN 
    UPDATE areas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_trash_bins_timestamp 
  AFTER UPDATE ON trash_bins 
  BEGIN 
    UPDATE trash_bins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
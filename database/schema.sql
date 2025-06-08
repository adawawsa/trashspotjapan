-- Trash Spot Japan Database Schema
-- PostgreSQL Database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE trash_type AS ENUM (
    'burnable',
    'plastic_bottle',
    'can',
    'glass',
    'paper',
    'plastic',
    'other'
);

CREATE TYPE facility_type AS ENUM (
    'convenience_store',
    'station',
    'park',
    'vending_machine',
    'shopping_mall',
    'restaurant',
    'public_facility',
    'other'
);

CREATE TYPE research_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);

-- Trash bins table
CREATE TABLE trash_bins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name JSONB NOT NULL DEFAULT '{"ja": "", "en": "", "zh": ""}',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address JSONB NOT NULL DEFAULT '{"ja": "", "en": "", "zh": ""}',
    trash_types JSONB NOT NULL DEFAULT '[]',
    facility_type facility_type NOT NULL,
    access_conditions JSONB DEFAULT NULL,
    operating_hours JSONB DEFAULT NULL,
    quality_score DECIMAL(3, 2) NOT NULL DEFAULT 0.00 CHECK (quality_score >= 0 AND quality_score <= 1),
    trust_score DECIMAL(3, 2) NOT NULL DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 1),
    last_verified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ai_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location
CREATE INDEX idx_trash_bins_location ON trash_bins USING GIST(location);

-- Create indexes for common queries
CREATE INDEX idx_trash_bins_facility_type ON trash_bins(facility_type);
CREATE INDEX idx_trash_bins_quality_score ON trash_bins(quality_score);
CREATE INDEX idx_trash_bins_is_active ON trash_bins(is_active);
CREATE INDEX idx_trash_bins_trash_types ON trash_bins USING GIN(trash_types);

-- AI research history table
CREATE TABLE ai_research_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL,
    research_type VARCHAR(50) NOT NULL,
    target_area GEOGRAPHY(POLYGON, 4326) NOT NULL,
    ai_service VARCHAR(50) NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    quality_score DECIMAL(3, 2) NOT NULL DEFAULT 0.00 CHECK (quality_score >= 0 AND quality_score <= 1),
    execution_time INTERVAL NOT NULL,
    status research_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for AI research history
CREATE INDEX idx_ai_research_history_cycle_id ON ai_research_history(cycle_id);
CREATE INDEX idx_ai_research_history_status ON ai_research_history(status);
CREATE INDEX idx_ai_research_history_created_at ON ai_research_history(created_at);

-- Quality metrics table
CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trash_bin_id UUID NOT NULL REFERENCES trash_bins(id) ON DELETE CASCADE,
    accuracy_score DECIMAL(3, 2) NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    freshness_score DECIMAL(3, 2) NOT NULL CHECK (freshness_score >= 0 AND freshness_score <= 1),
    reliability_score DECIMAL(3, 2) NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 1),
    source_count INTEGER NOT NULL DEFAULT 0,
    verification_method VARCHAR(50) NOT NULL,
    user_feedback_score DECIMAL(3, 2) CHECK (user_feedback_score >= 0 AND user_feedback_score <= 1),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for quality metrics
CREATE INDEX idx_quality_metrics_trash_bin_id ON quality_metrics(trash_bin_id);
CREATE INDEX idx_quality_metrics_measured_at ON quality_metrics(measured_at);

-- User feedback table
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trash_bin_id UUID NOT NULL REFERENCES trash_bins(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL,
    feedback_content TEXT,
    user_location GEOGRAPHY(POINT, 4326),
    image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user feedback
CREATE INDEX idx_user_feedback_trash_bin_id ON user_feedback(trash_bin_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at);

-- Data sources table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trash_bin_id UUID NOT NULL REFERENCES trash_bins(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    source_data JSONB,
    reliability_score DECIMAL(3, 2) NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 1),
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for data sources
CREATE INDEX idx_data_sources_trash_bin_id ON data_sources(trash_bin_id);
CREATE INDEX idx_data_sources_type ON data_sources(source_type);

-- Areas table for managing search areas
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name JSONB NOT NULL DEFAULT '{"ja": "", "en": "", "zh": ""}',
    boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
    center GEOGRAPHY(POINT, 4326) NOT NULL,
    zoom_level INTEGER NOT NULL DEFAULT 13,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for areas
CREATE INDEX idx_areas_boundary ON areas USING GIST(boundary);
CREATE INDEX idx_areas_center ON areas USING GIST(center);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trash_bins_updated_at BEFORE UPDATE ON trash_bins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate overall quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(trash_bin_id UUID)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
    avg_score DECIMAL(3, 2);
BEGIN
    SELECT 
        (AVG(accuracy_score) + AVG(freshness_score) + AVG(reliability_score)) / 3
    INTO avg_score
    FROM quality_metrics
    WHERE quality_metrics.trash_bin_id = calculate_quality_score.trash_bin_id
    AND measured_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RETURN COALESCE(avg_score, 0.50);
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby trash bins
CREATE OR REPLACE FUNCTION find_nearby_trash_bins(
    user_location GEOGRAPHY(POINT, 4326),
    radius_meters INTEGER DEFAULT 500,
    trash_types_filter JSONB DEFAULT NULL,
    facility_types_filter facility_type[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name JSONB,
    location GEOGRAPHY(POINT, 4326),
    distance_meters DOUBLE PRECISION,
    trash_types JSONB,
    facility_type facility_type,
    quality_score DECIMAL(3, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tb.id,
        tb.name,
        tb.location,
        ST_Distance(tb.location, user_location) AS distance_meters,
        tb.trash_types,
        tb.facility_type,
        tb.quality_score
    FROM trash_bins tb
    WHERE 
        tb.is_active = TRUE
        AND ST_DWithin(tb.location, user_location, radius_meters)
        AND (trash_types_filter IS NULL OR tb.trash_types @> trash_types_filter)
        AND (facility_types_filter IS NULL OR tb.facility_type = ANY(facility_types_filter))
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
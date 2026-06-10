-- OrchaScan 2.0 — Initial Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: scans
-- ============================================
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status flow: pending → uploading → generating_3d → analyzing → completed | failed

    -- Image URLs (Supabase Storage public URLs)
    image_front_url TEXT,
    image_back_url TEXT,
    image_left_url TEXT,
    image_right_url TEXT,

    -- 3D Model
    model_url TEXT,
    tripo_task_id VARCHAR(255),

    -- Error handling
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: scan_results
-- ============================================
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,

    -- Counting results
    apple_count INTEGER NOT NULL DEFAULT 0,
    detected_points INTEGER NOT NULL DEFAULT 0,

    -- Analysis parameters used
    r_target INTEGER DEFAULT 180,
    g_target INTEGER DEFAULT 20,
    b_target INTEGER DEFAULT 20,
    color_tolerance INTEGER DEFAULT 70,
    eps_value FLOAT,
    min_samples INTEGER DEFAULT 5,

    -- Cluster data (centers, sizes, etc.)
    cluster_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scans_updated_at
    BEFORE UPDATE ON scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Supabase Storage Buckets
-- Run these separately or create via Dashboard
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scan-models', 'scan-models', true);

-- Storage Policies (allow public read, authenticated write)
-- CREATE POLICY "Public read scan-images" ON storage.objects FOR SELECT USING (bucket_id = 'scan-images');
-- CREATE POLICY "Public read scan-models" ON storage.objects FOR SELECT USING (bucket_id = 'scan-models');
-- CREATE POLICY "Service write scan-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scan-images');
-- CREATE POLICY "Service write scan-models" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scan-models');

-- OrchaScan 2.0 — Secure Schema (RLS & user_id)
-- Run this in your Supabase SQL Editor

-- 1. Add user_id column to existing tables
ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- (Optional) For existing records, we set them to a default user or leave them NULL
-- Since user_id will be required moving forward, it's highly recommended to make it NOT NULL
-- after ensuring no orphan records exist.
-- To enforce this for new entries:
-- ALTER TABLE scans ALTER COLUMN user_id SET NOT NULL; 
-- Note: We leave it nullable initially to prevent failing if existing rows exist.

-- 2. Enable Row Level Security (RLS)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for scans
-- Users can view their own scans
CREATE POLICY "Users can view own scans" ON scans
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans
CREATE POLICY "Users can update own scans" ON scans
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans" ON scans
    FOR DELETE USING (auth.uid() = user_id);


-- 4. Create Policies for scan_results
-- Since scan_results are linked to scans, we check the scan's user_id.
-- Alternatively, we can add user_id to scan_results directly, but linking is safer.
-- We'll allow users to view/modify results if they own the parent scan.
CREATE POLICY "Users can view own scan results" ON scan_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scans
            WHERE scans.id = scan_results.scan_id
            AND scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own scan results" ON scan_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM scans
            WHERE scans.id = scan_results.scan_id
            AND scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own scan results" ON scan_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM scans
            WHERE scans.id = scan_results.scan_id
            AND scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own scan results" ON scan_results
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM scans
            WHERE scans.id = scan_results.scan_id
            AND scans.user_id = auth.uid()
        )
    );

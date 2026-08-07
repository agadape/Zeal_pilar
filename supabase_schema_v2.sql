-- ================================================================
-- PRODUCTION UPGRADE MIGRATION (v2) - TUGU LEADERSHIP PORTAL
-- Run this script in Supabase SQL Editor
-- ================================================================

-- 1. INDEXES FOR HIGH-PERFORMANCE SEARCH & JOINS
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_person ON group_members(person_id);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_group_week ON weekly_stats(group_id, week_date);
CREATE INDEX IF NOT EXISTS idx_bible_study_logs_person ON bible_study_logs(person_id);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);

-- 2. UNIQUE CONSTRAINT PREVENTING DUPLICATE MINGGUAN REPORTS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uniq_group_week'
    ) THEN
        ALTER TABLE weekly_stats ADD CONSTRAINT uniq_group_week UNIQUE (group_id, week_date);
    END IF;
END $$;

-- 3. SOFT DELETE & UPDATED_AT TIMESTAMP ON PEOPLE & GROUPS
ALTER TABLE people ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE people ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. NORMALIZED RELATIONAL TABLES FOR ABSENCES & STUDY PROGRESS
CREATE TABLE IF NOT EXISTS weekly_stat_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_stat_id UUID REFERENCES weekly_stats(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    person_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_stat_study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_stat_id UUID REFERENCES weekly_stats(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    person_name TEXT NOT NULL,
    stage TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE weekly_stat_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stat_study_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read/Write weekly_stat_absences'
    ) THEN
        CREATE POLICY "Public Read/Write weekly_stat_absences" ON weekly_stat_absences FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read/Write weekly_stat_study_progress'
    ) THEN
        CREATE POLICY "Public Read/Write weekly_stat_study_progress" ON weekly_stat_study_progress FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

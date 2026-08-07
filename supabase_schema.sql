-- ========================================================
-- TUGU LEADERSHIP PORTAL - SUPABASE POSTGRESQL SCHEMA
-- ZEAL Youth & Campus Ministry (GKDI Jogja)
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PEOPLE TABLE (Tambah Orang)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('BROTHER', 'SISTER')) NOT NULL,
    phone_number TEXT,
    campus TEXT,
    status TEXT CHECK (status IN ('LEADER', 'DISCIPLE', 'BIBLE_STUDY', 'VISITOR', 'WEAK', 'INACTIVE')) DEFAULT 'DISCIPLE',
    study_stage TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GROUPS TABLE (Small Groups / PDG)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('BROTHER', 'SISTER')) NOT NULL,
    leader_id UUID REFERENCES people(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GROUP MEMBERS TABLE (Many-to-Many mapping)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, person_id)
);

-- 4. WEEKLY STATS TABLE (Statistika Minggu)
CREATE TABLE IF NOT EXISTS weekly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    week_date DATE NOT NULL,
    active_disciples_count INT DEFAULT 0,
    missing_ibadah_count INT DEFAULT 0,
    missing_reasons JSONB DEFAULT '[]'::jsonb,
    study_progress JSONB DEFAULT '[]'::jsonb,
    reachout_count INT DEFAULT 0,
    sunday_visitors_count INT DEFAULT 0,
    event_visitors_count INT DEFAULT 0,
    baptisms_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('PDA_BRO', 'PDA_SIS', 'PDA_COMBINED', 'DOA_YOUTH', 'PW_NIGHT', 'RETREAT', 'PMK_OUTREACH')) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENT ROSTERS TABLE
CREATE TABLE IF NOT EXISTS event_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Allow public access for Tugu Leaders demo/app)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on people" ON people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on weekly_stats" ON weekly_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on event_rosters" ON event_rosters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- SEED INITIAL DATA FOR ZEAL TUGU LEADERS
INSERT INTO people (full_name, gender, campus, status, notes) VALUES
('Om Hendra (Babeh)', 'BROTHER', 'Staff Pastor', 'LEADER', 'Senior Leader / Pastor ZEAL Jogja'),
('Bang panca Satriadi', 'BROTHER', 'BPC Staff', 'LEADER', 'Senior Ministry Leader BPC'),
('Kak Lusi', 'SISTER', 'BPC Staff', 'LEADER', 'Senior Ministry Leader BPC'),
('Bang Daniel', 'BROTHER', 'Campus Coordinator', 'LEADER', 'Campus Ministry Coordinator'),
('Kak Afuk', 'BROTHER', 'STIPRAM / General', 'LEADER', 'Praise & Worship & Tech Coordinator'),
('Ka Nike', 'SISTER', 'General', 'LEADER', 'Small Group Leader One Way'),
('Kak Cia', 'SISTER', 'Atma Jaya', 'LEADER', 'Small Group Leader & PMK Outreach'),
('Kak Enrika', 'SISTER', 'UGM', 'LEADER', 'Small Group Leader Eve''s Circle'),
('Ikan', 'BROTHER', 'UNY', 'LEADER', 'Small Group Leader Ayam Bumbu Hitam'),
('Aikoh', 'SISTER', 'Atma Jaya', 'LEADER', 'PMK Outreach Coordinator'),
('Jouban', 'BROTHER', 'UGM', 'LEADER', 'Doa Bersama Tech Operator'),
('Chessy Zeal', 'SISTER', 'General', 'LEADER', 'Small Group Leader One Way'),
('Bang Beni', 'BROTHER', 'General', 'LEADER', 'P&W Night MC & Leader'),
('Kak Fitri', 'SISTER', 'General', 'LEADER', 'Small Group Leader Grace Bloom'),
('Bang Yosua', 'BROTHER', 'General', 'LEADER', 'Brother Small Group Leader'),
('Axel', 'BROTHER', 'UGM', 'BIBLE_STUDY', 'Progres: Murid'),
('Geri', 'BROTHER', 'UNY', 'BIBLE_STUDY', 'Progres: Murid'),
('Sherly', 'SISTER', 'Atma Jaya', 'BIBLE_STUDY', 'Progres: Tujuan Hidup'),
('Fina', 'SISTER', 'General', 'WEAK', 'Perlu di follow up personal')
ON CONFLICT DO NOTHING;

-- SEED INITIAL SMALL GROUPS
INSERT INTO groups (group_name, category) VALUES
('Eve''s Circle', 'SISTER'),
('Grace Bloom', 'SISTER'),
('One Way', 'SISTER'),
('LOL', 'SISTER'),
('GOF', 'SISTER'),
('Pelita', 'BROTHER'),
('Hosea', 'BROTHER'),
('Ayam Bumbu Hitam', 'BROTHER')
ON CONFLICT DO NOTHING;

-- SEED INITIAL ANNOUNCEMENTS
INSERT INTO announcements (title, author_name, content, is_pinned) VALUES
('Welcome to Tugu Jogja Ministry Portal!', 'Bang Daniel', 'Halo kawan-kawan Tugu Leaders! Group Pilar official telah bertransisi menjadi Tugu. Mari gunakan website ini untuk input Statistika Minggu, koordinasi PDA, dan follow-up murid.', true),
('Visi Rumah Tuhan & Quiet Time', 'Om Hendra (Babeh)', 'Ingat selalu untuk membangun Rumah Tuhan dengan gairah dan kasih. Utamakan Saat Teduh harian dan perpuluhan tepat waktu.', true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- PRODUCTION UPGRADE MIGRATION (v3) - TUGU LEADERSHIP PORTAL
-- 1. Birthday & Spiritual Birthday Tracker
-- 2. Leader Handover & Tenure History Tracking Trigger
-- ================================================================

-- 1. COLUMNS FOR BIRTHDAY & BAPTISM DATE ON PEOPLE
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE people ADD COLUMN IF NOT EXISTS baptism_date DATE;

-- 2. VIEW FOR UPCOMING MILESTONES (BIRTHDAY & SPIRITUAL BIRTHDAY)
CREATE OR REPLACE VIEW upcoming_milestones AS
SELECT
    id AS person_id,
    full_name,
    gender,
    'BIRTHDAY' AS milestone_type,
    birth_date AS original_date,
    NULL::INT AS years_count,
    (DATE_TRUNC('year', CURRENT_DATE) + (birth_date - DATE_TRUNC('year', birth_date)))::DATE AS next_occurrence
FROM people
WHERE birth_date IS NOT NULL AND archived_at IS NULL

UNION ALL

SELECT
    id AS person_id,
    full_name,
    gender,
    'SPIRITUAL_BIRTHDAY' AS milestone_type,
    baptism_date AS original_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, baptism_date))::INT AS years_count,
    (DATE_TRUNC('year', CURRENT_DATE) + (baptism_date - DATE_TRUNC('year', baptism_date)))::DATE AS next_occurrence
FROM people
WHERE baptism_date IS NOT NULL AND archived_at IS NULL;

-- 3. GROUP LEADERSHIP HISTORY TABLE
CREATE TABLE IF NOT EXISTS group_leadership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES people(id) ON DELETE SET NULL,
    started_at DATE NOT NULL DEFAULT CURRENT_DATE,
    ended_at DATE,                    -- NULL = masih menjabat
    handover_reason TEXT,             -- 'GRADUATED', 'RELOCATED', 'ROTATION', 'OTHER'
    handover_notes TEXT,              -- catatan bebas dari admin
    transferred_by UUID REFERENCES people(id),  -- siapa yang approve handover
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leadership_history_group ON group_leadership_history(group_id, started_at);
ALTER TABLE group_leadership_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read/Write group_leadership_history'
    ) THEN
        CREATE POLICY "Public Read/Write group_leadership_history" ON group_leadership_history FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. TRIGGER FUNCTION FOR AUTO LOGGING LEADERSHIP CHANGE
CREATE OR REPLACE FUNCTION log_leadership_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
        -- Tutup periode leader lama
        IF OLD.leader_id IS NOT NULL THEN
            UPDATE group_leadership_history
            SET ended_at = CURRENT_DATE
            WHERE group_id = NEW.id
              AND leader_id = OLD.leader_id
              AND ended_at IS NULL;
        END IF;

        -- Buka periode leader baru
        IF NEW.leader_id IS NOT NULL THEN
            INSERT INTO group_leadership_history (group_id, leader_id, started_at)
            VALUES (NEW.id, NEW.leader_id, CURRENT_DATE);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DROP AND RE-CREATE TRIGGER TO AVOID DUPLICATES
DROP TRIGGER IF EXISTS trg_log_leadership_change ON groups;
CREATE TRIGGER trg_log_leadership_change
AFTER UPDATE OF leader_id ON groups
FOR EACH ROW
EXECUTE FUNCTION log_leadership_change();

-- 5. VIEW FOR LEADERSHIP TENURE REPORTING
CREATE OR REPLACE VIEW leadership_tenure AS
SELECT
    g.group_name,
    p.full_name AS leader_name,
    h.started_at,
    h.ended_at,
    COALESCE(h.ended_at, CURRENT_DATE) - h.started_at AS tenure_days,
    h.handover_reason
FROM group_leadership_history h
JOIN groups g ON g.id = h.group_id
JOIN people p ON p.id = h.leader_id
ORDER BY g.group_name, h.started_at;

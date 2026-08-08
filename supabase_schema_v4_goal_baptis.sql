-- ================================================================
-- ADD BAPTISM GOAL TO GROUPS
-- ================================================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS baptism_goal INT DEFAULT 0;

-- ============================================================================
-- TUGU DATA INTEGRITY BUGFIXES
-- Run after supabase_security_alignment.sql and supabase_dtree.sql.
-- Safe to run repeatedly.
-- ============================================================================

BEGIN;

-- saveWeeklyStat() uses ON CONFLICT (group_id, week_date). Fail with a clear
-- message instead of silently deleting historical duplicates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.weekly_stats
    GROUP BY group_id, week_date
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Ada weekly_stats duplikat untuk grup/tanggal yang sama. Rapikan duplikat sebelum menjalankan migrasi ini.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS weekly_stats_one_report_per_group_week
  ON public.weekly_stats (group_id, week_date);

-- The product invariant requires exactly two congregation roots. NOT VALID lets
-- an older installation with empty settings open the UI once and select both;
-- every new insert/update is still checked immediately.
ALTER TABLE public.dtree_settings
  DROP CONSTRAINT IF EXISTS dtree_requires_two_roots;
ALTER TABLE public.dtree_settings
  ADD CONSTRAINT dtree_requires_two_roots
  CHECK (brother_root_id IS NOT NULL AND sister_root_id IS NOT NULL) NOT VALID;

ALTER TABLE public.weekly_stats
  DROP CONSTRAINT IF EXISTS weekly_stats_non_negative_counts;
ALTER TABLE public.weekly_stats
  ADD CONSTRAINT weekly_stats_non_negative_counts CHECK (
    COALESCE(active_disciples_count, 0) >= 0
    AND COALESCE(missing_ibadah_count, 0) >= 0
    AND COALESCE(reachout_count, 0) >= 0
    AND COALESCE(sunday_visitors_count, 0) >= 0
    AND COALESCE(event_visitors_count, 0) >= 0
    AND COALESCE(baptisms_count, 0) >= 0
  ) NOT VALID;

ALTER TABLE public.bible_study_logs
  DROP CONSTRAINT IF EXISTS bible_study_week_positive;
ALTER TABLE public.bible_study_logs
  ADD CONSTRAINT bible_study_week_positive CHECK (week_number > 0) NOT VALID;

-- Repair leftovers from older soft-delete attempts so archived people no longer
-- inflate group totals or remain in the active tree.
UPDATE public.mentorship_relationships AS relationship
SET ended_at = CURRENT_DATE,
    end_reason = COALESCE(relationship.end_reason, 'Data jemaat diarsipkan'),
    updated_at = now()
WHERE relationship.ended_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.people AS person
    WHERE person.archived_at IS NOT NULL
      AND person.id IN (relationship.mentor_id, relationship.mentee_id)
  );

DELETE FROM public.group_members AS membership
USING public.people AS person
WHERE person.id = membership.person_id
  AND person.archived_at IS NOT NULL;

-- Archived accounts must immediately lose their RLS identity, including an old
-- Super Admin session that still has a valid auth token.
CREATE OR REPLACE FUNCTION public.get_auth_person_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT person.id
  FROM public.people AS person
  WHERE person.archived_at IS NULL
    AND (person.auth_user_id = auth.uid() OR person.auth_id = auth.uid())
  ORDER BY (person.auth_user_id = auth.uid()) DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_person_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_person_id() TO authenticated;

-- Archive people through one guarded operation. Direct UPDATE does not grant the
-- archived_at column to ordinary authenticated clients.
CREATE OR REPLACE FUNCTION public.archive_person(p_person_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya Super Admin yang dapat mengarsipkan data jemaat';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.groups
    WHERE leader_id = p_person_id AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Orang ini masih menjadi leader grup. Lakukan handover terlebih dahulu';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dtree_settings
    WHERE brother_root_id = p_person_id OR sister_root_id = p_person_id
  ) THEN
    RAISE EXCEPTION 'Orang ini masih menjadi Pemimpin Jemaat di d-Tree. Ganti root terlebih dahulu';
  END IF;

  DELETE FROM public.group_members WHERE person_id = p_person_id;

  UPDATE public.mentorship_relationships
  SET ended_at = CURRENT_DATE,
      end_reason = COALESCE(end_reason, 'Data jemaat diarsipkan'),
      updated_at = now()
  WHERE ended_at IS NULL
    AND (mentor_id = p_person_id OR mentee_id = p_person_id);

  UPDATE public.people
  SET archived_at = now(), updated_at = now()
  WHERE id = p_person_id AND archived_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data jemaat aktif tidak ditemukan';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_person(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_person(UUID) TO authenticated;

COMMIT;

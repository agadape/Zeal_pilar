-- ============================================================================
-- TUGU DATABASE ALIGNMENT & RLS HARDENING
-- Run once in Supabase SQL Editor after the existing schema migrations.
-- Safe to re-run: columns, functions, policies, and triggers are idempotent.
-- ============================================================================

BEGIN;

-- 1. Align the live schema with the application contract.
CREATE TABLE IF NOT EXISTS public.bible_study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  study_date DATE NOT NULL,
  lesson_topic TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER';
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.people(id) ON DELETE SET NULL;
ALTER TABLE public.weekly_stats ADD COLUMN IF NOT EXISTS reachouts_list JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.bible_study_logs ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.people(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_auth_user_id_unique
  ON public.people(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bible_study_logs_mentor ON public.bible_study_logs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON public.announcements(author_id);

-- 2. Backfill the canonical identity model: auth_user_id + role.
UPDATE public.people
SET auth_user_id = auth_id
WHERE auth_user_id IS NULL AND auth_id IS NOT NULL;

UPDATE public.people
SET role = 'SUPER_ADMIN'
WHERE is_admin = TRUE AND role IS DISTINCT FROM 'SUPER_ADMIN';

UPDATE public.people
SET is_admin = TRUE
WHERE role = 'SUPER_ADMIN' AND is_admin IS DISTINCT FROM TRUE;

UPDATE public.people AS person
SET role = 'GROUP_LEADER'
WHERE person.role IS DISTINCT FROM 'SUPER_ADMIN'
  AND EXISTS (
    SELECT 1 FROM public.groups AS ministry_group
    WHERE ministry_group.leader_id = person.id
  );

UPDATE public.announcements AS announcement
SET author_id = (
  SELECT person.id
  FROM public.people AS person
  WHERE lower(trim(person.full_name)) = lower(trim(announcement.author_name))
  ORDER BY person.created_at NULLS LAST
  LIMIT 1
)
WHERE announcement.author_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.people AS person
    WHERE lower(trim(person.full_name)) = lower(trim(announcement.author_name))
  );

-- 3. Canonical authorization helpers used by every RLS policy.
CREATE OR REPLACE FUNCTION public.get_auth_person_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT person.id
  FROM public.people AS person
  WHERE person.auth_user_id = auth.uid()
     OR person.auth_id = auth.uid()
  ORDER BY (person.auth_user_id = auth.uid()) DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.people AS person
    WHERE person.id = public.get_auth_person_id()
      AND (person.role = 'SUPER_ADMIN' OR person.is_admin = TRUE)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_leader()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.people AS person
      WHERE person.id = public.get_auth_person_id()
        AND person.role = 'GROUP_LEADER'
    )
    OR EXISTS (
      SELECT 1
      FROM public.groups AS ministry_group
      WHERE ministry_group.leader_id = public.get_auth_person_id()
    );
$$;

REVOKE ALL ON FUNCTION public.get_auth_person_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_group_leader() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_person_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_leader() TO authenticated;

-- 4. Remove legacy allow-all policies. Permissive policies are OR-ed together,
-- so even one USING(true) policy disables every restrictive policy beside it.
DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'people', 'groups', 'group_members', 'weekly_stats',
        'weekly_stat_absences', 'weekly_stat_study_progress',
        'bible_study_logs', 'group_leadership_history', 'events',
        'event_rosters', 'announcements'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow public read/write on people" ON public.people;
DROP POLICY IF EXISTS "Allow public read/write on groups" ON public.groups;
DROP POLICY IF EXISTS "Allow public read/write on group_members" ON public.group_members;
DROP POLICY IF EXISTS "Allow public read/write on weekly_stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Allow public read/write on events" ON public.events;
DROP POLICY IF EXISTS "Allow public read/write on event_rosters" ON public.event_rosters;
DROP POLICY IF EXISTS "Allow public read/write on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public read/write on bible_study_logs" ON public.bible_study_logs;
DROP POLICY IF EXISTS "Public Read/Write weekly_stat_absences" ON public.weekly_stat_absences;
DROP POLICY IF EXISTS "Public Read/Write weekly_stat_study_progress" ON public.weekly_stat_study_progress;
DROP POLICY IF EXISTS "Public Read/Write group_leadership_history" ON public.group_leadership_history;

-- Drop the previous secure policy set as well, allowing this file to be re-run.
DROP POLICY IF EXISTS "Admins and Self can update people" ON public.people;
DROP POLICY IF EXISTS "Admins and Self can view full people profiles" ON public.people;
DROP POLICY IF EXISTS "Admins can delete people" ON public.people;
DROP POLICY IF EXISTS "Admins can insert people" ON public.people;
DROP POLICY IF EXISTS "All authenticated can view people" ON public.people;

DROP POLICY IF EXISTS "Admins and Group Leaders can update groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON public.groups;
DROP POLICY IF EXISTS "All authenticated can view groups" ON public.groups;

DROP POLICY IF EXISTS "Admins and Group Leaders can delete group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins and Group Leaders can insert group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins and Group Leaders can update group members" ON public.group_members;
DROP POLICY IF EXISTS "All authenticated can view group members" ON public.group_members;

DROP POLICY IF EXISTS "Admins and Group Leaders can delete stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Admins and Group Leaders can insert stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Admins and Group Leaders can update stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "All authenticated can view stats" ON public.weekly_stats;

DROP POLICY IF EXISTS "Admins and Group Leaders delete absences" ON public.weekly_stat_absences;
DROP POLICY IF EXISTS "Admins and Group Leaders insert absences" ON public.weekly_stat_absences;
DROP POLICY IF EXISTS "Admins and Group Leaders update absences" ON public.weekly_stat_absences;
DROP POLICY IF EXISTS "All auth can view absences" ON public.weekly_stat_absences;

DROP POLICY IF EXISTS "Admins and Group Leaders delete progress" ON public.weekly_stat_study_progress;
DROP POLICY IF EXISTS "Admins and Group Leaders insert progress" ON public.weekly_stat_study_progress;
DROP POLICY IF EXISTS "Admins and Group Leaders update progress" ON public.weekly_stat_study_progress;
DROP POLICY IF EXISTS "All auth can view study progress" ON public.weekly_stat_study_progress;

DROP POLICY IF EXISTS "Admins and Self can view logs" ON public.bible_study_logs;
DROP POLICY IF EXISTS "Admins can delete logs" ON public.bible_study_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.bible_study_logs;
DROP POLICY IF EXISTS "Admins can update logs" ON public.bible_study_logs;

DROP POLICY IF EXISTS "Admin manage leader history" ON public.group_leadership_history;
DROP POLICY IF EXISTS "All auth can view leader history" ON public.group_leadership_history;
DROP POLICY IF EXISTS "Admin manage events" ON public.events;
DROP POLICY IF EXISTS "All auth can view events" ON public.events;
DROP POLICY IF EXISTS "Admin manage rosters" ON public.event_rosters;
DROP POLICY IF EXISTS "All auth can view rosters" ON public.event_rosters;
DROP POLICY IF EXISTS "Admins and Authors can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins and Authors can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins and Leaders can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "All auth can view announcements" ON public.announcements;

-- 5. Enable RLS everywhere and remove direct anonymous access.
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stat_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stat_study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_leadership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.people, public.groups, public.group_members,
  public.weekly_stats, public.weekly_stat_absences, public.weekly_stat_study_progress,
  public.bible_study_logs, public.group_leadership_history, public.events,
  public.event_rosters, public.announcements FROM anon;

REVOKE UPDATE ON TABLE public.people FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.people TO authenticated;
GRANT UPDATE (full_name, nickname, gender, phone_number, campus, status,
  birth_date, baptism_date, study_stage, notes, updated_at)
  ON public.people TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.groups, public.group_members,
  public.weekly_stats, public.weekly_stat_absences, public.weekly_stat_study_progress,
  public.bible_study_logs, public.group_leadership_history, public.events,
  public.event_rosters, public.announcements TO authenticated;

-- 6. Final policy set.
CREATE POLICY "All authenticated can view people"
  ON public.people FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert people"
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins and self can update people"
  ON public.people FOR UPDATE TO authenticated
  USING (public.is_admin() OR id = public.get_auth_person_id())
  WITH CHECK (public.is_admin() OR id = public.get_auth_person_id());
CREATE POLICY "Admins can delete people"
  ON public.people FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "All authenticated can view groups"
  ON public.groups FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins and group owner can update groups"
  ON public.groups FOR UPDATE TO authenticated
  USING (public.is_admin() OR leader_id = public.get_auth_person_id())
  WITH CHECK (public.is_admin() OR leader_id = public.get_auth_person_id());
CREATE POLICY "Admins can delete groups"
  ON public.groups FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "All authenticated can view group members"
  ON public.group_members FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and group owner can insert group members"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can update group members"
  ON public.group_members FOR UPDATE TO authenticated
  USING (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ))
  WITH CHECK (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can delete group members"
  ON public.group_members FOR DELETE TO authenticated
  USING (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));

CREATE POLICY "All authenticated can view stats"
  ON public.weekly_stats FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and group owner can insert stats"
  ON public.weekly_stats FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can update stats"
  ON public.weekly_stats FOR UPDATE TO authenticated
  USING (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ))
  WITH CHECK (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can delete stats"
  ON public.weekly_stats FOR DELETE TO authenticated
  USING (public.is_admin() OR group_id IN (
    SELECT id FROM public.groups WHERE leader_id = public.get_auth_person_id()
  ));

CREATE POLICY "All authenticated can view absences"
  ON public.weekly_stat_absences FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and group owner can insert absences"
  ON public.weekly_stat_absences FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can update absences"
  ON public.weekly_stat_absences FOR UPDATE TO authenticated
  USING (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ))
  WITH CHECK (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can delete absences"
  ON public.weekly_stat_absences FOR DELETE TO authenticated
  USING (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));

CREATE POLICY "All authenticated can view study progress"
  ON public.weekly_stat_study_progress FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and group owner can insert study progress"
  ON public.weekly_stat_study_progress FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can update study progress"
  ON public.weekly_stat_study_progress FOR UPDATE TO authenticated
  USING (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ))
  WITH CHECK (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));
CREATE POLICY "Admins and group owner can delete study progress"
  ON public.weekly_stat_study_progress FOR DELETE TO authenticated
  USING (public.is_admin() OR weekly_stat_id IN (
    SELECT stats.id FROM public.weekly_stats AS stats
    JOIN public.groups AS ministry_group ON ministry_group.id = stats.group_id
    WHERE ministry_group.leader_id = public.get_auth_person_id()
  ));

CREATE POLICY "All authenticated can view bible study logs"
  ON public.bible_study_logs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and leaders can insert bible study logs"
  ON public.bible_study_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_group_leader());
CREATE POLICY "Admins and leaders can update bible study logs"
  ON public.bible_study_logs FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_group_leader())
  WITH CHECK (public.is_admin() OR public.is_group_leader());
CREATE POLICY "Admins and leaders can delete bible study logs"
  ON public.bible_study_logs FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_group_leader());

CREATE POLICY "All authenticated can view leader history"
  ON public.group_leadership_history FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage leader history"
  ON public.group_leadership_history FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "All authenticated can view events"
  ON public.events FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "All authenticated can view event rosters"
  ON public.event_rosters FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage event rosters"
  ON public.event_rosters FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "All authenticated can view announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and leaders can insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (public.is_group_leader() AND author_id = public.get_auth_person_id())
  );
CREATE POLICY "Admins and authors can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.is_admin() OR author_id = public.get_auth_person_id())
  WITH CHECK (public.is_admin() OR author_id = public.get_auth_person_id());
CREATE POLICY "Admins and authors can delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.is_admin() OR author_id = public.get_auth_person_id());

-- 7. Leadership history: record both initial assignment and later handovers.
CREATE OR REPLACE FUNCTION public.log_leadership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.leader_id IS NOT NULL THEN
      INSERT INTO public.group_leadership_history (group_id, leader_id, started_at)
      VALUES (NEW.id, NEW.leader_id, CURRENT_DATE);
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
    IF OLD.leader_id IS NOT NULL THEN
      UPDATE public.group_leadership_history
      SET ended_at = CURRENT_DATE
      WHERE group_id = NEW.id
        AND leader_id = OLD.leader_id
        AND ended_at IS NULL;
    END IF;

    IF NEW.leader_id IS NOT NULL THEN
      INSERT INTO public.group_leadership_history (group_id, leader_id, started_at)
      VALUES (NEW.id, NEW.leader_id, CURRENT_DATE);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_leadership_change ON public.groups;
DROP TRIGGER IF EXISTS trg_log_initial_leadership ON public.groups;
CREATE TRIGGER trg_log_initial_leadership
AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.log_leadership_change();
CREATE TRIGGER trg_log_leadership_change
AFTER UPDATE OF leader_id ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.log_leadership_change();

INSERT INTO public.group_leadership_history (group_id, leader_id, started_at)
SELECT ministry_group.id, ministry_group.leader_id, COALESCE(ministry_group.created_at::date, CURRENT_DATE)
FROM public.groups AS ministry_group
WHERE ministry_group.leader_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.group_leadership_history AS history
    WHERE history.group_id = ministry_group.id
      AND history.leader_id = ministry_group.leader_id
      AND history.ended_at IS NULL
  );

-- Views must obey the caller's table policies and must not be exposed to anon.
DO $$
BEGIN
  IF to_regclass('public.upcoming_milestones') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.upcoming_milestones SET (security_invoker = TRUE)';
    EXECUTE 'REVOKE ALL ON public.upcoming_milestones FROM anon';
    EXECUTE 'GRANT SELECT ON public.upcoming_milestones TO authenticated';
  END IF;

  IF to_regclass('public.leadership_tenure') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.leadership_tenure SET (security_invoker = TRUE)';
    EXECUTE 'REVOKE ALL ON public.leadership_tenure FROM anon';
    EXECUTE 'GRANT SELECT ON public.leadership_tenure TO authenticated';
  END IF;
END $$;

COMMIT;

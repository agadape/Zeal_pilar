-- d-Tree: pohon pembimbingan Tugu
-- Prasyarat: supabase_security_alignment.sql sudah berhasil dijalankan.
-- Jalankan sekali melalui Supabase SQL Editor sebagai database owner.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF to_regprocedure('public.get_auth_person_id()') IS NULL
     OR to_regprocedure('public.is_admin()') IS NULL
     OR to_regprocedure('public.is_group_leader()') IS NULL THEN
    RAISE EXCEPTION 'Jalankan supabase_security_alignment.sql sebelum supabase_dtree.sql';
  END IF;
END $$;

-- d-Tree menganggap satu orang hanya berada dalam satu grup aktif.
-- Migrasi berhenti tanpa mengubah data jika data lama melanggar aturan tersebut.
DO $$
DECLARE
  duplicate_members TEXT;
  duplicate_leaders TEXT;
  cross_assignments TEXT;
  gender_conflicts TEXT;
BEGIN
  SELECT string_agg(person_id::text, ', ')
  INTO duplicate_members
  FROM (
    SELECT person_id
    FROM public.group_members
    GROUP BY person_id
    HAVING count(*) > 1
  ) AS duplicates;

  IF duplicate_members IS NOT NULL THEN
    RAISE EXCEPTION 'Ada orang yang menjadi anggota lebih dari satu grup: %', duplicate_members;
  END IF;

  SELECT string_agg(leader_id::text, ', ')
  INTO duplicate_leaders
  FROM (
    SELECT leader_id
    FROM public.groups
    WHERE leader_id IS NOT NULL AND archived_at IS NULL
    GROUP BY leader_id
    HAVING count(*) > 1
  ) AS duplicates;

  IF duplicate_leaders IS NOT NULL THEN
    RAISE EXCEPTION 'Ada leader yang memimpin lebih dari satu grup aktif: %', duplicate_leaders;
  END IF;

  SELECT string_agg(DISTINCT member.person_id::text, ', ')
  INTO cross_assignments
  FROM public.group_members AS member
  JOIN public.groups AS led_group
    ON led_group.leader_id = member.person_id
   AND led_group.archived_at IS NULL
  WHERE member.group_id <> led_group.id;

  IF cross_assignments IS NOT NULL THEN
    RAISE EXCEPTION 'Ada leader yang menjadi anggota grup lain: %', cross_assignments;
  END IF;

  SELECT string_agg(conflict.person_id::text, ', ')
  INTO gender_conflicts
  FROM (
    SELECT member.person_id
    FROM public.group_members AS member
    JOIN public.people AS person ON person.id = member.person_id
    JOIN public.groups AS ministry_group ON ministry_group.id = member.group_id
    WHERE person.gender IS DISTINCT FROM ministry_group.category

    UNION

    SELECT ministry_group.leader_id
    FROM public.groups AS ministry_group
    JOIN public.people AS person ON person.id = ministry_group.leader_id
    WHERE ministry_group.leader_id IS NOT NULL
      AND ministry_group.archived_at IS NULL
      AND person.gender IS DISTINCT FROM ministry_group.category
  ) AS conflict;

  IF gender_conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Ada assignment grup yang tidak sesuai gender: %', gender_conflicts;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS group_members_one_group_per_person
  ON public.group_members (person_id);

CREATE UNIQUE INDEX IF NOT EXISTS groups_one_active_group_per_leader
  ON public.groups (leader_id)
  WHERE leader_id IS NOT NULL AND archived_at IS NULL;

CREATE TABLE IF NOT EXISTS public.dtree_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brother_root_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  sister_root_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dtree_roots_are_distinct CHECK (
    brother_root_id IS NULL
    OR sister_root_id IS NULL
    OR brother_root_id <> sister_root_id
  )
);

INSERT INTO public.dtree_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'PRIMARY'
    CHECK (relationship_type IN ('PRIMARY', 'SECONDARY')),
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ended_at DATE,
  end_reason TEXT,
  created_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_people_are_distinct CHECK (mentor_id <> mentee_id),
  CONSTRAINT mentorship_dates_are_valid CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS mentorship_one_active_primary
  ON public.mentorship_relationships (mentee_id)
  WHERE ended_at IS NULL AND relationship_type = 'PRIMARY';

CREATE UNIQUE INDEX IF NOT EXISTS mentorship_one_active_pair
  ON public.mentorship_relationships (mentor_id, mentee_id)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS mentorship_active_mentor_idx
  ON public.mentorship_relationships (mentor_id, relationship_type)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS mentorship_history_mentee_idx
  ON public.mentorship_relationships (mentee_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.person_dtree_group_id(target_person_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assignment.group_id
  FROM (
    SELECT ministry_group.id AS group_id, 1 AS priority
    FROM public.groups AS ministry_group
    WHERE ministry_group.leader_id = target_person_id
      AND ministry_group.archived_at IS NULL

    UNION ALL

    SELECT membership.group_id, 2 AS priority
    FROM public.group_members AS membership
    JOIN public.groups AS ministry_group ON ministry_group.id = membership.group_id
    WHERE membership.person_id = target_person_id
      AND ministry_group.archived_at IS NULL
  ) AS assignment
  ORDER BY assignment.priority
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.person_dtree_group_id(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_dtree_group_id(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_group_member_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_gender TEXT;
  group_gender TEXT;
BEGIN
  SELECT gender INTO person_gender FROM public.people WHERE id = NEW.person_id;
  SELECT category INTO group_gender FROM public.groups WHERE id = NEW.group_id;

  IF person_gender IS NULL OR group_gender IS NULL THEN
    RAISE EXCEPTION 'Orang atau grup tidak ditemukan';
  END IF;

  IF person_gender <> group_gender THEN
    RAISE EXCEPTION 'Gender anggota harus sama dengan kategori grup';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.dtree_settings
    WHERE brother_root_id = NEW.person_id OR sister_root_id = NEW.person_id
  ) THEN
    RAISE EXCEPTION 'Pemimpin Jemaat tidak boleh menjadi anggota grup';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.groups AS ministry_group
    WHERE ministry_group.leader_id = NEW.person_id
      AND ministry_group.archived_at IS NULL
      AND ministry_group.id <> NEW.group_id
  ) THEN
    RAISE EXCEPTION 'Orang ini sudah menjadi leader di grup lain';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_group_member_assignment ON public.group_members;
CREATE TRIGGER trg_validate_group_member_assignment
BEFORE INSERT OR UPDATE OF group_id, person_id ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.validate_group_member_assignment();

CREATE OR REPLACE FUNCTION public.validate_group_leader_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leader_gender TEXT;
BEGIN
  IF NEW.leader_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT gender INTO leader_gender FROM public.people WHERE id = NEW.leader_id;
  IF leader_gender IS NULL THEN
    RAISE EXCEPTION 'Leader tidak ditemukan';
  END IF;

  IF leader_gender <> NEW.category THEN
    RAISE EXCEPTION 'Gender leader harus sama dengan kategori grup';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.dtree_settings
    WHERE brother_root_id = NEW.leader_id OR sister_root_id = NEW.leader_id
  ) THEN
    RAISE EXCEPTION 'Pemimpin Jemaat tidak boleh menjadi leader grup';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members AS membership
    WHERE membership.person_id = NEW.leader_id
      AND membership.group_id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Leader masih terdaftar sebagai anggota grup lain';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_group_leader_assignment ON public.groups;
CREATE TRIGGER trg_validate_group_leader_assignment
BEFORE INSERT OR UPDATE OF leader_id, category ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.validate_group_leader_assignment();

CREATE OR REPLACE FUNCTION public.validate_dtree_roots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brother_gender TEXT;
  sister_gender TEXT;
BEGIN
  IF NEW.brother_root_id IS NOT NULL THEN
    SELECT gender INTO brother_gender
    FROM public.people
    WHERE id = NEW.brother_root_id AND archived_at IS NULL;

    IF brother_gender IS DISTINCT FROM 'BROTHER' THEN
      RAISE EXCEPTION 'Root Brother harus memilih laki-laki yang aktif';
    END IF;
    IF public.person_dtree_group_id(NEW.brother_root_id) IS NOT NULL THEN
      RAISE EXCEPTION 'Pemimpin jemaat tidak boleh berada dalam grup';
    END IF;
  END IF;

  IF NEW.sister_root_id IS NOT NULL THEN
    SELECT gender INTO sister_gender
    FROM public.people
    WHERE id = NEW.sister_root_id AND archived_at IS NULL;

    IF sister_gender IS DISTINCT FROM 'SISTER' THEN
      RAISE EXCEPTION 'Root Sister harus memilih perempuan yang aktif';
    END IF;
    IF public.person_dtree_group_id(NEW.sister_root_id) IS NOT NULL THEN
      RAISE EXCEPTION 'Pemimpin jemaat tidak boleh berada dalam grup';
    END IF;
  END IF;

  NEW.updated_by := public.get_auth_person_id();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_dtree_roots ON public.dtree_settings;
CREATE TRIGGER trg_validate_dtree_roots
BEFORE INSERT OR UPDATE OF brother_root_id, sister_root_id ON public.dtree_settings
FOR EACH ROW EXECUTE FUNCTION public.validate_dtree_roots();

CREATE OR REPLACE FUNCTION public.validate_mentorship_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentor_gender TEXT;
  mentee_gender TEXT;
  mentor_group_id UUID;
  mentee_group_id UUID;
BEGIN
  SELECT gender INTO mentor_gender
  FROM public.people
  WHERE id = NEW.mentor_id AND archived_at IS NULL;

  SELECT gender INTO mentee_gender
  FROM public.people
  WHERE id = NEW.mentee_id AND archived_at IS NULL;

  IF mentor_gender IS NULL OR mentee_gender IS NULL THEN
    RAISE EXCEPTION 'Pembimbing dan anggota harus merupakan orang aktif';
  END IF;
  IF NEW.mentor_id = NEW.mentee_id THEN
    RAISE EXCEPTION 'Seseorang tidak dapat membimbing dirinya sendiri';
  END IF;
  IF mentor_gender <> mentee_gender THEN
    RAISE EXCEPTION 'Pembimbing dan anggota harus memiliki gender yang sama';
  END IF;

  mentor_group_id := public.person_dtree_group_id(NEW.mentor_id);
  mentee_group_id := public.person_dtree_group_id(NEW.mentee_id);
  IF mentor_group_id IS NULL OR mentee_group_id IS NULL OR mentor_group_id <> mentee_group_id THEN
    RAISE EXCEPTION 'Pembimbing dan anggota harus berada dalam grup yang sama';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.groups
    WHERE leader_id = NEW.mentee_id AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Leader grup berada langsung di bawah Pemimpin Jemaat';
  END IF;

  IF EXISTS (
    WITH RECURSIVE descendants(person_id) AS (
      SELECT relationship.mentee_id
      FROM public.mentorship_relationships AS relationship
      WHERE relationship.mentor_id = NEW.mentee_id
        AND relationship.relationship_type = 'PRIMARY'
        AND relationship.ended_at IS NULL
        AND relationship.id <> NEW.id

      UNION

      SELECT relationship.mentee_id
      FROM public.mentorship_relationships AS relationship
      JOIN descendants ON descendants.person_id = relationship.mentor_id
      WHERE relationship.relationship_type = 'PRIMARY'
        AND relationship.ended_at IS NULL
        AND relationship.id <> NEW.id
    )
    SELECT 1 FROM descendants WHERE person_id = NEW.mentor_id
  ) THEN
    RAISE EXCEPTION 'Relasi ini akan membuat siklus pembimbingan';
  END IF;

  NEW.group_id := mentee_group_id;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.get_auth_person_id();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_mentorship_relationship ON public.mentorship_relationships;
CREATE TRIGGER trg_validate_mentorship_relationship
BEFORE INSERT OR UPDATE OF mentor_id, mentee_id, relationship_type
ON public.mentorship_relationships
FOR EACH ROW EXECUTE FUNCTION public.validate_mentorship_relationship();

CREATE OR REPLACE FUNCTION public.touch_mentorship_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_mentorship_relationship ON public.mentorship_relationships;
CREATE TRIGGER trg_touch_mentorship_relationship
BEFORE UPDATE ON public.mentorship_relationships
FOR EACH ROW EXECUTE FUNCTION public.touch_mentorship_relationship();

CREATE OR REPLACE FUNCTION public.end_mentorships_when_member_leaves()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = OLD.group_id AND leader_id = OLD.person_id
  ) THEN
    RETURN OLD;
  END IF;

  UPDATE public.mentorship_relationships
  SET ended_at = CURRENT_DATE,
      end_reason = 'Keluar dari grup'
  WHERE group_id = OLD.group_id
    AND ended_at IS NULL
    AND (mentor_id = OLD.person_id OR mentee_id = OLD.person_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_end_mentorships_when_member_leaves ON public.group_members;
CREATE TRIGGER trg_end_mentorships_when_member_leaves
AFTER DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.end_mentorships_when_member_leaves();

CREATE OR REPLACE FUNCTION public.sync_dtree_group_leadership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.leader_id IS NOT NULL THEN
      UPDATE public.mentorship_relationships
      SET ended_at = CURRENT_DATE,
          end_reason = 'Menjadi leader grup'
      WHERE mentee_id = NEW.leader_id
        AND ended_at IS NULL;

      DELETE FROM public.group_members
      WHERE group_id = NEW.id AND person_id = NEW.leader_id;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
    IF OLD.leader_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, person_id)
      VALUES (NEW.id, OLD.leader_id)
      ON CONFLICT (person_id) DO NOTHING;
    END IF;

    IF NEW.leader_id IS NOT NULL THEN
      UPDATE public.mentorship_relationships
      SET ended_at = CURRENT_DATE,
          end_reason = 'Menjadi leader grup'
      WHERE mentee_id = NEW.leader_id
        AND ended_at IS NULL;

      DELETE FROM public.group_members
      WHERE group_id = NEW.id AND person_id = NEW.leader_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dtree_group_leadership ON public.groups;
CREATE TRIGGER trg_sync_dtree_group_leadership
AFTER INSERT OR UPDATE OF leader_id ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.sync_dtree_group_leadership();

ALTER TABLE public.dtree_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can view dTree settings" ON public.dtree_settings;
DROP POLICY IF EXISTS "Admins manage dTree settings" ON public.dtree_settings;
DROP POLICY IF EXISTS "All authenticated can view mentorships" ON public.mentorship_relationships;
DROP POLICY IF EXISTS "Admins and leaders insert mentorships" ON public.mentorship_relationships;
DROP POLICY IF EXISTS "Admins and leaders update mentorships" ON public.mentorship_relationships;

CREATE POLICY "All authenticated can view dTree settings"
  ON public.dtree_settings FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage dTree settings"
  ON public.dtree_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "All authenticated can view mentorships"
  ON public.mentorship_relationships FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and leaders insert mentorships"
  ON public.mentorship_relationships FOR INSERT TO authenticated
  WITH CHECK (public.is_group_leader());

CREATE POLICY "Admins and leaders update mentorships"
  ON public.mentorship_relationships FOR UPDATE TO authenticated
  USING (public.is_group_leader())
  WITH CHECK (public.is_group_leader());

REVOKE ALL ON TABLE public.dtree_settings, public.mentorship_relationships FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.dtree_settings, public.mentorship_relationships FROM authenticated;
GRANT SELECT ON TABLE public.dtree_settings, public.mentorship_relationships TO authenticated;

CREATE OR REPLACE FUNCTION public.set_dtree_roots(
  p_brother_root_id UUID,
  p_sister_root_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  saved_settings public.dtree_settings%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat mengganti Pemimpin Jemaat';
  END IF;

  INSERT INTO public.dtree_settings (id, brother_root_id, sister_root_id)
  VALUES (1, p_brother_root_id, p_sister_root_id)
  ON CONFLICT (id) DO UPDATE
    SET brother_root_id = EXCLUDED.brother_root_id,
        sister_root_id = EXCLUDED.sister_root_id
  RETURNING * INTO saved_settings;

  RETURN to_jsonb(saved_settings);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_primary_mentor(
  p_mentee_id UUID,
  p_mentor_id UUID,
  p_reason TEXT DEFAULT 'Perubahan pembimbing melalui d-Tree'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_relationship public.mentorship_relationships%ROWTYPE;
  saved_relationship public.mentorship_relationships%ROWTYPE;
BEGIN
  IF NOT public.is_group_leader() THEN
    RAISE EXCEPTION 'Hanya Admin atau Leader yang dapat mengatur d-Tree';
  END IF;

  SELECT * INTO current_relationship
  FROM public.mentorship_relationships
  WHERE mentee_id = p_mentee_id
    AND relationship_type = 'PRIMARY'
    AND ended_at IS NULL
  FOR UPDATE;

  IF current_relationship.id IS NOT NULL AND current_relationship.mentor_id = p_mentor_id THEN
    RETURN to_jsonb(current_relationship);
  END IF;

  IF current_relationship.id IS NOT NULL THEN
    UPDATE public.mentorship_relationships
    SET ended_at = CURRENT_DATE,
        end_reason = COALESCE(NULLIF(trim(p_reason), ''), 'Perubahan pembimbing melalui d-Tree')
    WHERE id = current_relationship.id;
  END IF;

  INSERT INTO public.mentorship_relationships (
    mentor_id,
    mentee_id,
    group_id,
    relationship_type,
    created_by
  ) VALUES (
    p_mentor_id,
    p_mentee_id,
    public.person_dtree_group_id(p_mentee_id),
    'PRIMARY',
    public.get_auth_person_id()
  )
  RETURNING * INTO saved_relationship;

  RETURN to_jsonb(saved_relationship);
END;
$$;

CREATE OR REPLACE FUNCTION public.add_secondary_mentor(
  p_mentee_id UUID,
  p_mentor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  saved_relationship public.mentorship_relationships%ROWTYPE;
BEGIN
  IF NOT public.is_group_leader() THEN
    RAISE EXCEPTION 'Hanya Admin atau Leader yang dapat mengatur d-Tree';
  END IF;

  INSERT INTO public.mentorship_relationships (
    mentor_id,
    mentee_id,
    group_id,
    relationship_type,
    created_by
  ) VALUES (
    p_mentor_id,
    p_mentee_id,
    public.person_dtree_group_id(p_mentee_id),
    'SECONDARY',
    public.get_auth_person_id()
  )
  RETURNING * INTO saved_relationship;

  RETURN to_jsonb(saved_relationship);
END;
$$;

CREATE OR REPLACE FUNCTION public.end_mentorship(
  p_relationship_id UUID,
  p_reason TEXT DEFAULT 'Relasi diakhiri melalui d-Tree'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  saved_relationship public.mentorship_relationships%ROWTYPE;
BEGIN
  IF NOT public.is_group_leader() THEN
    RAISE EXCEPTION 'Hanya Admin atau Leader yang dapat mengatur d-Tree';
  END IF;

  UPDATE public.mentorship_relationships
  SET ended_at = CURRENT_DATE,
      end_reason = COALESCE(NULLIF(trim(p_reason), ''), 'Relasi diakhiri melalui d-Tree')
  WHERE id = p_relationship_id
    AND ended_at IS NULL
  RETURNING * INTO saved_relationship;

  IF saved_relationship.id IS NULL THEN
    RAISE EXCEPTION 'Relasi aktif tidak ditemukan';
  END IF;

  RETURN to_jsonb(saved_relationship);
END;
$$;

REVOKE ALL ON FUNCTION public.set_dtree_roots(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_primary_mentor(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_secondary_mentor(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.end_mentorship(UUID, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_dtree_roots(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_mentor(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_secondary_mentor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_mentorship(UUID, TEXT) TO authenticated;

COMMENT ON TABLE public.dtree_settings IS 'Pasangan Pemimpin Jemaat yang menjadi akar global d-Tree.';
COMMENT ON TABLE public.mentorship_relationships IS 'Relasi pembimbingan aktif dan histori d-Tree.';

COMMIT;

import {
  DTreeData,
  DTreeSettings,
  Group,
  GroupMember,
  MentorshipRelationship,
  MentorshipType,
  Person
} from '../types';
import { INITIAL_GROUP_MEMBERS, INITIAL_GROUPS, INITIAL_PEOPLE } from '../mockData';
import {
  STORAGE_KEYS,
  getLocalData,
  isSupabaseConfigured,
  setLocalData,
  supabase
} from './core';

const EMPTY_SETTINGS: DTreeSettings = {
  id: 1,
  brother_root_id: null,
  sister_root_id: null
};

function getLocalPersonGroupId(personId: string): string | null {
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const memberships = getLocalData<GroupMember[]>(
    STORAGE_KEYS.GROUP_MEMBERS,
    INITIAL_GROUP_MEMBERS as GroupMember[]
  );
  return groups.find(group => group.leader_id === personId && !group.archived_at)?.id
    || memberships.find(member => member.person_id === personId)?.group_id
    || null;
}

function assertCanRelateLocally(mentorId: string, menteeId: string): void {
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const mentor = people.find(person => person.id === mentorId && !person.archived_at);
  const mentee = people.find(person => person.id === menteeId && !person.archived_at);
  if (!mentor || !mentee) throw new Error('Pembimbing atau anggota tidak ditemukan.');
  if (mentor.id === mentee.id) throw new Error('Seseorang tidak dapat membimbing dirinya sendiri.');
  if (mentor.gender !== mentee.gender) throw new Error('Pembimbing dan anggota harus memiliki gender yang sama.');

  const mentorGroupId = getLocalPersonGroupId(mentor.id);
  const menteeGroupId = getLocalPersonGroupId(mentee.id);
  if (!mentorGroupId || mentorGroupId !== menteeGroupId) {
    throw new Error('Pembimbing dan anggota harus berada dalam grup yang sama.');
  }
}

function wouldCreateLocalCycle(
  relationships: MentorshipRelationship[],
  mentorId: string,
  menteeId: string
): boolean {
  const childrenByMentor = new Map<string, string[]>();
  relationships
    .filter(item => !item.ended_at && item.relationship_type === 'PRIMARY')
    .forEach(item => {
      const children = childrenByMentor.get(item.mentor_id) || [];
      children.push(item.mentee_id);
      childrenByMentor.set(item.mentor_id, children);
    });

  const queue = [menteeId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === mentorId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...(childrenByMentor.get(current) || []));
  }
  return false;
}

export async function fetchDTreeData(): Promise<DTreeData> {
  if (isSupabaseConfigured && supabase) {
    const [settingsResult, relationshipsResult, membershipsResult] = await Promise.all([
      supabase.from('dtree_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('mentorship_relationships').select('*').order('started_at', { ascending: false }),
      supabase.from('group_members').select('*').order('created_at')
    ]);

    if (membershipsResult.error) throw membershipsResult.error;

    const featureErrors = [settingsResult.error, relationshipsResult.error].filter(Boolean);
    const migrationMissing = featureErrors.some(error =>
      error?.code === '42P01'
      || error?.code === 'PGRST205'
      || error?.message?.includes('schema cache')
    );
    if (migrationMissing) {
      return {
        settings: EMPTY_SETTINGS,
        relationships: [],
        memberships: (membershipsResult.data || []) as GroupMember[],
        migration_required: true
      };
    }
    if (settingsResult.error) throw settingsResult.error;
    if (relationshipsResult.error) throw relationshipsResult.error;

    return {
      settings: (settingsResult.data as DTreeSettings | null) || EMPTY_SETTINGS,
      relationships: (relationshipsResult.data || []) as MentorshipRelationship[],
      memberships: (membershipsResult.data || []) as GroupMember[],
      migration_required: false
    };
  }

  return {
    settings: getLocalData<DTreeSettings>(STORAGE_KEYS.DTREE_SETTINGS, EMPTY_SETTINGS),
    relationships: getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []),
    memberships: getLocalData<GroupMember[]>(
      STORAGE_KEYS.GROUP_MEMBERS,
      INITIAL_GROUP_MEMBERS as GroupMember[]
    )
  };
}

export async function saveDTreeRoots(
  brotherRootId: string | null,
  sisterRootId: string | null
): Promise<DTreeSettings> {
  if (!brotherRootId || !sisterRootId) {
    throw new Error('Dua Pemimpin Jemaat wajib dipilih: satu Brother dan satu Sister.');
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('set_dtree_roots', {
      p_brother_root_id: brotherRootId,
      p_sister_root_id: sisterRootId
    });
    if (error) throw error;
    return data as DTreeSettings;
  }

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const brother = brotherRootId ? people.find(person => person.id === brotherRootId) : null;
  const sister = sisterRootId ? people.find(person => person.id === sisterRootId) : null;
  if (brotherRootId && brother?.gender !== 'BROTHER') throw new Error('Root laki-laki harus memilih Brother.');
  if (sisterRootId && sister?.gender !== 'SISTER') throw new Error('Root perempuan harus memilih Sister.');
  if (brotherRootId && getLocalPersonGroupId(brotherRootId)) throw new Error('Pemimpin jemaat tidak boleh berada dalam grup.');
  if (sisterRootId && getLocalPersonGroupId(sisterRootId)) throw new Error('Pemimpin jemaat tidak boleh berada dalam grup.');

  const settings: DTreeSettings = {
    id: 1,
    brother_root_id: brotherRootId,
    sister_root_id: sisterRootId,
    updated_at: new Date().toISOString()
  };
  setLocalData(STORAGE_KEYS.DTREE_SETTINGS, settings);
  return settings;
}

export async function setPrimaryMentor(
  menteeId: string,
  mentorId: string,
  reason = 'Perubahan pembimbing melalui d-Tree'
): Promise<MentorshipRelationship> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('set_primary_mentor', {
      p_mentee_id: menteeId,
      p_mentor_id: mentorId,
      p_reason: reason
    });
    if (error) throw error;
    return data as MentorshipRelationship;
  }

  assertCanRelateLocally(mentorId, menteeId);
  const relationships = getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  const existing = relationships.find(item =>
    item.mentee_id === menteeId
    && item.relationship_type === 'PRIMARY'
    && !item.ended_at
  );
  if (existing?.mentor_id === mentorId) return existing;
  if (wouldCreateLocalCycle(relationships, mentorId, menteeId)) {
    throw new Error('Perubahan ini akan membuat hubungan pembimbingan berputar.');
  }

  const now = new Date().toISOString();
  const endedRelationships = relationships.map(item => (
    item.id === existing?.id
      ? { ...item, ended_at: now.slice(0, 10), end_reason: reason, updated_at: now }
      : item
  ));
  const newRelationship: MentorshipRelationship = {
    id: `mentor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mentor_id: mentorId,
    mentee_id: menteeId,
    group_id: getLocalPersonGroupId(menteeId)!,
    relationship_type: 'PRIMARY',
    started_at: now.slice(0, 10),
    created_at: now,
    updated_at: now
  };
  setLocalData(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, [...endedRelationships, newRelationship]);
  return newRelationship;
}

export async function addSecondaryMentor(
  menteeId: string,
  mentorId: string
): Promise<MentorshipRelationship> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('add_secondary_mentor', {
      p_mentee_id: menteeId,
      p_mentor_id: mentorId
    });
    if (error) throw error;
    return data as MentorshipRelationship;
  }

  assertCanRelateLocally(mentorId, menteeId);
  const relationships = getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  const duplicate = relationships.find(item =>
    item.mentor_id === mentorId && item.mentee_id === menteeId && !item.ended_at
  );
  if (duplicate) throw new Error('Relasi pembimbing ini sudah aktif.');
  if (wouldCreateLocalCycle(relationships, mentorId, menteeId)) {
    throw new Error('Perubahan ini akan membuat hubungan pembimbingan berputar.');
  }

  const now = new Date().toISOString();
  const relationship: MentorshipRelationship = {
    id: `mentor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mentor_id: mentorId,
    mentee_id: menteeId,
    group_id: getLocalPersonGroupId(menteeId)!,
    relationship_type: 'SECONDARY',
    started_at: now.slice(0, 10),
    created_at: now,
    updated_at: now
  };
  setLocalData(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, [...relationships, relationship]);
  return relationship;
}

export async function endMentorship(
  relationshipId: string,
  reason = 'Relasi diakhiri melalui d-Tree'
): Promise<MentorshipRelationship> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('end_mentorship', {
      p_relationship_id: relationshipId,
      p_reason: reason
    });
    if (error) throw error;
    return data as MentorshipRelationship;
  }

  const relationships = getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  const activeRelationship = relationships.find(item => item.id === relationshipId && !item.ended_at);
  if (!activeRelationship) throw new Error('Relasi pembimbingan aktif tidak ditemukan.');
  const now = new Date().toISOString();
  let updatedRelationship: MentorshipRelationship | undefined;
  const updated = relationships.map(item => {
    if (item.id !== relationshipId) return item;
    updatedRelationship = {
      ...item,
      ended_at: now.slice(0, 10),
      end_reason: reason,
      updated_at: now
    };
    return updatedRelationship;
  });
  if (!updatedRelationship) throw new Error('Relasi pembimbingan aktif tidak ditemukan.');
  setLocalData(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, updated);
  return updatedRelationship;
}

export function mentorshipLabel(type: MentorshipType): string {
  return type === 'PRIMARY' ? 'Pembimbing utama' : 'Pembimbing pendamping';
}

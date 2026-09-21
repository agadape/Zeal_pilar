import { Group, GroupMember, MentorshipRelationship, Person, WeeklyStat } from '../types';
import { INITIAL_GROUPS, INITIAL_GROUP_MEMBERS, INITIAL_PEOPLE, INITIAL_STATS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

interface GroupQueryRow extends Group {
  people?: { full_name?: string } | null;
  group_members?: Array<{ count?: number }> | { count?: number } | null;
}

export async function fetchGroups(): Promise<Group[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: groupsData, error } = await supabase.from('groups').select(`
      *,
      people:leader_id (full_name),
      group_members (count)
    `).is('archived_at', null).order('group_name');
    if (error) throw error;
    if (groupsData) {
      return (groupsData as GroupQueryRow[]).map(g => {
        const memberCountData = g.group_members;
        const count = Array.isArray(memberCountData) 
          ? (memberCountData[0]?.count || 0) 
          : (memberCountData?.count || 0);
          
        return {
          ...g,
          leader_name: g.people?.full_name || 'Belum ditugaskan',
          members_count: count
        };
      }) as Group[];
    }
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS).filter(group => !group.archived_at);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  
  return groups.map(g => {
    const leader = people.find(p => p.id === g.leader_id);
    const count = members.filter(m => m.group_id === g.id).length;
    return {
      ...g,
      leader_name: leader ? leader.full_name : 'Belum ditugaskan',
      members_count: count
    };
  });
}

export async function saveGroup(group: Omit<Group, 'id'> & { id?: string }): Promise<Group> {
  const groupName = group.group_name.trim();
  if (!groupName) throw new Error('Nama grup wajib diisi.');
  if (group.baptism_goal !== undefined && (!Number.isInteger(group.baptism_goal) || group.baptism_goal < 0)) {
    throw new Error('Goal baptisan harus berupa angka bulat nol atau lebih.');
  }

  if (isSupabaseConfigured && supabase) {
    if (group.id) {
      const { data, error } = await supabase.from('groups').update({
        group_name: groupName,
        category: group.category,
        leader_id: group.leader_id || null,
        baptism_goal: group.baptism_goal ?? null
      }).eq('id', group.id).select().single();
      if (error) throw error;
      return data as Group;
    } else {
      const { data, error } = await supabase.from('groups').insert([{
        group_name: groupName,
        category: group.category,
        leader_id: group.leader_id || null,
        baptism_goal: group.baptism_goal ?? null
      }]).select().single();
      if (error) throw error;
      return data as Group;
    }
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  if (group.id) {
    const updated = groups.map(g => g.id === group.id ? { ...g, ...group, group_name: groupName } as Group : g);
    setLocalData(STORAGE_KEYS.GROUPS, updated);
    return updated.find(g => g.id === group.id)!;
  } else {
    const newGroup: Group = { ...group, group_name: groupName, id: `g_${crypto.randomUUID()}` } as Group;
    const updated = [...groups, newGroup];
    setLocalData(STORAGE_KEYS.GROUPS, updated);
    return newGroup;
  }
}

export async function deleteGroup(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  setLocalData(STORAGE_KEYS.GROUPS, groups.filter(g => g.id !== id));
  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, members.filter(member => member.group_id !== id));
  const relationships = getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  setLocalData(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, relationships.filter(relationship => relationship.group_id !== id));
  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  setLocalData(STORAGE_KEYS.STATS, stats.filter(stat => stat.group_id !== id));
  return true;
}

export async function fetchGroupMembers(groupId: string): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('group_members')
      .select('person_id, people (*)')
      .eq('group_id', groupId)
      .is('people.archived_at', null);
    if (error) throw error;
    if (data) {
      return (data as unknown as Array<{ person_id: string; people: Person | null }>).map(item => item.people).filter(Boolean) as Person[];
    }
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  
  const memberPersonIds = members.filter(m => m.group_id === groupId).map(m => m.person_id);
  return people.filter(p => !p.archived_at && memberPersonIds.includes(p.id));
}

export async function updateGroupMembers(groupId: string, personIds: string[]): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data: currentRows, error: currentError } = await supabase
      .from('group_members')
      .select('id, group_id, person_id')
      .eq('group_id', groupId);
    if (currentError) throw currentError;

    const currentPersonIds = new Set((currentRows || []).map(row => row.person_id as string));
    const requestedPersonIds = new Set(personIds);
    const removedIds = [...currentPersonIds].filter(personId => !requestedPersonIds.has(personId));
    const addedIds = personIds.filter(personId => !currentPersonIds.has(personId));

    if (addedIds.length > 0) {
      const { data: otherAssignments, error: assignmentError } = await supabase
        .from('group_members')
        .select('person_id, group_id')
        .in('person_id', addedIds)
        .neq('group_id', groupId);
      if (assignmentError) throw assignmentError;
      if (otherAssignments?.length) {
        throw new Error('Ada anggota yang masih terdaftar di grup lain. Pindahkan dari grup lama terlebih dahulu.');
      }
    }

    if (addedIds.length > 0) {
      const inserts = addedIds.map(pid => ({ group_id: groupId, person_id: pid }));
      const { error: insertError } = await supabase.from('group_members').insert(inserts);
      if (insertError) throw insertError;
    }

    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .in('person_id', removedIds);
      if (deleteError) {
        if (addedIds.length > 0) {
          await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .in('person_id', addedIds);
        }
        throw deleteError;
      }
    }
    return true;
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  const assignedElsewhere = members.find(member => member.group_id !== groupId && personIds.includes(member.person_id));
  if (assignedElsewhere) {
    throw new Error('Ada anggota yang masih terdaftar di grup lain. Pindahkan dari grup lama terlebih dahulu.');
  }
  const currentPersonIds = new Set(members.filter(member => member.group_id === groupId).map(member => member.person_id));
  const removedPersonIds = [...currentPersonIds].filter(personId => !personIds.includes(personId));
  const filtered = members.filter(m => m.group_id !== groupId);
  const newEntries: GroupMember[] = personIds.map(pid => ({
    id: `gm_${crypto.randomUUID()}`,
    group_id: groupId,
    person_id: pid
  }));

  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, [...filtered, ...newEntries]);
  if (removedPersonIds.length > 0) {
    const relationships = getLocalData<Array<{
      id: string;
      mentor_id: string;
      mentee_id: string;
      group_id: string;
      ended_at?: string | null;
      end_reason?: string | null;
      updated_at?: string;
    }>>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
    const now = new Date().toISOString();
    setLocalData(
      STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS,
      relationships.map(relationship => (
        !relationship.ended_at
        && relationship.group_id === groupId
        && (removedPersonIds.includes(relationship.mentor_id) || removedPersonIds.includes(relationship.mentee_id))
          ? { ...relationship, ended_at: now.slice(0, 10), end_reason: 'Keluar dari grup', updated_at: now }
          : relationship
      ))
    );
  }
  return true;
}

export async function handoverGroupLeadership(params: {
  group_id: string;
  new_leader_id: string;
  reason: string;
  notes?: string;
}): Promise<boolean> {
  const { group_id, new_leader_id, reason, notes } = params;

  if (isSupabaseConfigured && supabase) {
    const { data: currentGroup, error: currentGroupError } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', group_id)
      .single();
    if (currentGroupError) throw currentGroupError;

    const oldLeaderId = currentGroup.leader_id as string | null;
    let previousHistoryId: string | null = null;
    if (oldLeaderId) {
      const { data: history, error: historyLookupError } = await supabase
        .from('group_leadership_history')
        .select('id')
        .eq('group_id', group_id)
        .eq('leader_id', oldLeaderId)
        .is('ended_at', null)
        .maybeSingle();
      if (historyLookupError) throw historyLookupError;
      previousHistoryId = history?.id || null;
    }

    const { error: groupErr } = await supabase
      .from('groups')
      .update({ leader_id: new_leader_id, updated_at: new Date().toISOString() })
      .eq('id', group_id);

    if (groupErr) {
      throw groupErr;
    }

    if (previousHistoryId) {
      const { data: { user } } = await supabase.auth.getUser();
      let transferredBy: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('people')
          .select('id')
          .or(`auth_user_id.eq.${user.id},auth_id.eq.${user.id}`)
          .maybeSingle();
        transferredBy = profile?.id || null;
      }

      const { error: historyErr } = await supabase
        .from('group_leadership_history')
        .update({
          handover_reason: reason,
          handover_notes: notes || null,
          transferred_by: transferredBy
        })
        .eq('id', previousHistoryId);
      if (historyErr) throw historyErr;
    }

    return true;
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const currentGroup = groups.find(group => group.id === group_id);
  if (!currentGroup || currentGroup.archived_at) throw new Error('Grup aktif tidak ditemukan.');
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const newLeader = people.find(person => person.id === new_leader_id && !person.archived_at);
  if (!newLeader || newLeader.status !== 'LEADER') throw new Error('Leader baru tidak valid.');
  if (newLeader.gender !== currentGroup.category) throw new Error('Gender leader harus sama dengan kategori grup.');
  if (groups.some(group => !group.archived_at && group.id !== group_id && group.leader_id === new_leader_id)) {
    throw new Error('Leader baru masih memimpin grup lain.');
  }
  const roots = getLocalData<{ brother_root_id?: string | null; sister_root_id?: string | null }>(STORAGE_KEYS.DTREE_SETTINGS, {});
  if (roots.brother_root_id === new_leader_id || roots.sister_root_id === new_leader_id) {
    throw new Error('Pemimpin Jemaat tidak boleh menjadi leader grup.');
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  if (members.some(member => member.person_id === new_leader_id && member.group_id !== group_id)) {
    throw new Error('Leader baru masih terdaftar sebagai anggota grup lain.');
  }
  const updated = groups.map(g => g.id === group_id ? { ...g, leader_id: new_leader_id } : g);
  setLocalData(STORAGE_KEYS.GROUPS, updated);

  const withoutNewLeader = members.filter(member => !(member.group_id === group_id && member.person_id === new_leader_id));
  const oldLeaderId = currentGroup?.leader_id;
  const withOldLeader = oldLeaderId
    && oldLeaderId !== new_leader_id
    && !withoutNewLeader.some(member => member.person_id === oldLeaderId)
    ? [...withoutNewLeader, {
        id: `gm_${crypto.randomUUID()}`,
        group_id,
        person_id: oldLeaderId
      }]
    : withoutNewLeader;
  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, withOldLeader);

  const relationships = getLocalData<Array<{
    id: string;
    mentee_id: string;
    ended_at?: string | null;
    end_reason?: string | null;
    updated_at?: string;
  }>>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  const now = new Date().toISOString();
  setLocalData(
    STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS,
    relationships.map(relationship => (
      relationship.mentee_id === new_leader_id && !relationship.ended_at
        ? { ...relationship, ended_at: now.slice(0, 10), end_reason: 'Menjadi leader grup', updated_at: now }
        : relationship
    ))
  );
  return true;
}

export async function fetchPersonGroups(personId: string): Promise<Group[]> {
  if (isSupabaseConfigured && supabase) {
    const [memberResult, leaderResult] = await Promise.all([
      supabase.from('group_members').select('groups (*)').eq('person_id', personId),
      supabase.from('groups').select('*').eq('leader_id', personId).is('archived_at', null)
    ]);
    if (memberResult.error) throw memberResult.error;
    if (leaderResult.error) throw leaderResult.error;

    const memberGroups = (memberResult.data || [])
      .map(item => item.groups as unknown as Group | null)
      .filter((group): group is Group => group !== null && !group.archived_at);
    const allGroups = [...memberGroups, ...((leaderResult.data || []) as Group[])];
    return Array.from(new Map(allGroups.map(group => [group.id, group])).values());
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS);
  const groupIds = members.filter(member => member.person_id === personId).map(member => member.group_id);
  return groups.filter(group => !group.archived_at && (groupIds.includes(group.id) || group.leader_id === personId));
}

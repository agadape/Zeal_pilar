import { Group, GroupMember, Person } from '../types';
import { INITIAL_GROUPS, INITIAL_GROUP_MEMBERS, INITIAL_PEOPLE } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchGroups(): Promise<Group[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: groupsData, error } = await supabase.from('groups').select(`
      *,
      people:leader_id (full_name),
      group_members (count)
    `).order('group_name');
    if (error) throw error;
    if (groupsData) {
      return groupsData.map((g: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
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

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  
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
  if (isSupabaseConfigured && supabase) {
    if (group.id) {
      const { data, error } = await supabase.from('groups').update({
        group_name: group.group_name,
        category: group.category,
        leader_id: group.leader_id,
        baptism_goal: group.baptism_goal
      }).eq('id', group.id).select().single();
      if (error) throw error;
      return data as Group;
    } else {
      const { data, error } = await supabase.from('groups').insert([{
        group_name: group.group_name,
        category: group.category,
        leader_id: group.leader_id,
        baptism_goal: group.baptism_goal
      }]).select().single();
      if (error) throw error;
      return data as Group;
    }
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  if (group.id) {
    const updated = groups.map(g => g.id === group.id ? { ...g, ...group } as Group : g);
    setLocalData(STORAGE_KEYS.GROUPS, updated);
    return updated.find(g => g.id === group.id)!;
  } else {
    const newGroup: Group = { ...group, id: 'g_' + Date.now() } as Group;
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
  return true;
}

export async function fetchGroupMembers(groupId: string): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('group_members')
      .select('person_id, people (*)')
      .eq('group_id', groupId);
    if (error) throw error;
    if (data) {
      return (data as unknown as Array<{ person_id: string; people: Person | null }>).map(item => item.people).filter(Boolean) as Person[];
    }
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  
  const memberPersonIds = members.filter(m => m.group_id === groupId).map(m => m.person_id);
  return people.filter(p => memberPersonIds.includes(p.id));
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

    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .in('person_id', removedIds);
      if (deleteError) throw deleteError;
    }

    if (addedIds.length > 0) {
      const inserts = addedIds.map(pid => ({ group_id: groupId, person_id: pid }));
      const { error: insertError } = await supabase.from('group_members').insert(inserts);
      if (insertError) throw insertError;
    }
    return true;
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  const assignedElsewhere = members.find(member => member.group_id !== groupId && personIds.includes(member.person_id));
  if (assignedElsewhere) {
    throw new Error('Ada anggota yang masih terdaftar di grup lain. Pindahkan dari grup lama terlebih dahulu.');
  }
  const currentPersonIds = new Set(members.filter(member => member.group_id === groupId).map(member => member.person_id));
  const removedPersonIds = [...currentPersonIds].filter(personId => !personIds.includes(personId));
  const filtered = members.filter(m => m.group_id !== groupId);
  const newEntries: GroupMember[] = personIds.map(pid => ({
    id: 'gm_' + Math.random().toString(36).substr(2, 9),
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
  const updated = groups.map(g => g.id === group_id ? { ...g, leader_id: new_leader_id } : g);
  setLocalData(STORAGE_KEYS.GROUPS, updated);

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  const withoutNewLeader = members.filter(member => !(member.group_id === group_id && member.person_id === new_leader_id));
  const oldLeaderId = currentGroup?.leader_id;
  const withOldLeader = oldLeaderId
    && oldLeaderId !== new_leader_id
    && !withoutNewLeader.some(member => member.person_id === oldLeaderId)
    ? [...withoutNewLeader, {
        id: `gm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
      supabase.from('groups').select('*').eq('leader_id', personId)
    ]);
    if (memberResult.error) throw memberResult.error;
    if (leaderResult.error) throw leaderResult.error;

    const memberGroups = (memberResult.data || [])
      .map(item => item.groups as unknown as Group | null)
      .filter((group): group is Group => Boolean(group));
    const allGroups = [...memberGroups, ...((leaderResult.data || []) as Group[])];
    return Array.from(new Map(allGroups.map(group => [group.id, group])).values());
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  const groupIds = members.filter(member => member.person_id === personId).map(member => member.group_id);
  return groups.filter(group => groupIds.includes(group.id) || group.leader_id === personId);
}

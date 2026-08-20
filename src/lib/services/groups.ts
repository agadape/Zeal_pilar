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
    if (error) console.error("Supabase error (fetchGroups):", error);
    
    if (!error && groupsData) {
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
      if (error) console.error("Supabase error (saveGroup update):", error);
      if (!error && data) return data as Group;
    } else {
      const { data, error } = await supabase.from('groups').insert([{
        group_name: group.group_name,
        category: group.category,
        leader_id: group.leader_id,
        baptism_goal: group.baptism_goal
      }]).select().single();
      if (error) console.error("Supabase error (saveGroup insert):", error);
      if (!error && data) return data as Group;
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
    if (error) console.error("Supabase error (deleteGroup):", error);
    if (!error) return true;
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
    if (error) console.error("Supabase error (fetchGroupMembers):", error);
    if (!error && data) {
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
    await supabase.from('group_members').delete().eq('group_id', groupId);
    if (personIds.length > 0) {
      const inserts = personIds.map(pid => ({ group_id: groupId, person_id: pid }));
      await supabase.from('group_members').insert(inserts);
    }
    return true;
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as unknown as GroupMember[]);
  const filtered = members.filter(m => m.group_id !== groupId);
  const newEntries: GroupMember[] = personIds.map(pid => ({
    id: 'gm_' + Math.random().toString(36).substr(2, 9),
    group_id: groupId,
    person_id: pid
  }));

  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, [...filtered, ...newEntries]);
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
    const { error: groupErr } = await supabase
      .from('groups')
      .update({ leader_id: new_leader_id, updated_at: new Date().toISOString() })
      .eq('id', group_id);

    if (groupErr) {
      console.error('Handover group update error:', groupErr);
      return false;
    }

    const { error: historyErr } = await supabase
      .from('group_leadership_history')
      .update({
        handover_reason: reason,
        handover_notes: notes || null
      })
      .eq('group_id', group_id)
      .eq('leader_id', new_leader_id)
      .is('ended_at', null);

    if (historyErr) console.error('Handover history update error:', historyErr);

    return true;
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const updated = groups.map(g => g.id === group_id ? { ...g, leader_id: new_leader_id } : g);
  setLocalData(STORAGE_KEYS.GROUPS, updated);
  return true;
}

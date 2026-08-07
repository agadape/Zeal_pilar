import { createClient } from '@supabase/supabase-js';
import { Person, Group, GroupMember, WeeklyStat, MinistryEvent, Announcement } from './types';
import { 
  INITIAL_PEOPLE, 
  INITIAL_GROUPS, 
  INITIAL_GROUP_MEMBERS, 
  INITIAL_STATS, 
  INITIAL_EVENTS, 
  INITIAL_ANNOUNCEMENTS 
} from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// LOCAL STORAGE PERSISTENCE LAYER (FALLBACK)
// ==========================================

const STORAGE_KEYS = {
  PEOPLE: 'tugu_people',
  GROUPS: 'tugu_groups',
  GROUP_MEMBERS: 'tugu_group_members',
  STATS: 'tugu_stats',
  EVENTS: 'tugu_events',
  ANNOUNCEMENTS: 'tugu_announcements',
};

function getLocalData<T>(key: string, initialDefault: T): T {
  if (typeof window === 'undefined') return initialDefault;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialDefault;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return initialDefault;
  }
}

function setLocalData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// ---------------- PEOPLE API ----------------

export async function fetchPeople(): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('people').select('*').order('full_name');
    if (!error && data) return data as Person[];
  }
  return getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
}

export async function savePerson(person: Omit<Person, 'id'> & { id?: string }): Promise<Person> {
  if (isSupabaseConfigured && supabase) {
    if (person.id) {
      const { data, error } = await supabase.from('people').update(person).eq('id', person.id).select().single();
      if (!error && data) return data as Person;
    } else {
      const { data, error } = await supabase.from('people').insert([person]).select().single();
      if (!error && data) return data as Person;
    }
  }

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  if (person.id) {
    const updated = people.map(p => p.id === person.id ? { ...p, ...person } as Person : p);
    setLocalData(STORAGE_KEYS.PEOPLE, updated);
    return updated.find(p => p.id === person.id)!;
  } else {
    const newPerson: Person = { ...person, id: 'p_' + Date.now() } as Person;
    const updated = [newPerson, ...people];
    setLocalData(STORAGE_KEYS.PEOPLE, updated);
    return newPerson;
  }
}

export async function deletePerson(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (!error) return true;
  }
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const updated = people.filter(p => p.id !== id);
  setLocalData(STORAGE_KEYS.PEOPLE, updated);
  return true;
}

// ---------------- GROUPS API ----------------

export async function fetchGroups(): Promise<Group[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('groups').select(`
      *,
      people:leader_id (full_name)
    `).order('group_name');
    
    if (!error && data) {
      return data.map((g: any) => ({
        ...g,
        leader_name: g.people?.full_name || 'Belum ditugaskan'
      })) as Group[];
    }
  }

  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  
  return groups.map(g => {
    const leader = people.find(p => p.id === g.leader_id);
    return {
      ...g,
      leader_name: leader ? leader.full_name : 'Belum ditugaskan'
    };
  });
}

export async function saveGroup(group: Omit<Group, 'id'> & { id?: string }): Promise<Group> {
  if (isSupabaseConfigured && supabase) {
    if (group.id) {
      const { data, error } = await supabase.from('groups').update({
        group_name: group.group_name,
        category: group.category,
        leader_id: group.leader_id
      }).eq('id', group.id).select().single();
      if (!error && data) return data as Group;
    } else {
      const { data, error } = await supabase.from('groups').insert([{
        group_name: group.group_name,
        category: group.category,
        leader_id: group.leader_id
      }]).select().single();
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
    if (!error) return true;
  }
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  setLocalData(STORAGE_KEYS.GROUPS, groups.filter(g => g.id !== id));
  return true;
}

// ---------------- GROUP MEMBERS API ----------------

export async function fetchGroupMembers(groupId: string): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('group_members')
      .select('person_id, people (*)')
      .eq('group_id', groupId);
    if (!error && data) {
      return data.map((item: any) => item.people).filter(Boolean) as Person[];
    }
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as any);
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  
  const memberPersonIds = members.filter(m => m.group_id === groupId).map(m => m.person_id);
  return people.filter(p => memberPersonIds.includes(p.id));
}

export async function updateGroupMembers(groupId: string, personIds: string[]): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    // Delete existing
    await supabase.from('group_members').delete().eq('group_id', groupId);
    // Insert new
    if (personIds.length > 0) {
      const inserts = personIds.map(pid => ({ group_id: groupId, person_id: pid }));
      await supabase.from('group_members').insert(inserts);
    }
    return true;
  }

  const members = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, INITIAL_GROUP_MEMBERS as any);
  const filtered = members.filter(m => m.group_id !== groupId);
  const newEntries: GroupMember[] = personIds.map(pid => ({
    id: 'gm_' + Math.random().toString(36).substr(2, 9),
    group_id: groupId,
    person_id: pid
  }));

  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, [...filtered, ...newEntries]);
  return true;
}

// ---------------- WEEKLY STATS API ----------------

export async function fetchWeeklyStats(): Promise<WeeklyStat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('weekly_stats').select(`
      *,
      groups:group_id (group_name)
    `).order('week_date', { ascending: false });

    if (!error && data) {
      return data.map((ws: any) => ({
        ...ws,
        group_name: ws.groups?.group_name || 'Group'
      })) as WeeklyStat[];
    }
  }

  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);

  return stats.map(s => {
    const group = groups.find(g => g.id === s.group_id);
    return {
      ...s,
      group_name: group ? group.group_name : 'Group'
    };
  });
}

export async function saveWeeklyStat(stat: Omit<WeeklyStat, 'id'> & { id?: string }): Promise<WeeklyStat> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('weekly_stats').insert([stat]).select().single();
    if (!error && data) return data as WeeklyStat;
  }

  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  const newStat: WeeklyStat = { ...stat, id: 'ws_' + Date.now() } as WeeklyStat;
  const updated = [newStat, ...stats];
  setLocalData(STORAGE_KEYS.STATS, updated);
  return newStat;
}

// ---------------- EVENTS API ----------------

export async function fetchEvents(): Promise<MinistryEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (!error && data) return data as MinistryEvent[];
  }
  return getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export async function saveEvent(event: Omit<MinistryEvent, 'id'> & { id?: string }): Promise<MinistryEvent> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('events').insert([event]).select().single();
    if (!error && data) return data as MinistryEvent;
  }

  const events = getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const newEvent: MinistryEvent = { ...event, id: 'ev_' + Date.now() } as MinistryEvent;
  const updated = [newEvent, ...events];
  setLocalData(STORAGE_KEYS.EVENTS, updated);
  return newEvent;
}

// ---------------- ANNOUNCEMENTS API ----------------

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (!error && data) return data as Announcement[];
  }
  return getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export async function saveAnnouncement(announcement: Omit<Announcement, 'id'> & { id?: string }): Promise<Announcement> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('announcements').insert([announcement]).select().single();
    if (!error && data) return data as Announcement;
  }

  const announcements = getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  const newAnn: Announcement = { ...announcement, id: 'an_' + Date.now(), created_at: new Date().toISOString() } as Announcement;
  const updated = [newAnn, ...announcements];
  setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  return newAnn;
}

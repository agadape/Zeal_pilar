import { createBrowserClient } from '@supabase/ssr';
import { 
  Person, 
  Group, 
  GroupMember, 
  WeeklyStat, 
  MinistryEvent, 
  Announcement, 
  WeeklyStudyProgressLog, 
  UpcomingMilestone
} from './types';
import { 
  INITIAL_PEOPLE, 
  INITIAL_GROUPS, 
  INITIAL_GROUP_MEMBERS, 
  INITIAL_STATS, 
  INITIAL_EVENTS, 
  INITIAL_ANNOUNCEMENTS 
} from './mockData';

const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// LOCAL STORAGE PERSISTENCE LAYER (FALLBACK)
// ==========================================

const STORAGE_KEYS = {
  PEOPLE: 'tugu_people_v2',
  GROUPS: 'tugu_groups_v2',
  GROUP_MEMBERS: 'tugu_group_members_v2',
  STATS: 'tugu_stats_v2',
  EVENTS: 'tugu_events_v2',
  ANNOUNCEMENTS: 'tugu_announcements_v2',
  BIBLE_STUDY_LOGS: 'tugu_bs_logs_v2',
};

// Automatic one-time purge of legacy seed data cached in browser LocalStorage
if (typeof window !== 'undefined') {
  const PURGE_KEY = 'tugu_legacy_purged_v3';
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.removeItem('tugu_people');
    localStorage.removeItem('tugu_groups');
    localStorage.removeItem('tugu_group_members');
    localStorage.removeItem('tugu_stats');
    localStorage.removeItem('tugu_events');
    localStorage.removeItem('tugu_announcements');
    localStorage.removeItem('tugu_people_v2');
    localStorage.removeItem('tugu_groups_v2');
    localStorage.setItem(PURGE_KEY, 'true');
  }
}

export function clearLocalCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}

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

// ---------------- PEOPLE & BIBLE STUDY LOGS API ----------------

export async function fetchPeople(): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('people').select(`
      *,
      bible_study_logs (*)
    `).order('full_name');

    if (!error && data) {
      return data.map((p: Record<string, unknown> & { bible_study_logs?: WeeklyStudyProgressLog[] }) => {
        const logs = (p.bible_study_logs || []).sort((a, b) => a.week_number - b.week_number);
        const latestLog = logs[logs.length - 1];
        const computedStage = latestLog ? `Minggu ${latestLog.week_number}: ${latestLog.lesson_topic}` : (p.study_stage as string);
        return {
          ...p,
          study_stage: computedStage,
          study_history: logs
        } as Person;
      });
    }
  }

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const bsLogs = getLocalData<{ id: string; person_id: string; week_number: number; study_date: string; lesson_topic: string; notes?: string }[]>(STORAGE_KEYS.BIBLE_STUDY_LOGS, []);

  return people.map(p => {
    const logs = bsLogs.filter(l => l.person_id === p.id).sort((a, b) => a.week_number - b.week_number);
    const latestLog = logs[logs.length - 1];
    const computedStage = latestLog ? `Minggu ${latestLog.week_number}: ${latestLog.lesson_topic}` : p.study_stage;
    return {
      ...p,
      study_stage: computedStage,
      study_history: logs
    };
  });
}

export async function savePerson(person: Omit<Person, 'id'> & { id?: string; study_history?: Person['study_history'] }): Promise<Person> {
  const payload = {
    full_name: person.full_name,
    gender: person.gender,
    phone_number: person.phone_number || null,
    campus: person.campus || null,
    status: person.status,
    birth_date: person.birth_date || null,
    baptism_date: person.baptism_date || null,
    study_stage: person.study_stage || null,
    notes: person.notes || null,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    if (person.id) {
      const { data, error } = await supabase.from('people').update(payload).eq('id', person.id).select().single();
      if (error) console.error("Supabase error (savePerson update):", error);
      if (!error && data) return { ...data, study_history: person.study_history } as Person;
    } else {
      const { data, error } = await supabase.from('people').insert([payload]).select().single();
      if (error) console.error("Supabase error (savePerson insert):", error);
      if (!error && data) return { ...data, study_history: person.study_history } as Person;
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

// ---------------- UPCOMING MILESTONES API ----------------

export async function fetchUpcomingMilestones(): Promise<UpcomingMilestone[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('upcoming_milestones').select('*');
    if (error) console.error("Supabase error (fetchUpcomingMilestones):", error);
    if (!error && data) {
      return (data as UpcomingMilestone[])
        .map(m => {
          const nextDate = new Date(m.next_occurrence);
          const today = new Date();
          today.setHours(0,0,0,0);

          if (nextDate < today) {
            nextDate.setFullYear(today.getFullYear() + 1);
          }

          const days = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          return {
            ...m,
            next_occurrence: nextDate.toISOString().split('T')[0],
            days_until: days
          };
        })
        .filter(m => m.days_until >= 0 && m.days_until <= 30)
        .sort((a, b) => a.days_until - b.days_until);
    }
  }

  // JS Fallback for Local Storage people
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const results: UpcomingMilestone[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  people.forEach(p => {
    if (p.birth_date) {
      const bdate = new Date(p.birth_date);
      const nextBday = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate());
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const days = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (days >= 0 && days <= 30) {
        results.push({
          person_id: p.id,
          full_name: p.full_name,
          gender: p.gender,
          milestone_type: 'BIRTHDAY',
          original_date: p.birth_date,
          years_count: today.getFullYear() - bdate.getFullYear(),
          next_occurrence: nextBday.toISOString().split('T')[0],
          days_until: days
        });
      }
    }

    if (p.baptism_date) {
      const bapDate = new Date(p.baptism_date);
      const nextBap = new Date(today.getFullYear(), bapDate.getMonth(), bapDate.getDate());
      if (nextBap < today) nextBap.setFullYear(today.getFullYear() + 1);
      const days = Math.ceil((nextBap.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (days >= 0 && days <= 30) {
        const yearsCount = Math.max(1, today.getFullYear() - bapDate.getFullYear());
        results.push({
          person_id: p.id,
          full_name: p.full_name,
          gender: p.gender,
          milestone_type: 'SPIRITUAL_BIRTHDAY',
          original_date: p.baptism_date,
          years_count: yearsCount,
          next_occurrence: nextBap.toISOString().split('T')[0],
          days_until: days
        });
      }
    }
  });

  return results.sort((a, b) => a.days_until - b.days_until);
}

// ---------------- LEADERSHIP HANDOVER API ----------------

export async function handoverGroupLeadership(params: {
  group_id: string;
  new_leader_id: string;
  reason: string;
  notes?: string;
}): Promise<boolean> {
  const { group_id, new_leader_id, reason, notes } = params;

  if (isSupabaseConfigured && supabase) {
    // 1. Update groups.leader_id (Trigger log_leadership_change will auto-run at DB level!)
    const { error: groupErr } = await supabase
      .from('groups')
      .update({ leader_id: new_leader_id, updated_at: new Date().toISOString() })
      .eq('id', group_id);

    if (groupErr) {
      console.error('Handover group update error:', groupErr);
      return false;
    }

    // 2. Enrich leadership_history row with reason and notes
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

  // Local fallback
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  const updated = groups.map(g => g.id === group_id ? { ...g, leader_id: new_leader_id } : g);
  setLocalData(STORAGE_KEYS.GROUPS, updated);
  return true;
}

export async function saveBibleStudyLog(log: Omit<WeeklyStudyProgressLog, 'id'> & { person_id: string }): Promise<WeeklyStudyProgressLog> {
  const payload = {
    person_id: log.person_id,
    week_number: log.week_number,
    study_date: log.study_date,
    lesson_topic: log.lesson_topic,
    notes: log.notes || null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('bible_study_logs').insert([payload]).select().single();
    if (error) console.error("Supabase error (saveBibleStudyLog):", error);
    if (!error && data) {
      // Update people.study_stage to current latest stage
      await supabase.from('people').update({
        study_stage: `Minggu ${log.week_number}: ${log.lesson_topic}`
      }).eq('id', log.person_id);
      return data as WeeklyStudyProgressLog;
    }
  }

  const logs = getLocalData<WeeklyStudyProgressLog[]>(STORAGE_KEYS.BIBLE_STUDY_LOGS, []);
  const newLog: WeeklyStudyProgressLog = { ...payload, id: 'bs_' + Date.now() } as WeeklyStudyProgressLog;
  setLocalData(STORAGE_KEYS.BIBLE_STUDY_LOGS, [...logs, newLog]);

  // Update local person study_stage
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const updatedPeople = people.map(p => p.id === log.person_id ? { ...p, study_stage: `Minggu ${log.week_number}: ${log.lesson_topic}` } : p);
  setLocalData(STORAGE_KEYS.PEOPLE, updatedPeople);

  return newLog;
}

export async function deletePerson(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) console.error("Supabase error (deletePerson):", error);
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
    const { data: groupsData, error } = await supabase.from('groups').select(`
      *,
      people:leader_id (full_name),
      group_members (count)
    `).order('group_name');
    if (error) console.error("Supabase error (fetchGroups):", error);
    
    if (!error && groupsData) {
      return groupsData.map((g: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
        // extract count from [{ count: X }] or { count: X } depending on postgres version
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

// ---------------- GROUP MEMBERS API ----------------

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
    // Delete existing
    await supabase.from('group_members').delete().eq('group_id', groupId);
    // Insert new
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

// ---------------- WEEKLY STATS API ----------------

export async function fetchWeeklyStats(): Promise<WeeklyStat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('weekly_stats').select(`
      *,
      groups:group_id (group_name)
    `).order('week_date', { ascending: false });

    if (!error && data) {
      return data.map((ws: Record<string, unknown> & { groups?: { group_name?: string } }) => ({
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
  const payload = {
    group_id: stat.group_id,
    week_date: stat.week_date,
    active_disciples_count: stat.active_disciples_count,
    missing_ibadah_count: stat.missing_ibadah_count,
    missing_reasons: stat.missing_reasons || [],
    study_progress: stat.study_progress || [],
    reachout_count: stat.reachout_count,
    reachouts_list: stat.reachouts_list || [],
    sunday_visitors_count: stat.sunday_visitors_count,
    event_visitors_count: stat.event_visitors_count,
    baptisms_count: stat.baptisms_count,
    notes: stat.notes || null,
  };

  if (isSupabaseConfigured && supabase) {
    // Upsert on group_id, week_date constraint to prevent duplicates
    const { data, error } = await supabase
      .from('weekly_stats')
      .upsert([payload], { onConflict: 'group_id,week_date' })
      .select()
      .single();

    if (!error && data) {
      const savedStat = data as WeeklyStat;

      // Populate normalized relational tables
      if (stat.missing_reasons && stat.missing_reasons.length > 0) {
        await supabase.from('weekly_stat_absences').delete().eq('weekly_stat_id', savedStat.id);
        const absenceRows = stat.missing_reasons.map(m => ({
          weekly_stat_id: savedStat.id,
          person_id: m.person_id || null,
          person_name: m.person_name,
          reason: m.reason
        }));
        await supabase.from('weekly_stat_absences').insert(absenceRows);
      }

      if (stat.study_progress && stat.study_progress.length > 0) {
        await supabase.from('weekly_stat_study_progress').delete().eq('weekly_stat_id', savedStat.id);
        const progressRows = stat.study_progress.map(sp => ({
          weekly_stat_id: savedStat.id,
          person_id: sp.person_id || null,
          person_name: sp.person_name,
          stage: sp.stage
        }));
        await supabase.from('weekly_stat_study_progress').insert(progressRows);
      }

      return savedStat;
    } else if (error) {
      console.error('Supabase upsert weekly_stat error:', error);
    }
  }

  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  const newStat: WeeklyStat = { ...payload, id: stat.id || 'ws_' + Date.now() } as WeeklyStat;
  const updated = [newStat, ...stats.filter(s => !(s.group_id === newStat.group_id && s.week_date === newStat.week_date))];
  setLocalData(STORAGE_KEYS.STATS, updated);
  return newStat;
}

export async function deleteWeeklyStat(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('weekly_stats').delete().eq('id', id);
  }
  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  setLocalData(STORAGE_KEYS.STATS, stats.filter(s => s.id !== id));
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

export async function deleteEvent(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('events').delete().eq('id', id);
  }
  const events = getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  setLocalData(STORAGE_KEYS.EVENTS, events.filter(e => e.id !== id));
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

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('announcements').delete().eq('id', id);
  }
  const announcements = getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, announcements.filter(a => a.id !== id));
}


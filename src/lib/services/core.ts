import { createBrowserClient } from '@supabase/ssr';

const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const STORAGE_KEYS = {
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

export function getLocalData<T>(key: string, initialDefault: T): T {
  if (typeof window === 'undefined') return initialDefault;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialDefault;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return initialDefault;
  }
}

export function setLocalData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

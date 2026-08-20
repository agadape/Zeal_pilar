import { Announcement } from '../types';
import { INITIAL_ANNOUNCEMENTS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (!error && data) return data as Announcement[];
  }
  return getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export async function saveAnnouncement(announcement: Omit<Announcement, 'id' | 'author_name'> & { id?: string }): Promise<Announcement> {
  let authorName = 'System';
  
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      authorName = user.email.split('@')[0];
    }
    
    const annToSave = { ...announcement, author_name: authorName };
    const { data, error } = await supabase.from('announcements').insert([annToSave]).select().single();
    if (!error && data) return data as Announcement;
  }

  const announcements = getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  const newAnn: Announcement = { ...announcement, author_name: authorName, id: 'an_' + Date.now(), created_at: new Date().toISOString() } as Announcement;
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

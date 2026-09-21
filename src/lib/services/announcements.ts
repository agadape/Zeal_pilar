import { Announcement } from '../types';
import { INITIAL_ANNOUNCEMENTS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Announcement[];
  }
  return getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export async function saveAnnouncement(announcement: Omit<Announcement, 'id' | 'author_name'> & { id?: string }): Promise<Announcement> {
  const title = announcement.title.trim();
  const content = announcement.content.trim();
  if (!title || !content) throw new Error('Judul dan isi pengumuman wajib diisi.');

  if (isSupabaseConfigured && supabase) {
    const editableFields = {
      title,
      content,
      is_pinned: announcement.is_pinned
    };

    if (announcement.id) {
      const result = await supabase
        .from('announcements')
        .update(editableFields)
        .eq('id', announcement.id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data as Announcement;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Sesi login tidak valid.');

    const { data: profile, error: profileError } = await supabase
      .from('people')
      .select('id, full_name')
      .or(`auth_user_id.eq.${user.id},auth_id.eq.${user.id}`)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error('Profil user tidak terhubung ke data people.');

    const result = await supabase.from('announcements').insert([{
      ...editableFields,
      author_name: profile.full_name,
      author_id: profile.id
    }]).select().single();
    if (result.error) throw result.error;
    return result.data as Announcement;
  }

  const announcements = getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  if (announcement.id) {
    const existing = announcements.find(item => item.id === announcement.id);
    if (!existing) throw new Error('Pengumuman tidak ditemukan.');
    const updatedAnnouncement: Announcement = {
      ...existing,
      title,
      content,
      is_pinned: announcement.is_pinned
    };
    setLocalData(
      STORAGE_KEYS.ANNOUNCEMENTS,
      announcements.map(item => item.id === announcement.id ? updatedAnnouncement : item)
    );
    return updatedAnnouncement;
  }

  const newAnn: Announcement = {
    ...announcement,
    title,
    content,
    author_name: 'Local Admin',
    author_id: 'local_admin',
    id: `an_${crypto.randomUUID()}`,
    created_at: new Date().toISOString()
  } as Announcement;
  const updated = [newAnn, ...announcements];
  setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  return newAnn;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const announcements = getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, announcements.filter(a => a.id !== id));
}

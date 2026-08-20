import { MinistryEvent } from '../types';
import { INITIAL_EVENTS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

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

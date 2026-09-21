import { EventRoster, MinistryEvent } from '../types';
import { INITIAL_EVENTS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchEvents(): Promise<MinistryEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('events').select(`
      *,
      event_rosters (*, people:person_id (full_name))
    `).order('event_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(event => ({
      ...event,
      roster: (event.event_rosters || []).map((entry: EventRoster & { people?: { full_name?: string } | null }) => ({
        id: entry.id,
        event_id: entry.event_id,
        person_id: entry.person_id,
        role: entry.role,
        person_name: entry.people?.full_name
      }))
    })) as MinistryEvent[];
  }
  return getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export async function saveEvent(event: Omit<MinistryEvent, 'id'> & { id?: string }): Promise<MinistryEvent> {
  if (!event.title.trim() || Number.isNaN(new Date(event.event_date).getTime())) {
    throw new Error('Judul dan waktu event wajib diisi dengan benar.');
  }
  const roster = event.roster || [];
  if (new Set(roster.map(entry => entry.role)).size !== roster.length) {
    throw new Error('Setiap peran pelayanan hanya boleh ditugaskan satu kali.');
  }
  const normalizedEvent = {
    ...event,
    title: event.title.trim(),
    location: event.location?.trim() || undefined,
    description: event.description?.trim() || undefined,
    roster
  };

  if (isSupabaseConfigured && supabase) {
    const eventPayload = {
      title: normalizedEvent.title,
      type: event.type,
      event_date: event.event_date,
      location: normalizedEvent.location || null,
      description: normalizedEvent.description || null
    };

    const previousSnapshot = event.id
      ? await supabase
          .from('events')
          .select('title, type, event_date, location, description, event_rosters(person_id, role)')
          .eq('id', event.id)
          .single()
      : null;
    if (previousSnapshot?.error) throw previousSnapshot.error;

    const result = event.id
      ? await supabase.from('events').update(eventPayload).eq('id', event.id).select().single()
      : await supabase.from('events').insert([eventPayload]).select().single();
    if (result.error) throw result.error;

    const savedEvent = result.data as MinistryEvent;
    try {
      const { error: deleteRosterError } = await supabase.from('event_rosters').delete().eq('event_id', savedEvent.id);
      if (deleteRosterError) throw deleteRosterError;

      if (roster.length > 0) {
        const rosterRows = roster.map(entry => ({
          event_id: savedEvent.id,
          person_id: entry.person_id,
          role: entry.role
        }));
        const { error: rosterError } = await supabase.from('event_rosters').insert(rosterRows);
        if (rosterError) throw rosterError;
      }
    } catch (saveError) {
      if (!event.id) {
        await supabase.from('events').delete().eq('id', savedEvent.id);
      } else if (previousSnapshot?.data) {
        const { event_rosters: previousRoster = [], ...previousEvent } = previousSnapshot.data;
        await supabase.from('events').update(previousEvent).eq('id', savedEvent.id);
        await supabase.from('event_rosters').delete().eq('event_id', savedEvent.id);
        if (previousRoster.length > 0) {
          await supabase.from('event_rosters').insert(previousRoster.map(entry => ({
            event_id: savedEvent.id,
            person_id: entry.person_id,
            role: entry.role
          })));
        }
      }
      throw saveError;
    }

    const refreshedEvents = await fetchEvents();
    return refreshedEvents.find(item => item.id === savedEvent.id) || savedEvent;
  }

  const events = getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  if (event.id) {
    const existing = events.find(item => item.id === event.id);
    if (!existing) throw new Error('Event tidak ditemukan.');
    const updatedEvent = { ...existing, ...normalizedEvent, id: event.id } as MinistryEvent;
    setLocalData(STORAGE_KEYS.EVENTS, events.map(item => item.id === event.id ? updatedEvent : item));
    return updatedEvent;
  }

  const newEvent: MinistryEvent = { ...normalizedEvent, id: `ev_${crypto.randomUUID()}` } as MinistryEvent;
  const updated = [newEvent, ...events];
  setLocalData(STORAGE_KEYS.EVENTS, updated);
  return newEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const events = getLocalData<MinistryEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  setLocalData(STORAGE_KEYS.EVENTS, events.filter(e => e.id !== id));
}

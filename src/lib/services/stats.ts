import { WeeklyStat, MissingReason, StudyProgress, Group } from '../types';
import { INITIAL_STATS, INITIAL_GROUPS } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchWeeklyStats(): Promise<WeeklyStat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('weekly_stats').select(`
      *,
      groups:group_id (group_name),
      weekly_stat_absences ( person_id, person_name, reason ),
      weekly_stat_study_progress ( person_id, person_name, stage )
    `).order('week_date', { ascending: false });

    if (error) throw error;
    if (data) {
      return data.map((ws: Record<string, unknown> & { groups?: { group_name?: string }; weekly_stat_absences?: MissingReason[]; weekly_stat_study_progress?: StudyProgress[] }) => {
        const { groups: joinedGroup, weekly_stat_absences, weekly_stat_study_progress, ...rest } = ws;
        return {
          ...rest,
          group_name: joinedGroup?.group_name || 'Group',
          missing_reasons: weekly_stat_absences || [],
          study_progress: weekly_stat_study_progress || []
        };
      }) as WeeklyStat[];
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
  const countFields = [
    stat.active_disciples_count,
    stat.sunday_visitors_count,
    stat.event_visitors_count,
    stat.baptisms_count
  ];
  if (!stat.group_id || !stat.week_date) throw new Error('Grup dan tanggal laporan wajib diisi.');
  if (countFields.some(value => !Number.isInteger(value) || value < 0)) {
    throw new Error('Semua jumlah statistik harus berupa angka bulat nol atau lebih.');
  }

  const missingReasons = (stat.missing_reasons || []).map(item => ({
    ...item,
    person_name: item.person_name.trim(),
    reason: item.reason.trim()
  }));
  if (missingReasons.some(item => !item.person_name || !item.reason)) {
    throw new Error('Nama dan alasan missing wajib diisi.');
  }
  const reachouts = stat.reachouts_list || [];

  const payload = {
    group_id: stat.group_id,
    week_date: stat.week_date,
    active_disciples_count: stat.active_disciples_count,
    missing_ibadah_count: missingReasons.length,
    reachout_count: reachouts.length,
    reachouts_list: reachouts,
    sunday_visitors_count: stat.sunday_visitors_count,
    event_visitors_count: stat.event_visitors_count,
    baptisms_count: stat.baptisms_count,
    notes: stat.notes || null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data: previousHeader, error: previousHeaderError } = await supabase
      .from('weekly_stats')
      .select('active_disciples_count, missing_ibadah_count, reachout_count, reachouts_list, sunday_visitors_count, event_visitors_count, baptisms_count, notes')
      .eq('group_id', stat.group_id)
      .eq('week_date', stat.week_date)
      .maybeSingle();
    if (previousHeaderError) throw previousHeaderError;

    // Upsert on group_id, week_date constraint to prevent duplicates
    const { data, error } = await supabase
      .from('weekly_stats')
      .upsert([payload], { onConflict: 'group_id,week_date' })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Supabase tidak mengembalikan data laporan yang disimpan.');

    const savedStat = data as WeeklyStat;
    const [previousAbsencesResult, previousProgressResult] = await Promise.all([
      supabase.from('weekly_stat_absences').select('person_id, person_name, reason').eq('weekly_stat_id', savedStat.id),
      supabase.from('weekly_stat_study_progress').select('person_id, person_name, stage').eq('weekly_stat_id', savedStat.id)
    ]);
    if (previousAbsencesResult.error) throw previousAbsencesResult.error;
    if (previousProgressResult.error) throw previousProgressResult.error;

    try {
      // Replace normalized relational rows. Empty lists intentionally clear old details.
      const { error: deleteAbsenceError } = await supabase.from('weekly_stat_absences').delete().eq('weekly_stat_id', savedStat.id);
      if (deleteAbsenceError) throw deleteAbsenceError;
      if (missingReasons.length > 0) {
        const absenceRows = missingReasons.map(m => ({
          weekly_stat_id: savedStat.id,
          person_id: m.person_id || null,
          person_name: m.person_name,
          reason: m.reason
        }));
        const { error: absenceError } = await supabase.from('weekly_stat_absences').insert(absenceRows);
        if (absenceError) throw absenceError;
      }

      const { error: deleteProgressError } = await supabase.from('weekly_stat_study_progress').delete().eq('weekly_stat_id', savedStat.id);
      if (deleteProgressError) throw deleteProgressError;
      if (stat.study_progress && stat.study_progress.length > 0) {
        const progressRows = stat.study_progress.map(sp => ({
          weekly_stat_id: savedStat.id,
          person_id: sp.person_id || null,
          person_name: sp.person_name,
          stage: sp.stage
        }));
        const { error: progressError } = await supabase.from('weekly_stat_study_progress').insert(progressRows);
        if (progressError) throw progressError;
      }
    } catch (detailError) {
      if (!previousHeader) {
        await supabase.from('weekly_stats').delete().eq('id', savedStat.id);
      } else {
        await Promise.all([
          supabase.from('weekly_stat_absences').delete().eq('weekly_stat_id', savedStat.id),
          supabase.from('weekly_stat_study_progress').delete().eq('weekly_stat_id', savedStat.id),
          supabase.from('weekly_stats').update(previousHeader).eq('id', savedStat.id)
        ]);
        if (previousAbsencesResult.data?.length) {
          await supabase.from('weekly_stat_absences').insert(previousAbsencesResult.data.map(item => ({
            ...item,
            weekly_stat_id: savedStat.id
          })));
        }
        if (previousProgressResult.data?.length) {
          await supabase.from('weekly_stat_study_progress').insert(previousProgressResult.data.map(item => ({
            ...item,
            weekly_stat_id: savedStat.id
          })));
        }
      }
      throw detailError;
    }

    return savedStat;
  }

  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  const newStat: WeeklyStat = { 
    ...payload, 
    id: stat.id || `ws_${crypto.randomUUID()}`,
    missing_reasons: missingReasons,
    study_progress: stat.study_progress || []
  } as WeeklyStat;
  const updated = [newStat, ...stats.filter(s => !(s.group_id === newStat.group_id && s.week_date === newStat.week_date))];
  setLocalData(STORAGE_KEYS.STATS, updated);
  return newStat;
}

export async function deleteWeeklyStat(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('weekly_stats').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const stats = getLocalData<WeeklyStat[]>(STORAGE_KEYS.STATS, INITIAL_STATS);
  setLocalData(STORAGE_KEYS.STATS, stats.filter(s => s.id !== id));
}

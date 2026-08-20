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

    if (!error && data) {
      return data.map((ws: Record<string, unknown> & { groups?: { group_name?: string }; weekly_stat_absences?: MissingReason[]; weekly_stat_study_progress?: StudyProgress[] }) => {
        const { weekly_stat_absences, weekly_stat_study_progress, ...rest } = ws;
        return {
          ...rest,
          group_name: ws.groups?.group_name || 'Group',
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
  const payload = {
    group_id: stat.group_id,
    week_date: stat.week_date,
    active_disciples_count: stat.active_disciples_count,
    missing_ibadah_count: stat.missing_ibadah_count,
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
  const newStat: WeeklyStat = { 
    ...payload, 
    id: stat.id || 'ws_' + Date.now(),
    missing_reasons: stat.missing_reasons || [],
    study_progress: stat.study_progress || []
  } as WeeklyStat;
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

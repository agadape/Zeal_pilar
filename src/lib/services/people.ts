import { Person, WeeklyStudyProgressLog, UpcomingMilestone } from '../types';
import { INITIAL_PEOPLE } from '../mockData';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

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
    nickname: person.nickname || null,
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

export async function deletePerson(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('group_members').delete().eq('person_id', id);
    await supabase.from('bible_study_logs').delete().eq('person_id', id);
    await supabase.from('weekly_stat_absences').delete().eq('person_id', id);
    await supabase.from('weekly_stat_study_progress').delete().eq('person_id', id);

    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) {
      console.error("Supabase error (deletePerson):", error);
      alert("Gagal menghapus data! Pastikan orang ini bukan ketua grup.");
      return false;
    }
    return true;
  }
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const updated = people.filter(p => p.id !== id);
  setLocalData(STORAGE_KEYS.PEOPLE, updated);
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
      await supabase.from('people').update({
        study_stage: `Minggu ${log.week_number}: ${log.lesson_topic}`
      }).eq('id', log.person_id);
      return data as WeeklyStudyProgressLog;
    }
  }

  const logs = getLocalData<WeeklyStudyProgressLog[]>(STORAGE_KEYS.BIBLE_STUDY_LOGS, []);
  const newLog: WeeklyStudyProgressLog = { ...payload, id: 'bs_' + Date.now() } as WeeklyStudyProgressLog;
  setLocalData(STORAGE_KEYS.BIBLE_STUDY_LOGS, [...logs, newLog]);

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const updatedPeople = people.map(p => p.id === log.person_id ? { ...p, study_stage: `Minggu ${log.week_number}: ${log.lesson_topic}` } : p);
  setLocalData(STORAGE_KEYS.PEOPLE, updatedPeople);

  return newLog;
}

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

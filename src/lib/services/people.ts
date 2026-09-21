import { Group, GroupMember, MentorshipRelationship, Person, WeeklyStudyProgressLog, UpcomingMilestone } from '../types';
import { INITIAL_PEOPLE } from '../mockData';
import { parseDateOnly, toLocalDateValue } from '../dateUtils';
import { supabase, isSupabaseConfigured, getLocalData, setLocalData, STORAGE_KEYS } from './core';

export async function fetchPeople(): Promise<Person[]> {
  if (isSupabaseConfigured && supabase) {
    const [peopleResult, logsResult] = await Promise.all([
      supabase.from('people').select('*').is('archived_at', null).order('full_name'),
      supabase.from('bible_study_logs').select('*').order('study_date').order('created_at')
    ]);

    if (peopleResult.error) throw peopleResult.error;
    if (logsResult.error) throw logsResult.error;

    const peopleData = (peopleResult.data || []) as Person[];
    const peopleNames = new Map(peopleData.map(person => [person.id, person.full_name]));
    const logsByPerson = new Map<string, WeeklyStudyProgressLog[]>();

    ((logsResult.data || []) as WeeklyStudyProgressLog[]).forEach(log => {
      if (!log.person_id) return;
      const personLogs = logsByPerson.get(log.person_id) || [];
      personLogs.push({
        ...log,
        mentor_name: log.mentor_id ? peopleNames.get(log.mentor_id) : undefined
      });
      logsByPerson.set(log.person_id, personLogs);
    });

    return peopleData.map(person => {
      const logs = logsByPerson.get(person.id) || [];
      const latestLog = logs[logs.length - 1];
      return {
        ...person,
        study_stage: latestLog ? `Minggu ${latestLog.week_number}: ${latestLog.lesson_topic}` : person.study_stage,
        study_history: logs
      };
    });
  }

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE).filter(person => !person.archived_at);
  const bsLogs = getLocalData<WeeklyStudyProgressLog[]>(STORAGE_KEYS.BIBLE_STUDY_LOGS, []);
  const peopleNames = new Map(people.map(person => [person.id, person.full_name]));

  return people.map(p => {
    const logs = bsLogs
      .filter(l => l.person_id === p.id)
      .sort((a, b) => a.study_date.localeCompare(b.study_date) || a.week_number - b.week_number)
      .map(log => ({
        ...log,
        mentor_name: log.mentor_id ? peopleNames.get(log.mentor_id) : undefined
      }));
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
  const normalizedName = person.full_name.trim();
  if (!normalizedName) throw new Error('Nama lengkap wajib diisi.');

  const payload = {
    full_name: normalizedName,
    nickname: person.nickname?.trim() || null,
    gender: person.gender,
    phone_number: person.phone_number?.trim() || null,
    campus: person.campus?.trim() || null,
    status: person.status,
    birth_date: person.birth_date || null,
    baptism_date: person.baptism_date || null,
    study_stage: person.study_stage?.trim() || null,
    notes: person.notes?.trim() || null,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    if (person.id) {
      const { data, error } = await supabase.from('people').update(payload).eq('id', person.id).select().single();
      if (error) throw error;
      return { ...data, study_history: person.study_history } as Person;
    } else {
      const { data, error } = await supabase.from('people').insert([payload]).select().single();
      if (error) throw error;
      return { ...data, study_history: person.study_history } as Person;
    }
  }

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  if (person.id) {
    const updated = people.map(p => p.id === person.id ? { ...p, ...person, ...payload } as Person : p);
    setLocalData(STORAGE_KEYS.PEOPLE, updated);
    return updated.find(p => p.id === person.id)!;
  } else {
    const newPerson: Person = { ...person, ...payload, id: `p_${crypto.randomUUID()}` } as Person;
    const updated = [newPerson, ...people];
    setLocalData(STORAGE_KEYS.PEOPLE, updated);
    return newPerson;
  }
}

export async function deletePerson(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('archive_person', { p_person_id: id });
    if (error?.code === 'PGRST202') {
      throw new Error('Fungsi arsip belum terpasang. Jalankan supabase_bugfixes.sql terlebih dahulu.');
    }
    if (error) throw error;
    return true;
  }
  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const groups = getLocalData<Group[]>(STORAGE_KEYS.GROUPS, []);
  if (groups.some(group => !group.archived_at && group.leader_id === id)) {
    throw new Error('Orang ini masih menjadi leader grup. Lakukan handover terlebih dahulu.');
  }
  const roots = getLocalData<{ brother_root_id?: string | null; sister_root_id?: string | null }>(STORAGE_KEYS.DTREE_SETTINGS, {});
  if (roots.brother_root_id === id || roots.sister_root_id === id) {
    throw new Error('Orang ini masih menjadi Pemimpin Jemaat di d-Tree. Ganti root terlebih dahulu.');
  }
  const archivedAt = new Date().toISOString();
  const updated = people.map(person => person.id === id
    ? { ...person, archived_at: archivedAt, updated_at: archivedAt }
    : person
  );
  setLocalData(STORAGE_KEYS.PEOPLE, updated);
  const memberships = getLocalData<GroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
  setLocalData(STORAGE_KEYS.GROUP_MEMBERS, memberships.filter(membership => membership.person_id !== id));
  const relationships = getLocalData<MentorshipRelationship[]>(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, []);
  const now = new Date().toISOString();
  setLocalData(STORAGE_KEYS.MENTORSHIP_RELATIONSHIPS, relationships.map(relationship => (
    !relationship.ended_at && (relationship.mentor_id === id || relationship.mentee_id === id)
      ? { ...relationship, ended_at: now.slice(0, 10), end_reason: 'Data jemaat diarsipkan', updated_at: now }
      : relationship
  )));
  return true;
}

export async function saveBibleStudyLog(log: Omit<WeeklyStudyProgressLog, 'id'> & { person_id: string }): Promise<WeeklyStudyProgressLog> {
  if (!Number.isInteger(log.week_number) || log.week_number < 1) {
    throw new Error('Nomor sesi Belajar Alkitab minimal 1.');
  }
  if (!log.study_date || !log.lesson_topic.trim()) {
    throw new Error('Tanggal dan topik Belajar Alkitab wajib diisi.');
  }

  const payload = {
    person_id: log.person_id,
    mentor_id: log.mentor_id || null,
    week_number: log.week_number,
    study_date: log.study_date,
    lesson_topic: log.lesson_topic.trim(),
    notes: log.notes || null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('bible_study_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as WeeklyStudyProgressLog;
  }

  const logs = getLocalData<WeeklyStudyProgressLog[]>(STORAGE_KEYS.BIBLE_STUDY_LOGS, []);
  const newLog: WeeklyStudyProgressLog = { ...payload, id: `bs_${crypto.randomUUID()}` } as WeeklyStudyProgressLog;
  setLocalData(STORAGE_KEYS.BIBLE_STUDY_LOGS, [...logs, newLog]);

  const people = getLocalData<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  const updatedPeople = people.map(p => p.id === log.person_id ? { ...p, study_stage: `Minggu ${log.week_number}: ${log.lesson_topic}` } : p);
  setLocalData(STORAGE_KEYS.PEOPLE, updatedPeople);

  return newLog;
}

export async function fetchUpcomingMilestones(): Promise<UpcomingMilestone[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('upcoming_milestones').select('*');
    if (error) throw error;
    if (data) {
      return (data as UpcomingMilestone[])
        .map(m => {
          const nextDate = parseDateOnly(m.next_occurrence);
          const today = new Date();
          today.setHours(0,0,0,0);

          if (nextDate < today) {
            nextDate.setFullYear(today.getFullYear() + 1);
          }

          const days = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          return {
            ...m,
            next_occurrence: toLocalDateValue(nextDate),
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

  people.filter(person => !person.archived_at).forEach(p => {
    if (p.birth_date) {
      const bdate = parseDateOnly(p.birth_date);
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
          next_occurrence: toLocalDateValue(nextBday),
          days_until: days
        });
      }
    }

    if (p.baptism_date) {
      const bapDate = parseDateOnly(p.baptism_date);
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
          next_occurrence: toLocalDateValue(nextBap),
          days_until: days
        });
      }
    }
  });

  return results.sort((a, b) => a.days_until - b.days_until);
}

import { Person, Group, WeeklyStat, MinistryEvent, Announcement } from './types';

export const INITIAL_PEOPLE: Person[] = [
  { id: 'p1', full_name: 'Om Hendra (Babeh)', gender: 'BROTHER', campus: 'Staff Pastor', status: 'LEADER', notes: 'Senior Leader / Pastor ZEAL Jogja' },
  { id: 'p2', full_name: 'Bang panca Satriadi', gender: 'BROTHER', campus: 'BPC Staff', status: 'LEADER', notes: 'Senior Ministry Leader BPC' },
  { id: 'p3', full_name: 'Kak Lusi', gender: 'SISTER', campus: 'BPC Staff', status: 'LEADER', notes: 'Senior Ministry Leader BPC' },
  { id: 'p4', full_name: 'Bang Daniel', gender: 'BROTHER', campus: 'Campus Coordinator', status: 'LEADER', notes: 'Campus Ministry Coordinator' },
  { id: 'p5', full_name: 'Kak Afuk', gender: 'BROTHER', campus: 'STIPRAM', status: 'LEADER', notes: 'Praise & Worship & Tech Coordinator' },
  { id: 'p6', full_name: 'Ka Nike', gender: 'SISTER', campus: 'General', status: 'LEADER', notes: 'Small Group Leader One Way' },
  { id: 'p7', full_name: 'Kak Cia', gender: 'SISTER', campus: 'Atma Jaya', status: 'LEADER', notes: 'Small Group Leader & PMK Outreach' },
  { id: 'p8', full_name: 'Kak Enrika', gender: 'SISTER', campus: 'UGM', status: 'LEADER', notes: 'Small Group Leader Eve\'s Circle' },
  { id: 'p9', full_name: 'Ikan', gender: 'BROTHER', campus: 'UNY', status: 'LEADER', notes: 'Small Group Leader Ayam Bumbu Hitam' },
  { id: 'p10', full_name: 'Aikoh', gender: 'SISTER', campus: 'Atma Jaya', status: 'LEADER', notes: 'PMK Outreach Coordinator' },
  { id: 'p11', full_name: 'Jouban', gender: 'BROTHER', campus: 'UGM', status: 'LEADER', notes: 'Doa Bersama Tech Operator' },
  { id: 'p12', full_name: 'Chessy Zeal', gender: 'SISTER', campus: 'General', status: 'LEADER', notes: 'Small Group Leader One Way' },
  { id: 'p13', full_name: 'Bang Beni', gender: 'BROTHER', campus: 'General', status: 'LEADER', notes: 'P&W Night MC & Leader' },
  { id: 'p14', full_name: 'Kak Fitri', gender: 'SISTER', campus: 'General', status: 'LEADER', notes: 'Small Group Leader Grace Bloom' },
  { id: 'p15', full_name: 'Bang Yosua', gender: 'BROTHER', campus: 'General', status: 'LEADER', notes: 'Brother Small Group Leader' },
  { id: 'p16', full_name: 'Axel', gender: 'BROTHER', campus: 'UGM', status: 'BIBLE_STUDY', study_stage: 'Murid', notes: 'Kelompok Pelita' },
  { id: 'p17', full_name: 'Geri', gender: 'BROTHER', campus: 'UNY', status: 'BIBLE_STUDY', study_stage: 'Murid', notes: 'Kelompok Pelita' },
  { id: 'p18', full_name: 'Sherly', gender: 'SISTER', campus: 'Atma Jaya', status: 'BIBLE_STUDY', study_stage: 'Tujuan Hidup', notes: 'Kelompok LOL' },
  { id: 'p19', full_name: 'Fina', gender: 'SISTER', campus: 'General', status: 'WEAK', notes: 'Butuh follow up personal' },
  { id: 'p20', full_name: 'Tia', gender: 'SISTER', campus: 'Atma Jaya', status: 'VISITOR', notes: 'Visitor Ibadah' }
];

export const INITIAL_GROUPS: Group[] = [
  { id: 'g1', group_name: "Eve's Circle", category: 'SISTER', leader_id: 'p8', leader_name: 'Kak Enrika' },
  { id: 'g2', group_name: 'Grace Bloom', category: 'SISTER', leader_id: 'p14', leader_name: 'Kak Fitri' },
  { id: 'g3', group_name: 'One Way', category: 'SISTER', leader_id: 'p6', leader_name: 'Ka Nike' },
  { id: 'g4', group_name: 'LOL', category: 'SISTER', leader_id: 'p7', leader_name: 'Kak Cia' },
  { id: 'g5', group_name: 'GOF', category: 'SISTER', leader_id: 'p10', leader_name: 'Aikoh' },
  { id: 'g6', group_name: 'Pelita', category: 'BROTHER', leader_id: 'p5', leader_name: 'Kak Afuk' },
  { id: 'g7', group_name: 'Hosea', category: 'BROTHER', leader_id: 'p15', leader_name: 'Bang Yosua' },
  { id: 'g8', group_name: 'Ayam Bumbu Hitam', category: 'BROTHER', leader_id: 'p9', leader_name: 'Ikan' }
];

export const INITIAL_GROUP_MEMBERS: { id: string; group_id: string; person_id: string }[] = [
  { id: 'gm1', group_id: 'g1', person_id: 'p8' },
  { id: 'gm2', group_id: 'g1', person_id: 'p19' },
  { id: 'gm3', group_id: 'g2', person_id: 'p14' },
  { id: 'gm4', group_id: 'g3', person_id: 'p6' },
  { id: 'gm5', group_id: 'g3', person_id: 'p12' },
  { id: 'gm6', group_id: 'g4', person_id: 'p7' },
  { id: 'gm7', group_id: 'g4', person_id: 'p18' },
  { id: 'gm8', group_id: 'g4', person_id: 'p20' },
  { id: 'gm9', group_id: 'g6', person_id: 'p5' },
  { id: 'gm10', group_id: 'g6', person_id: 'p16' },
  { id: 'gm11', group_id: 'g6', person_id: 'p17' },
  { id: 'gm12', group_id: 'g8', person_id: 'p9' },
  { id: 'gm13', group_id: 'g8', person_id: 'p11' }
];

export const INITIAL_STATS: WeeklyStat[] = [
  {
    id: 'ws1',
    group_id: 'g1',
    group_name: "Eve's Circle",
    week_date: '2026-08-02',
    active_disciples_count: 5,
    missing_ibadah_count: 1,
    missing_reasons: [{ person_name: 'Fina', reason: 'Weak / Sakit' }],
    study_progress: [{ person_name: 'Laura', stage: 'Kasih' }],
    reachout_count: 3,
    sunday_visitors_count: 2,
    event_visitors_count: 1,
    baptisms_count: 0,
    notes: 'Perlu penguatan untuk Fina.'
  },
  {
    id: 'ws2',
    group_id: 'g6',
    group_name: 'Pelita',
    week_date: '2026-08-02',
    active_disciples_count: 7,
    missing_ibadah_count: 0,
    missing_reasons: [],
    study_progress: [
      { person_name: 'Axel', stage: 'Murid' },
      { person_name: 'Geri', stage: 'Murid' }
    ],
    reachout_count: 4,
    sunday_visitors_count: 1,
    event_visitors_count: 2,
    baptisms_count: 1,
    notes: 'Puji Tuhan Axel & Geri rajin BA!'
  }
];

export const INITIAL_EVENTS: MinistryEvent[] = [
  {
    id: 'ev1',
    title: 'PDA Kampusan Kamis',
    type: 'PDA_COMBINED',
    event_date: '2026-08-13T19:00:00.000Z',
    location: 'Student Center Hall',
    description: 'PDA Gabungan Brother & Sister Tugu Leaders',
    roster: [
      { id: 'r1', event_id: 'ev1', person_id: 'p1', person_name: 'Om Hendra (Babeh)', role: 'SPEAKER' },
      { id: 'r2', event_id: 'ev1', person_id: 'p13', person_name: 'Bang Beni', role: 'MC' },
      { id: 'r3', event_id: 'ev1', person_id: 'p5', person_name: 'Kak Afuk', role: 'OPERATOR' },
      { id: 'r4', event_id: 'ev1', person_id: 'p6', person_name: 'Ka Nike', role: 'WORSHIP' }
    ]
  },
  {
    id: 'ev2',
    title: 'Doa Bersama Youth',
    type: 'DOA_YOUTH',
    event_date: '2026-08-20T19:30:00.000Z',
    location: 'Zoom / Offline Meeting Room',
    description: 'Doa Bersama Pemuda & Mahasiswa Tugu',
    roster: [
      { id: 'r5', event_id: 'ev2', person_id: 'p11', person_name: 'Jouban', role: 'OPERATOR' },
      { id: 'r6', event_id: 'ev2', person_id: 'p14', person_name: 'Kak Fitri', role: 'PRAYER' }
    ]
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'an1',
    title: 'Welcome to Tugu Jogja Ministry Portal!',
    author_name: 'Bang Daniel',
    content: 'Halo kawan-kawan Tugu Leaders! Group Pilar official telah bertransisi menjadi Tugu. Mari gunakan website ini untuk input Statistika Minggu, koordinasi PDA, dan follow-up murid.',
    is_pinned: true,
    created_at: '2026-08-06T15:00:00.000Z'
  },
  {
    id: 'an2',
    title: 'Visi Rumah Tuhan & Quiet Time',
    author_name: 'Om Hendra (Babeh)',
    content: 'Ingat selalu untuk membangun Rumah Tuhan dengan gairah dan kasih. Utamakan Saat Teduh harian dan perpuluhan tepat waktu.',
    is_pinned: true,
    created_at: '2026-08-07T08:00:00.000Z'
  }
];

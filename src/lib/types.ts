export type Gender = 'BROTHER' | 'SISTER';

export type PersonStatus = 
  | 'LEADER' 
  | 'DISCIPLE' 
  | 'BIBLE_STUDY' 
  | 'VISITOR' 
  | 'WEAK' 
  | 'INACTIVE';

export type EventType = 
  | 'PDA_BRO' 
  | 'PDA_SIS' 
  | 'PDA_COMBINED' 
  | 'DOA_YOUTH' 
  | 'PW_NIGHT' 
  | 'RETREAT' 
  | 'PMK_OUTREACH';

export interface Person {
  id: string;
  full_name: string;
  gender: Gender;
  phone_number?: string;
  campus?: string; // ATMA, UGM, UNY, STIPRAM, OTHER
  status: PersonStatus;
  study_stage?: string; // Murid, Tujuan Hidup, Kasih, Baptis, etc.
  notes?: string;
  created_at?: string;
}

export interface Group {
  id: string;
  group_name: string;
  category: Gender;
  leader_id?: string;
  leader_name?: string; // Joined from People
  members_count?: number;
  created_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  person_id: string;
  person?: Person;
  created_at?: string;
}

export interface MissingReason {
  person_id?: string;
  person_name: string;
  reason: string;
}

export interface StudyProgress {
  person_id?: string;
  person_name: string;
  stage: string;
}

export interface WeeklyStat {
  id: string;
  group_id: string;
  group_name?: string;
  week_date: string;
  active_disciples_count: number;
  missing_ibadah_count: number;
  missing_reasons: MissingReason[];
  study_progress: StudyProgress[];
  reachout_count: number;
  sunday_visitors_count: number;
  event_visitors_count: number;
  baptisms_count: number;
  notes?: string;
  created_at?: string;
}

export interface EventRoster {
  id: string;
  event_id: string;
  person_id: string;
  person_name?: string;
  role: 'SPEAKER' | 'MC' | 'OPERATOR' | 'WORSHIP' | 'PRAYER';
}

export interface MinistryEvent {
  id: string;
  title: string;
  type: EventType;
  event_date: string;
  location?: string;
  description?: string;
  roster?: EventRoster[];
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  author_name: string;
  content: string;
  is_pinned: boolean;
  created_at?: string;
}

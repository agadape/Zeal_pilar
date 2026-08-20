import { useState, useMemo } from 'react';
import { Person, PersonStatus, Gender, WeeklyStudyProgressLog, } from '@/lib/types';
import { exportPeopleToCSV } from '@/lib/exportUtils';
import {
  IconUserPlus, 
  IconSearch, 
  IconDownload,
  IconUsers,
} from '@tabler/icons-react';
import FormPanel from './FormPanel';
import PersonDetailPanel from './PersonDetailPanel';

interface PeopleViewProps {
  people: Person[];
  currentUser?: Person | null;
  onSavePerson: (person: Omit<Person, 'id'> & { id?: string; study_history?: WeeklyStudyProgressLog[] }) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onSaveBALog?: (log: { person_id: string; week_number: number; study_date: string; lesson_topic: string; notes?: string }) => Promise<void>;
}

const DEFAULT_CAMPUSES = ['UGM', 'UNY', 'Atma Jaya', 'STIPRAM', 'UPN', 'AMPTA', 'ISI', 'UMY', 'UAJY', 'Sanata Dharma', 'Bukan Mahasiswa'];

function getCampusList(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CAMPUSES;
  try {
    const stored = localStorage.getItem('tugu_campus_list');
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return Array.from(new Set([...DEFAULT_CAMPUSES, ...parsed]));
    }
  } catch { /* ignore */ }
  return DEFAULT_CAMPUSES;
}

function saveCampusToList(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('tugu_campus_list');
    const existing: string[] = stored ? JSON.parse(stored) : [];
    if (!existing.includes(name) && !DEFAULT_CAMPUSES.includes(name)) {
      localStorage.setItem('tugu_campus_list', JSON.stringify([...existing, name]));
    }
  } catch { /* ignore */ }
}

export default function PeopleView({ people, currentUser, onSavePerson, onDeletePerson, onSaveBALog }: PeopleViewProps) {

  const [search, setSearch] = useState('');
  const [campusList, setCampusList] = useState<string[]>(getCampusList);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [trackingBAPerson, setTrackingBAPerson] = useState<Person | null>(null);
  const [submittingPerson, setSubmittingPerson] = useState(false);
  const [submittingBA, setSubmittingBA] = useState(false);

  // Form State for Adding/Editing
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('BROTHER');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState('');
  const [status, setStatus] = useState<PersonStatus>('DISCIPLE');
  const [birthDate, setBirthDate] = useState('');
  const [baptismDate, setBaptismDate] = useState('');
  const [studyStage, setStudyStage] = useState('');
  const [notes, setNotes] = useState('');

  const [addingCampus, setAddingCampus] = useState(false);
  const [newCampusInput, setNewCampusInput] = useState('');

  // BA Form State
  const [newLogWeekNum, setNewLogWeekNum] = useState<number>(1);
  const [newLogTopic, setNewLogTopic] = useState<string>('Pelajaran 1: Cinta Alkitab');
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogNotes, setNewLogNotes] = useState<string>('');

  // Helpers
  const openAddModal = () => {
    setEditingPerson(null);
    setFullName('');
    setNickname('');
    setGender('BROTHER');
    setPhone('');
    setCampus('');
    setStatus('DISCIPLE');
    setBirthDate('');
    setBaptismDate('');
    setStudyStage('');
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (p: Person) => {
    setIsDetailOpen(false); // Close detail if open
    setEditingPerson(p);
    setFullName(p.full_name);
    setNickname(p.nickname || '');
    setGender(p.gender);
    setPhone(p.phone_number || '');
    setCampus(p.campus || '');
    setStatus(p.status);
    setBirthDate(p.birth_date || '');
    setBaptismDate(p.baptism_date || '');
    setStudyStage(p.study_stage || '');
    setNotes(p.notes || '');
    setIsFormOpen(true);
  };

  const openDetail = (p: Person) => {
    setSelectedPerson(p);
    setIsDetailOpen(true);
  };

  const openBATracker = (p: Person) => {
    setIsDetailOpen(false);
    setTrackingBAPerson(p);
    const existingLogs = p.study_history || [];
    setNewLogWeekNum(existingLogs.length + 1);
    const LESSON_PRESETS = [
      'Pelajaran 1: Cinta Alkitab',
      'Pelajaran 2: Perilaku & Dosa',
      'Pelajaran 3: Salib & Kasih Kristus',
      'Pelajaran 4: Pertobatan',
      'Pelajaran 5: Baptis & Gereja',
      'Pelajaran 6: Pemuridan & Hidup Baru'
    ];
    setNewLogTopic(LESSON_PRESETS[Math.min(existingLogs.length, LESSON_PRESETS.length - 1)]);
    setNewLogDate(new Date().toISOString().split('T')[0]);
    setNewLogNotes('');
  };

  const handleSavePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmittingPerson(true);
    try {
      await onSavePerson({
        id: editingPerson?.id,
        full_name: fullName.trim(),
        nickname: nickname.trim() || undefined,
        gender,
        phone_number: phone.trim() || undefined,
        campus: campus.trim() || undefined,
        status,
        birth_date: birthDate || undefined,
        baptism_date: baptismDate || undefined,
        study_stage: status === 'BIBLE_STUDY' ? (studyStage.trim() || 'Pelajaran 1: Cinta Alkitab') : undefined,
        study_history: editingPerson?.study_history || [],
        notes: notes.trim() || undefined
      });
      setIsFormOpen(false);
    } finally {
      setSubmittingPerson(false);
    }
  };

  const handleAddBALog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingBAPerson || !newLogTopic.trim()) return;
    
    setSubmittingBA(true);
    try {
      if (onSaveBALog) {
        await onSaveBALog({
          person_id: trackingBAPerson.id,
          week_number: newLogWeekNum,
          study_date: newLogDate,
          lesson_topic: newLogTopic.trim(),
          notes: newLogNotes.trim() || undefined
        });
      }
      setTrackingBAPerson(null);
    } finally {
      setSubmittingBA(false);
    }
  };

  // Filter Logic
  const groupedPeople = useMemo(() => {
    let list = people;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.full_name.toLowerCase().includes(q) || 
             (p.campus && p.campus.toLowerCase().includes(q)) ||
             (p.notes && p.notes.toLowerCase().includes(q)));
    }
    
    return {
      disciples: list.filter(p => ['DISCIPLE', 'LEADER', 'WEAK'].includes(p.status)),
      studyans: list.filter(p => p.status === 'BIBLE_STUDY'),
      visitors: list.filter(p => p.status === 'VISITOR'),
      inactives: list.filter(p => p.status === 'INACTIVE')
    };
  }, [people, search]);

  const renderPersonCard = (p: Person) => (
    <div 
      key={p.id} 
      onClick={() => openDetail(p)}
      className="group flex flex-col p-5 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 cursor-pointer transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md ${p.gender === 'BROTHER' ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white' : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'}`}>
          <span className="font-bold text-lg">{p.full_name.charAt(0).toUpperCase()}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${getStatusBadgeClass(p.status)}`}>
          {p.status === 'BIBLE_STUDY' ? 'STUDYAN' : p.status}
        </span>
      </div>
      
      <div className="flex flex-col min-w-0 mt-2">
        <h3 className="font-extrabold text-base text-slate-900 truncate" title={p.full_name}>
          {p.nickname ? `${p.nickname}` : p.full_name}
          {p.nickname && <span className="ml-1.5 text-xs text-slate-400 font-bold">({p.full_name.split(' ')[0]})</span>}
        </h3>
        {p.campus && (
          <span className="text-xs font-medium text-slate-500 truncate mt-1 flex items-center gap-1">
            🎓 {p.campus}
          </span>
        )}
        {p.study_stage && (
          <span className="text-[10px] text-amber-700 font-bold truncate mt-3 bg-amber-100/50 px-2.5 py-1 rounded-lg w-fit inline-block">
            📖 {p.study_stage}
          </span>
        )}
      </div>
    </div>
  );

  const getStatusBadgeClass = (st: PersonStatus) => {
    switch (st) {
      case 'LEADER': return 'text-purple-700 bg-purple-100 border border-purple-200';
      case 'DISCIPLE': return 'text-emerald-700 bg-emerald-100 border border-emerald-200';
      case 'BIBLE_STUDY': return 'text-amber-700 bg-amber-100 border border-amber-200';
      case 'VISITOR': return 'text-cyan-700 bg-cyan-100 border border-cyan-200';
      case 'WEAK': return 'text-rose-700 bg-rose-100 border border-rose-200';
      case 'INACTIVE': return 'text-slate-500 bg-slate-100 border border-slate-200';
      default: return 'text-slate-700 bg-slate-100 border border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      
      {/* HEADER - Playful & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Data Disciple 👥
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Direktori lengkap disciple, pengunjung, dan partisipan belajar Alkitab.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => exportPeopleToCSV(people)}
            className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <IconDownload className="w-5 h-5 text-slate-500" stroke={2} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center space-x-2 transition-transform hover:-translate-y-0.5"
          >
            <IconUserPlus className="w-5 h-5" stroke={2} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* SEARCH - Floating Pill */}
      <div className="relative w-full max-w-2xl mx-auto group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <IconSearch className="w-6 h-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" stroke={2.5} />
        </div>
        <input
          type="text"
          placeholder="Cari nama, status, kampus..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-full pl-14 pr-6 py-4 text-base text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder-slate-400 shadow-xl shadow-slate-200/30"
        />
      </div>

      {/* DIRECTORY LIST */}
      <div className="space-y-12 pt-4">
        {(groupedPeople.disciples.length === 0 && groupedPeople.studyans.length === 0 && groupedPeople.visitors.length === 0 && groupedPeople.inactives.length === 0) ? (
          <div className="py-24 text-center bg-white/50 rounded-[2rem] border-2 border-slate-200 border-dashed backdrop-blur-sm">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
              <IconUsers className="w-10 h-10 text-slate-300" stroke={1.5} />
            </div>
            <p className="text-slate-800 font-extrabold text-lg">Waduh, nggak ketemu nih! 🙈</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <>
            {groupedPeople.disciples.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
                    <span>Sudah Disciple</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-black shadow-sm">{groupedPeople.disciples.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {groupedPeople.disciples.map(renderPersonCard)}
                </div>
              </div>
            )}
            
            {groupedPeople.studyans.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
                    <span>Lagi Belajar Alkitab</span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-black shadow-sm">{groupedPeople.studyans.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {groupedPeople.studyans.map(renderPersonCard)}
                </div>
              </div>
            )}

            {groupedPeople.visitors.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
                    <span>Visitor & Reachout</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-black shadow-sm">{groupedPeople.visitors.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {groupedPeople.visitors.map(renderPersonCard)}
                </div>
              </div>
            )}

            {groupedPeople.inactives.length > 0 && (
              <div className="space-y-6 opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-slate-500 tracking-tight flex items-center space-x-3">
                    <span>Inactive / Keluar</span>
                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-black">{groupedPeople.inactives.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {groupedPeople.inactives.map(renderPersonCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}

      <PersonDetailPanel 
        person={selectedPerson} 
        group={undefined}
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        onEdit={openEditModal}
        onTrackBA={openBATracker}
      />

      <FormPanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPerson ? 'Edit Data Disciple' : 'Tambah Disciple Baru'}
        onSubmit={handleSavePersonSubmit}
        submitLabel="Simpan Data"
        isSubmitDisabled={submittingPerson}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Pribadi</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Alexander Budi"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Panggilan</label>
                <input
                  type="text"
                  placeholder="Contoh: Alex"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gender *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="BROTHER">BROTHER 👦🏻</option>
                  <option value="SISTER">SISTER 👧🏻</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nomor HP</label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kampus / Univ</label>
              {!addingCampus ? (
                <div className="flex gap-2">
                  <select
                    value={campus}
                    onChange={e => setCampus(e.target.value)}
                    className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                  >
                    <option value="">-- Kosong / Bukan Mhs --</option>
                    {campusList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setAddingCampus(true); setNewCampusInput(''); }}
                    title="Tambah kampus baru"
                    className="shrink-0 px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors"
                  >
                    + Baru
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nama institusi..."
                    value={newCampusInput}
                    onChange={e => setNewCampusInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newCampusInput.trim();
                        if (trimmed) {
                          saveCampusToList(trimmed);
                          setCampusList(getCampusList());
                          setCampus(trimmed);
                        }
                        setAddingCampus(false);
                      }
                      if (e.key === 'Escape') setAddingCampus(false);
                    }}
                    className="flex-1 bg-white border-2 border-indigo-300 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCampusInput.trim();
                      if (trimmed) {
                        saveCampusToList(trimmed);
                        setCampusList(getCampusList());
                        setCampus(trimmed);
                      }
                      setAddingCampus(false);
                    }}
                    className="shrink-0 px-5 py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Keanggotaan</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status Pelayanan *</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PersonStatus)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <optgroup label="Sudah Disciple">
                    <option value="DISCIPLE">Disciple (Aktif / Biasa)</option>
                    <option value="LEADER">Leader</option>
                    <option value="WEAK">Weak (Butuh Care)</option>
                  </optgroup>
                  <optgroup label="Belum Disciple">
                    <option value="VISITOR">Visitor / Tamu</option>
                    <option value="BIBLE_STUDY">Studyan (Progress BA)</option>
                  </optgroup>
                  <optgroup label="Lainnya">
                    <option value="INACTIVE">Inactive / Keluar</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className={`grid gap-4 ${status === 'DISCIPLE' || status === 'LEADER' || status === 'WEAK' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tgl Lahir Jasmani</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              {(status === 'DISCIPLE' || status === 'LEADER' || status === 'WEAK') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tgl Baptis</label>
                  <input
                    type="date"
                    value={baptismDate}
                    onChange={e => setBaptismDate(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Info penting, progres khusus, dll..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
            
             {editingPerson && currentUser?.role === 'SUPER_ADMIN' && (
               <div className="pt-6 border-t border-slate-200 mt-4">
                 <button
                   type="button"
                   onClick={() => {
                     if (confirm('Yakin ingin menghapus data disciple ini secara permanen?')) {
                       onDeletePerson(editingPerson.id);
                       setIsFormOpen(false);
                     }
                   }}
                   className="text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 px-4 py-3.5 rounded-2xl w-full transition-colors shadow-lg shadow-rose-500/30"
                 >
                   Hapus Data Disciple
                 </button>
               </div>
             )}
           </div>
        </div>
      </FormPanel>

      <FormPanel
        isOpen={!!trackingBAPerson}
        onClose={() => setTrackingBAPerson(null)}
        title="Catat Progress BA"
        onSubmit={handleAddBALog}
        submitLabel="Simpan Log"
        isSubmitDisabled={submittingBA}
      >
        <div className="space-y-6">
          <div className="bg-amber-100/50 border-2 border-amber-200 p-4 rounded-2xl">
            <p className="text-sm text-amber-800">
              Mencatat progress untuk: <strong className="font-black text-amber-900">{trackingBAPerson?.full_name}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sesi Ke-</label>
              <input
                type="number"
                min="1"
                required
                value={newLogWeekNum}
                onChange={e => setNewLogWeekNum(parseInt(e.target.value) || 1)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal</label>
              <input
                type="date"
                required
                value={newLogDate}
                onChange={e => setNewLogDate(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Topik Pelajaran *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pelajaran 1: Cinta Alkitab"
              value={newLogTopic}
              onChange={e => setNewLogTopic(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan & Kesan</label>
            <textarea
              rows={3}
              placeholder="Bagaimana responsnya? Apa kendalanya?"
              value={newLogNotes}
              onChange={e => setNewLogNotes(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}

import { useState, useMemo } from 'react';
import { Person, PersonStatus, Gender, WeeklyStudyProgressLog, } from '@/lib/types';
import { exportPeopleToCSV } from '@/lib/exportUtils';
import {
  IconUserPlus, 
  IconSearch, 
  IconDownload,
  IconUsers,
  IconChevronRight
} from '@tabler/icons-react';
import FormPanel from './FormPanel';
import PersonDetailPanel from './PersonDetailPanel';

interface PeopleViewProps {
  people: Person[];
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

export default function PeopleView({ people, onSavePerson, onDeletePerson, onSaveBALog }: PeopleViewProps) {

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

  const renderPersonRow = (p: Person) => (
    <div 
      key={p.id} 
      onClick={() => openDetail(p)}
      className="group flex items-center justify-between p-3.5 sm:p-4 bg-white/70 hover:bg-white backdrop-blur-xl border border-slate-200/60 hover:border-[#b5852e]/40 rounded-2xl mb-2.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(181,133,46,0.15)] cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-0.5"
    >
      <div className="flex items-center space-x-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${p.gender === 'BROTHER' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-rose-400 to-orange-400 text-white'}`}>
          <span className="font-bold text-base font-serif drop-shadow-sm">{p.full_name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex flex-col justify-center space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 truncate tracking-tight">{p.full_name}</h3>
            {p.campus && (
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 uppercase truncate max-w-[120px] tracking-wider">
                {p.campus}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadgeClass(p.status)}`}>
              {p.status === 'BIBLE_STUDY' ? 'STUDYAN' : p.status}
            </span>
            {p.study_stage && (
              <span className="text-[10px] text-slate-500 font-semibold truncate tracking-tight">
                • {p.study_stage}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center shrink-0 pl-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#b5852e]/10 border border-transparent group-hover:border-[#b5852e]/20 flex items-center justify-center transition-colors">
          <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#b5852e] group-hover:translate-x-0.5 transition-all" stroke={2.5} />
        </div>
      </div>
    </div>
  );

  const getStatusBadgeClass = (st: PersonStatus) => {
    switch (st) {
      case 'LEADER': return 'bg-purple-50 text-purple-700 border-purple-200/50 shadow-sm';
      case 'DISCIPLE': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm';
      case 'BIBLE_STUDY': return 'bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm';
      case 'VISITOR': return 'bg-cyan-50 text-cyan-700 border-cyan-200/50 shadow-sm';
      case 'WEAK': return 'bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm';
      case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200/50 shadow-sm';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/50 shadow-sm';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Data Disciple
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Direktori disciple, pengunjung, dan partisipan kelas Alkitab.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => exportPeopleToCSV(people)}
            className="btn-tactile px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <IconDownload className="w-4 h-4 text-slate-500" stroke={2} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="btn-tactile btn-primary py-2.5 px-4 text-sm font-bold shadow-sm"
          >
            <IconUserPlus className="w-4 h-4" stroke={2} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS - Redesigned as a prominent bar */}
      <div className="relative w-full shadow-sm rounded-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <IconSearch className="w-5 h-5 text-slate-400" stroke={2.5} />
        </div>
        <input
          type="text"
          placeholder="Cari nama, status, kampus, atau catatan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-[#b5852e] focus:ring-4 focus:ring-[#b5852e]/10 transition-all font-medium placeholder-slate-400"
        />
      </div>

      {/* DIRECTORY LIST */}
      <div className="space-y-10 pt-4">
        {(groupedPeople.disciples.length === 0 && groupedPeople.studyans.length === 0 && groupedPeople.visitors.length === 0 && groupedPeople.inactives.length === 0) ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <IconUsers className="w-8 h-8 text-slate-300" stroke={1.5} />
            </div>
            <p className="text-slate-500 font-bold text-sm">Tidak ada data yang ditemukan.</p>
            <p className="text-slate-400 text-xs mt-1">Coba gunakan kata kunci lain.</p>
          </div>
        ) : (
          <>
            {groupedPeople.disciples.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>Sudah Disciple</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">{groupedPeople.disciples.length}</span>
                  </h2>
                </div>
                <div className="flex flex-col">
                  {groupedPeople.disciples.map(renderPersonRow)}
                </div>
              </div>
            )}
            
            {groupedPeople.studyans.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>Studyan / Progress BA</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">{groupedPeople.studyans.length}</span>
                  </h2>
                </div>
                <div className="flex flex-col">
                  {groupedPeople.studyans.map(renderPersonRow)}
                </div>
              </div>
            )}

            {groupedPeople.visitors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>Visitor / Tamu</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-black">{groupedPeople.visitors.length}</span>
                  </h2>
                </div>
                <div className="flex flex-col">
                  {groupedPeople.visitors.map(renderPersonRow)}
                </div>
              </div>
            )}

            {groupedPeople.inactives.length > 0 && (
              <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black text-slate-500 tracking-tight flex items-center space-x-2">
                    <span>Lainnya / Inactive</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-black">{groupedPeople.inactives.length}</span>
                  </h2>
                </div>
                <div className="flex flex-col">
                  {groupedPeople.inactives.map(renderPersonRow)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}

      {/* Person Detail Panel */}
      <PersonDetailPanel 
        person={selectedPerson} 
        group={undefined}
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        onEdit={openEditModal}
        onTrackBA={openBATracker}
      />

      {/* Form Panel (Create / Edit) */}
      <FormPanel
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPerson ? 'Edit Data Disciple' : 'Tambah Disciple Baru'}
        onSubmit={handleSavePersonSubmit}
        submitLabel="Simpan Data"
        isSubmitDisabled={submittingPerson}
      >
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Pribadi</h3>
          
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Axel / Sherly"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Gender *</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
              >
                <option value="BROTHER">BROTHER</option>
                <option value="SISTER">SISTER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nomor HP</label>
              <input
                type="text"
                placeholder="0812..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Kampus / Univ</label>
            {!addingCampus ? (
              <div className="flex gap-2">
                <select
                  value={campus}
                  onChange={e => setCampus(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
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
                  className="shrink-0 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
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
                  className="flex-1 bg-white border border-[#b5852e] rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
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
                  className="shrink-0 px-3 py-2.5 rounded-xl bg-[#b5852e] text-white text-xs font-bold transition-colors"
                >
                  Set
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Keanggotaan</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Status Pelayanan *</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PersonStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
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
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase mb-1">Tgl Lahir Jasmani</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
            {(status === 'DISCIPLE' || status === 'LEADER' || status === 'WEAK') && (
              <div>
                <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase mb-1">Tgl Baptis</label>
                <input
                  type="date"
                  value={baptismDate}
                  onChange={e => setBaptismDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Info penting, progres khusus, dll..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 resize-none focus:outline-none"
            />
          </div>
          
          {editingPerson && (
             <div className="pt-2">
               <button
                 type="button"
                 onClick={() => {
                   if (confirm("Data akan dihapus permanen. Apakah Anda yakin?")) {
                     onDeletePerson(editingPerson.id);
                     setIsFormOpen(false);
                   }
                 }}
                 className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-lg w-full transition-colors border border-rose-100"
               >
                 Hapus Data Disciple
               </button>
             </div>
          )}
        </div>
      </FormPanel>

      {/* Tracker BA Modal */}
      <FormPanel
        isOpen={!!trackingBAPerson}
        onClose={() => setTrackingBAPerson(null)}
        title="Catat Progress Belajar Alkitab"
        onSubmit={handleAddBALog}
        submitLabel="Simpan Log"
        isSubmitDisabled={submittingBA}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4">
            <p className="text-xs text-amber-800">
              Mencatat progress untuk: <strong className="font-bold">{trackingBAPerson?.full_name}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Sesi Ke-</label>
              <input
                type="number"
                min="1"
                required
                value={newLogWeekNum}
                onChange={e => setNewLogWeekNum(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={newLogDate}
                onChange={e => setNewLogDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Topik Pelajaran *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pelajaran 1: Cinta Alkitab"
              value={newLogTopic}
              onChange={e => setNewLogTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan & Kesan</label>
            <textarea
              rows={3}
              placeholder="Bagaimana responsnya? Apa kendalanya?"
              value={newLogNotes}
              onChange={e => setNewLogNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 resize-none focus:outline-none"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}

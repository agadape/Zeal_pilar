'use client';

import { useState } from 'react';
import { Person, PersonStatus, Gender, WeeklyStudyProgressLog } from '@/lib/types';
import { 
  IconUserPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconX, 
  IconCheck, 
  IconPhone,
  IconUsers,
  IconBook,
  IconHeartHandshake,
  IconPlus,
  IconHistory
} from '@tabler/icons-react';

interface PeopleViewProps {
  people: Person[];
  onSavePerson: (person: Omit<Person, 'id'> & { id?: string; study_history?: WeeklyStudyProgressLog[] }) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
}

export default function PeopleView({ people, onSavePerson, onDeletePerson }: PeopleViewProps) {
  const [activeCategoryTab, setActiveCategoryTab] = useState<'disciples' | 'bible_study' | 'reachout'>('disciples');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  
  // Person Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('BROTHER');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState('');
  const [status, setStatus] = useState<PersonStatus>('DISCIPLE');
  const [studyStage, setStudyStage] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // BA Weekly Progress Tracker State
  const [trackingBAPerson, setTrackingBAPerson] = useState<Person | null>(null);
  const [newLogWeekNum, setNewLogWeekNum] = useState<number>(1);
  const [newLogTopic, setNewLogTopic] = useState<string>('Pelajaran 1: Cinta Alkitab');
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogNotes, setNewLogNotes] = useState<string>('');

  const LESSON_PRESETS = [
    'Pelajaran 1: Cinta Alkitab',
    'Pelajaran 2: Perilaku & Dosa',
    'Pelajaran 3: Salib & Kasih Kristus',
    'Pelajaran 4: Pertobatan',
    'Pelajaran 5: Baptis & Gereja',
    'Pelajaran 6: Pemuridan & Hidup Baru'
  ];

  const openAddModal = () => {
    setEditingPerson(null);
    setFullName('');
    setGender('BROTHER');
    setPhone('');
    setCampus('');
    setStatus(activeCategoryTab === 'bible_study' ? 'BIBLE_STUDY' : activeCategoryTab === 'reachout' ? 'VISITOR' : 'DISCIPLE');
    setStudyStage('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Person) => {
    setEditingPerson(p);
    setFullName(p.full_name);
    setGender(p.gender);
    setPhone(p.phone_number || '');
    setCampus(p.campus || '');
    setStatus(p.status);
    setStudyStage(p.study_stage || '');
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);
    try {
      await onSavePerson({
        id: editingPerson?.id,
        full_name: fullName.trim(),
        gender,
        phone_number: phone.trim() || undefined,
        campus: campus.trim() || undefined,
        status,
        study_stage: status === 'BIBLE_STUDY' ? (studyStage.trim() || 'Pelajaran 1: Cinta Alkitab') : undefined,
        study_history: editingPerson?.study_history || [],
        notes: notes.trim() || undefined
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Open BA Progress Tracker
  const openBATracker = (p: Person) => {
    setTrackingBAPerson(p);
    const existingLogs = p.study_history || [];
    setNewLogWeekNum(existingLogs.length + 1);
    setNewLogTopic(LESSON_PRESETS[Math.min(existingLogs.length, LESSON_PRESETS.length - 1)]);
    setNewLogDate(new Date().toISOString().split('T')[0]);
    setNewLogNotes('');
  };

  // Add Weekly BA Log
  const handleAddBALog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingBAPerson || !newLogTopic.trim()) return;
    
    const existingLogs = trackingBAPerson.study_history || [];
    const newLog: WeeklyStudyProgressLog = {
      id: 'log_' + Date.now(),
      week_number: newLogWeekNum,
      study_date: newLogDate,
      lesson_topic: newLogTopic.trim(),
      notes: newLogNotes.trim() || undefined
    };

    const updatedHistory = [...existingLogs, newLog].sort((a, b) => a.week_number - b.week_number);
    const updatedStage = `Minggu ${newLogWeekNum}: ${newLogTopic.trim()}`;

    setSubmitting(true);
    try {
      await onSavePerson({
        id: trackingBAPerson.id,
        full_name: trackingBAPerson.full_name,
        gender: trackingBAPerson.gender,
        phone_number: trackingBAPerson.phone_number,
        campus: trackingBAPerson.campus,
        status: 'BIBLE_STUDY',
        study_stage: updatedStage,
        study_history: updatedHistory,
        notes: trackingBAPerson.notes
      });
      setTrackingBAPerson(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Category Filtering
  const disciplesPeople = people.filter(p => p.status === 'LEADER' || p.status === 'DISCIPLE');
  const bibleStudyPeople = people.filter(p => p.status === 'BIBLE_STUDY');
  const reachoutPeople = people.filter(p => p.status === 'VISITOR' || p.status === 'WEAK' || p.status === 'INACTIVE');

  let currentCategoryList = disciplesPeople;
  if (activeCategoryTab === 'bible_study') currentCategoryList = bibleStudyPeople;
  if (activeCategoryTab === 'reachout') currentCategoryList = reachoutPeople;

  const filteredPeople = currentCategoryList.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.campus && p.campus.toLowerCase().includes(search.toLowerCase())) ||
                          (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesGender = filterGender === 'ALL' || p.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  const getStatusBadgeClass = (st: PersonStatus) => {
    switch (st) {
      case 'LEADER': return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'DISCIPLE': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'BIBLE_STUDY': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'VISITOR': return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      case 'WEAK': return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Direktori & Progress Jemaat</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Pemisahan data Disciple, Belajar Alkitab (BA), serta Reachout & Tamu Ibadah.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconUserPlus className="w-4 h-4" stroke={2} />
          <span>Tambah Orang Baru</span>
        </button>
      </div>

      {/* CATEGORY TABS (DISCIPLES vs BIBLE STUDY vs REACHOUT) */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategoryTab('disciples')}
          className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition-all ${
            activeCategoryTab === 'disciples'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IconUsers className="w-4 h-4 text-emerald-700" stroke={1.5} />
          <span>Murid & Leader ({disciplesPeople.length})</span>
        </button>

        <button
          onClick={() => setActiveCategoryTab('bible_study')}
          className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition-all ${
            activeCategoryTab === 'bible_study'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IconBook className="w-4 h-4 text-[#b5852e]" stroke={2} />
          <span>Belajar Alkitab ({bibleStudyPeople.length})</span>
        </button>

        <button
          onClick={() => setActiveCategoryTab('reachout')}
          className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition-all ${
            activeCategoryTab === 'reachout'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IconHeartHandshake className="w-4 h-4 text-cyan-700" stroke={1.5} />
          <span>Reachout & Tamu ({reachoutPeople.length})</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="tugu-card p-4 rounded-2xl bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" stroke={1.5} />
          <input
            type="text"
            placeholder="Cari nama, kampus, atau catatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#b5852e]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            <option value="ALL">Semua Gender</option>
            <option value="BROTHER">BROTHER</option>
            <option value="SISTER">SISTER</option>
          </select>
        </div>
      </div>

      {/* TAB 2: BIBLE STUDY WEEKLY TRACKER VIEW */}
      {activeCategoryTab === 'bible_study' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.length === 0 ? (
            <div className="md:col-span-3 tugu-card p-12 text-center text-slate-400 text-xs bg-white rounded-3xl">
              Belum ada data teman yang sedang Belajar Alkitab (BA). Klik <strong>Tambah Orang Baru</strong> untuk mendaftarkan kandidat BA.
            </div>
          ) : (
            filteredPeople.map(p => {
              const logs = p.study_history || [];
              return (
                <div key={p.id} className="tugu-card tugu-card-interactive p-6 rounded-3xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                        BIBLE STUDY
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">{p.gender} • {p.campus || 'Umum'}</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{p.full_name}</h3>
                      {p.phone_number && (
                        <span className="flex items-center space-x-1 text-xs font-mono text-slate-500 mt-0.5">
                          <IconPhone className="w-3 h-3 text-slate-400 shrink-0" stroke={1.5} />
                          <span>{p.phone_number}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-900 uppercase">Progres Terakhir:</span>
                      <p className="text-xs font-bold text-slate-900">
                        {p.study_stage || 'Pelajaran 1: Cinta Alkitab'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Total Sesi BA: <strong className="text-slate-900">{logs.length} Sesi</strong></span>
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <IconEdit className="w-4 h-4" stroke={1.5} />
                      </button>
                    </div>

                    <button
                      onClick={() => openBATracker(p)}
                      className="btn-tactile w-full py-2.5 px-3 rounded-xl bg-[#b5852e] hover:bg-[#9a6f23] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-xs"
                    >
                      <IconPlus className="w-4 h-4" stroke={2} />
                      <span>Input Progress Minggu Ini</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* DISCIPLES & REACHOUT TABLE VIEW */
        <div className="tugu-card rounded-2xl overflow-hidden bg-white border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Campus / Asal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Catatan / Info</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                      Tidak ada data jemaat yang cocok dengan kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {p.full_name}
                        {p.phone_number && (
                          <span className="flex items-center space-x-1 text-xs font-mono font-normal text-slate-500 mt-0.5">
                            <IconPhone className="w-3 h-3 text-slate-400 shrink-0" stroke={1.5} />
                            <span>{p.phone_number}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium">
                        <span className={`px-2 py-0.5 rounded ${
                          p.gender === 'BROTHER' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-pink-50 text-pink-800 border border-pink-200'
                        }`}>
                          {p.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {p.campus || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border inline-block uppercase ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-tactile p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                        >
                          <IconEdit className="w-4 h-4" stroke={1.5} />
                        </button>
                        <button
                          onClick={() => onDeletePerson(p.id)}
                          className="btn-tactile p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                        >
                          <IconTrash className="w-4 h-4" stroke={1.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WEEKLY BA TRACKER MODAL */}
      {trackingBAPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Track Progress BA: {trackingBAPerson.full_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Catat materi Belajar Alkitab mingguan secara terstruktur.</p>
              </div>
              <button onClick={() => setTrackingBAPerson(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            {/* TIMELINE OF PAST WEEKS */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <IconHistory className="w-4 h-4 text-[#b5852e]" stroke={1.5} />
                <span>Riwayat Belajar Alkitab</span>
              </h4>

              {(!trackingBAPerson.study_history || trackingBAPerson.study_history.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-2">Belum ada riwayat sesi mingguan. Tambahkan sesi pertama di bawah ini!</p>
              ) : (
                <div className="space-y-2">
                  {trackingBAPerson.study_history.map(log => (
                    <div key={log.id} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Minggu {log.week_number}: {log.lesson_topic}</span>
                        <span className="font-mono text-[11px] text-amber-900">{log.study_date}</span>
                      </div>
                      {log.notes && <p className="text-slate-600 text-[11px]">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORM FOR NEW WEEKLY LOG */}
            <form onSubmit={handleAddBALog} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                + Tambah Log Sesi Minggu Ini
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLogWeekNum}
                    onChange={e => setNewLogWeekNum(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-[#b5852e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Tanggal Sesi</label>
                  <input
                    type="date"
                    required
                    value={newLogDate}
                    onChange={e => setNewLogDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Materi / Topik Pelajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelajaran 2: Perilaku & Dosa"
                  value={newLogTopic}
                  onChange={e => setNewLogTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan & Komitmen</label>
                <textarea
                  rows={2}
                  placeholder="Kesan, keterbukaan, atau PR perenungan minggu ini..."
                  value={newLogNotes}
                  onChange={e => setNewLogNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrackingBAPerson(null)}
                  className="btn-tactile btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Simpan Progress Minggu Ini</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CREATE / EDIT PERSON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPerson ? 'Edit Data Orang' : 'Tambah Orang Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
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
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Kampus / Univ</label>
                  <input
                    type="text"
                    placeholder="UGM / UNY / Atma Jaya / STIPRAM"
                    value={campus}
                    onChange={e => setCampus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Status Pelayanan *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as PersonStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                  >
                    <option value="DISCIPLE">DISCIPLE (Murid)</option>
                    <option value="LEADER">LEADER (Pemimpin)</option>
                    <option value="BIBLE_STUDY">BIBLE STUDY (Belajar Alkitab)</option>
                    <option value="VISITOR">VISITOR (Tamu)</option>
                    <option value="WEAK">WEAK (Butuh Care)</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {status === 'BIBLE_STUDY' && (
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Stage BA Awal</label>
                    <input
                      type="text"
                      placeholder="Pelajaran 1: Cinta Alkitab"
                      value={studyStage}
                      onChange={e => setStudyStage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nomor Phone / WA</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan Follow-up</label>
                <textarea
                  rows={2}
                  placeholder="Info OJT, jadwal wisuda, atau request doa..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Simpan Data</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

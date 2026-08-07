'use client';

import { useState } from 'react';
import { Person, PersonStatus, Gender } from '@/lib/types';
import { UserPlus, Search, Edit2, Trash2, X, Check, Filter } from 'lucide-react';

interface PeopleViewProps {
  people: Person[];
  onSavePerson: (person: Omit<Person, 'id'> & { id?: string }) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
}

export default function PeopleView({ people, onSavePerson, onDeletePerson }: PeopleViewProps) {
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
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

  const openAddModal = () => {
    setEditingPerson(null);
    setFullName('');
    setGender('BROTHER');
    setPhone('');
    setCampus('');
    setStatus('DISCIPLE');
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
        study_stage: status === 'BIBLE_STUDY' ? studyStage.trim() : undefined,
        notes: notes.trim() || undefined
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPeople = people.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.campus && p.campus.toLowerCase().includes(search.toLowerCase())) ||
                          (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesGender = filterGender === 'ALL' || p.gender === filterGender;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesGender && matchesStatus;
  });

  const getStatusBadgeClass = (st: PersonStatus) => {
    switch (st) {
      case 'LEADER': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'DISCIPLE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'BIBLE_STUDY': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'VISITOR': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'WEAK': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'INACTIVE': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Tambah & Kelola Orang</h1>
          <p className="text-sm text-slate-400">Direktori jemaat, status murid, leader, dan progres Belajar Alkitab (BA).</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-glow px-4 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-white/10 hover:bg-slate-200"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Orang Baru</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, kampus, atau catatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="ALL" className="bg-zinc-900">Semua Gender</option>
            <option value="BROTHER" className="bg-zinc-900">Brother</option>
            <option value="SISTER" className="bg-zinc-900">Sister</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="ALL" className="bg-zinc-900">Semua Status</option>
            <option value="LEADER" className="bg-zinc-900">Leader</option>
            <option value="DISCIPLE" className="bg-zinc-900">Disciple</option>
            <option value="BIBLE_STUDY" className="bg-zinc-900">Belajar Alkitab</option>
            <option value="VISITOR" className="bg-zinc-900">Visitor</option>
            <option value="WEAK" className="bg-zinc-900">Weak / Care</option>
            <option value="INACTIVE" className="bg-zinc-900">Inactive</option>
          </select>
        </div>
      </div>

      {/* PEOPLE TABLE / CARDS */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Campus / Asal</th>
                <th className="px-6 py-4">Status & Progres</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Tidak ada data jemaat yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredPeople.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {p.full_name}
                      {p.phone_number && (
                        <span className="block text-xs font-normal text-slate-400">{p.phone_number}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded ${
                        p.gender === 'BROTHER' ? 'bg-blue-500/10 text-blue-300' : 'bg-pink-500/10 text-pink-300'
                      }`}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {p.campus || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block w-fit ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                        {p.status === 'BIBLE_STUDY' && p.study_stage && (
                          <span className="text-xs text-amber-300/90 font-medium">
                            Stage: {p.study_stage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                      {p.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePerson(p.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPerson ? 'Edit Data Orang' : 'Tambah Orang Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Axel / Sherly"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="BROTHER">BROTHER</option>
                    <option value="SISTER">SISTER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Kampus / Univ</label>
                  <input
                    type="text"
                    placeholder="UGM / UNY / Atma / STIPRAM"
                    value={campus}
                    onChange={e => setCampus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status Pelayanan *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as PersonStatus)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
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
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stage BA</label>
                    <input
                      type="text"
                      placeholder="Murid / Tujuan Hidup / Kasih"
                      value={studyStage}
                      onChange={e => setStudyStage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nomor Phone / WA</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Catatan Follow-up</label>
                <textarea
                  rows={2}
                  placeholder="Info OJT, jadwal wisuda, atau request doa..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glow px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
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

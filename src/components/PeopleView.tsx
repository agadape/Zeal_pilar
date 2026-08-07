'use client';

import { useState } from 'react';
import { Person, PersonStatus, Gender } from '@/lib/types';
import { 
  IconUserPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconX, 
  IconCheck, 
  IconFilter,
  IconPhone
} from '@tabler/icons-react';

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Tambah & Kelola Orang</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Direktori jemaat, status murid, leader, dan progres Belajar Alkitab (BA).</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconUserPlus className="w-4 h-4" stroke={2} />
          <span>Tambah Orang Baru</span>
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

        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
            <IconFilter className="w-3.5 h-3.5" stroke={1.5} />
            <span>Filter:</span>
          </div>

          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            <option value="ALL">Semua Gender</option>
            <option value="BROTHER">BROTHER</option>
            <option value="SISTER">SISTER</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="LEADER">Leader</option>
            <option value="DISCIPLE">Disciple</option>
            <option value="BIBLE_STUDY">Belajar Alkitab</option>
            <option value="VISITOR">Visitor</option>
            <option value="WEAK">Weak / Care</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* PEOPLE TABLE */}
      <div className="tugu-card rounded-2xl overflow-hidden bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Campus / Asal</th>
                <th className="px-6 py-4">Status & Progres</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada data jemaat yang cocok dengan pencarian.
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
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border inline-block w-fit uppercase ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                        {p.status === 'BIBLE_STUDY' && p.study_stage && (
                          <span className="text-xs text-amber-800 font-semibold">
                            Stage: {p.study_stage}
                          </span>
                        )}
                      </div>
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

      {/* MODAL FORM */}
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
                    <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Stage BA</label>
                    <input
                      type="text"
                      placeholder="Murid / Tujuan Hidup / Kasih"
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

'use client';

import { useState } from 'react';
import { MinistryEvent, Person, EventType, EventRoster } from '@/lib/types';
import { 
  IconCalendarEvent, 
  IconPlus, 
  IconUserCheck, 
  IconMapPin, 
  IconClock, 
  IconEdit, 
  IconTrash, 
   
  } from '@tabler/icons-react';
import FormPanel from './FormPanel';

interface EventsViewProps {
  events: MinistryEvent[];
  people: Person[];
  onSaveEvent: (event: Omit<MinistryEvent, 'id'> & { id?: string }) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export default function EventsView({ events, people, onSaveEvent, onDeleteEvent }: EventsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MinistryEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Event Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('PDA_COMBINED');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Duty Roster assignments inside event modal
  const [speakerId, setSpeakerId] = useState('');
  const [mcId, setMcId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [worshipId, setWorshipId] = useState('');

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setType('PDA_COMBINED');
    setEventDate(new Date().toISOString().slice(0, 16));
    setLocation('Gedung GKDI Jogja / Online');
    setDescription('');
    setSpeakerId('');
    setMcId('');
    setOperatorId('');
    setWorshipId('');
    setIsModalOpen(true);
  };

  const openEditModal = (ev: MinistryEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setType(ev.type);
    setEventDate(new Date(ev.event_date).toISOString().slice(0, 16));
    setLocation(ev.location || '');
    setDescription(ev.description || '');

    const rSpeaker = ev.roster?.find(r => r.role === 'SPEAKER')?.person_id || '';
    const rMc = ev.roster?.find(r => r.role === 'MC')?.person_id || '';
    const rOp = ev.roster?.find(r => r.role === 'OPERATOR')?.person_id || '';
    const rWorship = ev.roster?.find(r => r.role === 'WORSHIP')?.person_id || '';

    setSpeakerId(rSpeaker);
    setMcId(rMc);
    setOperatorId(rOp);
    setWorshipId(rWorship);

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    const roster: EventRoster[] = [];
    if (speakerId) roster.push({ id: '', event_id: '', person_id: speakerId, role: 'SPEAKER' });
    if (mcId) roster.push({ id: '', event_id: '', person_id: mcId, role: 'MC' });
    if (operatorId) roster.push({ id: '', event_id: '', person_id: operatorId, role: 'OPERATOR' });
    if (worshipId) roster.push({ id: '', event_id: '', person_id: worshipId, role: 'WORSHIP' });

    await onSaveEvent({
      id: editingEvent?.id,
      title: title.trim(),
      type,
      event_date: new Date(eventDate).toISOString(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      roster
    });

    setIsModalOpen(false);
    setSubmitting(false);
  };

  const getTypeBadgeClass = (t: EventType) => {
    switch (t) {
      case 'PDA_BRO': return 'bg-blue-100 text-blue-700 shadow-sm';
      case 'PDA_SIS': return 'bg-pink-100 text-pink-700 shadow-sm';
      case 'PDA_COMBINED': return 'bg-purple-100 text-purple-700 shadow-sm';
      case 'DOA_YOUTH': return 'bg-amber-100 text-amber-700 shadow-sm';
      case 'PW_NIGHT': return 'bg-cyan-100 text-cyan-700 shadow-sm';
      case 'RETREAT': return 'bg-emerald-100 text-emerald-700 shadow-sm';
      default: return 'bg-slate-100 text-slate-700 shadow-sm';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      
      {/* HEADER - Playful & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Jadwal Events 📅
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Jadwal Persekutuan Doa Anggota (PDA), Retreat, dan pembagian tugas pelayanan.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/30 flex items-center space-x-2 transition-transform hover:-translate-y-0.5 shrink-0"
        >
          <IconPlus className="w-5 h-5" stroke={2} />
          <span>Buat Jadwal Event</span>
        </button>
      </div>

      {/* EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 py-24 text-center bg-white/50 rounded-[2rem] border-2 border-slate-200 border-dashed backdrop-blur-sm">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
              <IconCalendarEvent className="w-10 h-10 text-slate-300" stroke={1.5} />
            </div>
            <p className="text-slate-800 font-extrabold text-lg">Belum ada event nih! 🏖️</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Klik &quot;Buat Jadwal Event&quot; untuk merencanakan kegiatan baru.</p>
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="group p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-pointer flex flex-col justify-between transition-all duration-300 relative overflow-hidden">
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getTypeBadgeClass(ev.type)}`}>
                    {ev.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-400 transition-all shadow-sm"
                    >
                      <IconEdit className="w-4 h-4" stroke={2} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Yakin ingin menghapus event ini?')) onDeleteEvent(ev.id);
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all shadow-sm"
                    >
                      <IconTrash className="w-4 h-4" stroke={2} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{ev.title}</h3>
                  <div className="flex flex-col gap-2 mt-3 text-sm text-slate-600 font-bold">
                    <div className="flex items-center space-x-2 bg-slate-50 w-fit px-3 py-1.5 rounded-xl border border-slate-100">
                      <IconClock className="w-4 h-4 text-indigo-400" stroke={2.5} />
                      <span>{new Date(ev.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center space-x-2 bg-slate-50 w-fit px-3 py-1.5 rounded-xl border border-slate-100">
                        <IconMapPin className="w-4 h-4 text-rose-400" stroke={2.5} />
                        <span>{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {ev.description && (
                  <p className="text-sm text-slate-500 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                    {ev.description}
                  </p>
                )}
              </div>

              {/* DUTY ROSTER DISPLAY */}
              <div className="pt-5 mt-5 border-t border-slate-100 relative z-10">
                <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  <IconUserCheck className="w-4 h-4 text-emerald-500" stroke={2} />
                  <span>Petugas Pelayanan (Duty)</span>
                </div>

                {ev.roster && ev.roster.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {ev.roster.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">{r.role}</span>
                        <span className="text-sm font-bold text-slate-900 truncate">{r.person_name || 'Assigned'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold">Belum ada petugas yang ditugaskan.</p>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* EVENT MODAL */}
      <FormPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Edit Event & Roster' : 'Buat Event Baru'}
        onSubmit={handleSubmit}
        submitLabel="Simpan Event"
        isSubmitDisabled={submitting}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Event</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Judul Kegiatan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: PDA Gabungan Youth / P&W Night"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipe Event *</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as EventType)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="PDA_COMBINED">PDA Gabungan</option>
                  <option value="PDA_BRO">PDA Brother</option>
                  <option value="PDA_SIS">PDA Sister</option>
                  <option value="DOA_YOUTH">Doa Youth</option>
                  <option value="PW_NIGHT">P&W Night</option>
                  <option value="RETREAT">Retreat / Camp</option>
                  <option value="PMK_OUTREACH">PMK Outreach</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Waktu Event *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lokasi</label>
              <input
                type="text"
                placeholder="Gedung GKDI Jogja / Zoom Meeting"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Deskripsi / Tema</label>
              <textarea
                rows={2}
                placeholder="Tema firman atau instruksi kegiatan..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* DUTY ROSTER SELECTION */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
              <IconUserCheck className="w-4 h-4" stroke={2.5} />
              Tugaskan Petugas Pelayanan
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Speaker / Firman</label>
                <select
                  value={speakerId}
                  onChange={e => setSpeakerId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                >
                  <option value="">-- Kosong --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">MC</label>
                <select
                  value={mcId}
                  onChange={e => setMcId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                >
                  <option value="">-- Kosong --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Praise & Worship</label>
                <select
                  value={worshipId}
                  onChange={e => setWorshipId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                >
                  <option value="">-- Kosong --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Operator</label>
                <select
                  value={operatorId}
                  onChange={e => setOperatorId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                >
                  <option value="">-- Kosong --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </FormPanel>
    </div>
  );
}

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
  IconX, 
  IconCheck 
} from '@tabler/icons-react';

interface EventsViewProps {
  events: MinistryEvent[];
  people: Person[];
  onSaveEvent: (event: Omit<MinistryEvent, 'id'> & { id?: string }) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export default function EventsView({ events, people, onSaveEvent, onDeleteEvent }: EventsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MinistryEvent | null>(null);

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
  };

  const getTypeBadgeClass = (t: EventType) => {
    switch (t) {
      case 'PDA_BRO': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PDA_SIS': return 'bg-pink-50 text-pink-800 border-pink-200';
      case 'PDA_COMBINED': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DOA_YOUTH': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'PW_NIGHT': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'RETREAT': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <IconCalendarEvent className="w-7 h-7 text-[#b5852e] shrink-0" stroke={1.5} />
            <span>Events & Duty Roster</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Jadwal Persekutuan Doa Anggota (PDA), Doa Youth, P&W Night, dan penugasan petugas pelayanan.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconPlus className="w-4 h-4" stroke={2} />
          <span>Buat Jadwal Event</span>
        </button>
      </div>

      {/* EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="md:col-span-2 tugu-card p-12 text-center text-slate-400 text-xs bg-white rounded-3xl">
            Belum ada jadwal kegiatan yang dibuat. Klik <strong>Buat Jadwal Event</strong> untuk memulai.
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="tugu-card tugu-card-interactive p-6 rounded-3xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border uppercase tracking-wider ${getTypeBadgeClass(ev.type)}`}>
                    {ev.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="btn-tactile p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                    >
                      <IconEdit className="w-4 h-4" stroke={1.5} />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="btn-tactile p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                    >
                      <IconTrash className="w-4 h-4" stroke={1.5} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{ev.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-2">
                    <div className="flex items-center space-x-1">
                      <IconClock className="w-3.5 h-3.5 text-slate-400" stroke={1.5} />
                      <span>{new Date(ev.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center space-x-1">
                        <IconMapPin className="w-3.5 h-3.5 text-slate-400" stroke={1.5} />
                        <span>{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 leading-relaxed font-medium">
                    {ev.description}
                  </p>
                )}
              </div>

              {/* DUTY ROSTER DISPLAY */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-900 uppercase">
                  <IconUserCheck className="w-4 h-4 text-emerald-600" stroke={1.5} />
                  <span>Petugas Pelayanan:</span>
                </div>

                {ev.roster && ev.roster.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {ev.roster.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">{r.role}</span>
                        <span className="font-bold text-slate-900 truncate max-w-[100px]">{r.person_name || 'Assigned'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada petugas yang ditugaskan.</p>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
            <div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEvent ? 'Edit Event & Duty Roster' : 'Buat Event & Roster Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Judul Kegiatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PDA Gabungan Youth / P&W Night"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Tipe Event *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as EventType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
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
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Waktu Event *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Lokasi</label>
                <input
                  type="text"
                  placeholder="Gedung GKDI Jogja / Zoom Meeting"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Deskripsi / Tema</label>
                <textarea
                  rows={2}
                  placeholder="Tema firman atau instruksi kegiatan..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 resize-none"
                />
              </div>

              {/* DUTY ROSTER SELECTION */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#b5852e]">
                  Tugaskan Petugas Pelayanan (Duty Roster)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">Speaker / Pembawa Firman</label>
                    <select
                      value={speakerId}
                      onChange={e => setSpeakerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="">-- Belum Ditugaskan --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">Master of Ceremony (MC)</label>
                    <select
                      value={mcId}
                      onChange={e => setMcId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="">-- Belum Ditugaskan --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">Praise & Worship (WL/Musisi)</label>
                    <select
                      value={worshipId}
                      onChange={e => setWorshipId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="">-- Belum Ditugaskan --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">Operator Zoom / Sound</label>
                    <select
                      value={operatorId}
                      onChange={e => setOperatorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="">-- Belum Ditugaskan --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Simpan Event</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}

'use client';

import { useState } from 'react';
import { MinistryEvent, Person, EventType } from '@/lib/types';
import { Calendar, Plus, UserCheck, MapPin, Clock, X, Check, Shield } from 'lucide-react';

interface EventsViewProps {
  events: MinistryEvent[];
  people: Person[];
  onSaveEvent: (event: Omit<MinistryEvent, 'id'> & { id?: string }) => Promise<void>;
}

export default function EventsView({ events, people, onSaveEvent }: EventsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('PDA_COMBINED');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // Duty Rosters in Form
  const [speakerId, setSpeakerId] = useState('');
  const [mcId, setMcId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [worshipId, setWorshipId] = useState('');

  const openAddModal = () => {
    setTitle('');
    setType('PDA_COMBINED');
    setEventDate('');
    setLocation('');
    setDescription('');
    setSpeakerId('');
    setMcId('');
    setOperatorId('');
    setWorshipId('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    const roster: any[] = [];
    if (speakerId) {
      const p = people.find(item => item.id === speakerId);
      roster.push({ person_id: speakerId, person_name: p?.full_name, role: 'SPEAKER' });
    }
    if (mcId) {
      const p = people.find(item => item.id === mcId);
      roster.push({ person_id: mcId, person_name: p?.full_name, role: 'MC' });
    }
    if (operatorId) {
      const p = people.find(item => item.id === operatorId);
      roster.push({ person_id: operatorId, person_name: p?.full_name, role: 'OPERATOR' });
    }
    if (worshipId) {
      const p = people.find(item => item.id === worshipId);
      roster.push({ person_id: worshipId, person_name: p?.full_name, role: 'WORSHIP' });
    }

    await onSaveEvent({
      title: title.trim(),
      type,
      event_date: new Date(eventDate).toISOString(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      roster
    });

    setIsModalOpen(false);
  };

  const getEventTypeLabel = (t: EventType) => {
    switch (t) {
      case 'PDA_COMBINED': return 'PDA Gabungan Bro & Sis';
      case 'PDA_BRO': return 'PDA Brother';
      case 'PDA_SIS': return 'PDA Sister';
      case 'DOA_YOUTH': return 'Doa Bersama Youth';
      case 'PW_NIGHT': return 'Praise & Worship Night';
      case 'RETREAT': return 'Retreat / Youth Camp';
      case 'PMK_OUTREACH': return 'PMK Campus Outreach';
      default: return t;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Events & Duty Rosters</h1>
          <p className="text-sm text-slate-400">Jadwal kegiatan pelayanan PDA, Doa Bersama Youth, dan penugasan PIC (MC, Worship, Speaker, Operator).</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-glow px-4 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-white/10 hover:bg-slate-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Event Baru</span>
        </button>
      </div>

      {/* EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="col-span-2 glass-panel p-12 rounded-2xl text-center text-slate-400">
            Belum ada jadwal event yang dibuat. Klik tombol di atas untuk membuat event baru.
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white uppercase tracking-wider">
                    {getEventTypeLabel(ev.type)}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ev.event_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{ev.title}</h3>
                  {ev.location && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                  {ev.description && (
                    <p className="text-xs text-slate-400 mt-2">{ev.description}</p>
                  )}
                </div>
              </div>

              {/* DUTY ROSTER SUMMARY */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Petugas / Duty Roster</span>
                </h4>

                {ev.roster && ev.roster.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {ev.roster.map(r => (
                      <div key={r.id || r.role} className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">{r.role}</span>
                        <span className="font-semibold text-white">{r.person_name || 'Petugas'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Belum ada petugas yang ditugaskan.</p>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Buat Jadwal Event & Roster</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Judul Event *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PDA Gabungan Bro Sis / Doa Bersama Youth"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipe Event *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as EventType)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="PDA_COMBINED">PDA Gabungan Bro & Sis</option>
                    <option value="PDA_BRO">PDA Brother</option>
                    <option value="PDA_SIS">PDA Sister</option>
                    <option value="DOA_YOUTH">Doa Bersama Youth</option>
                    <option value="PW_NIGHT">Praise & Worship Night</option>
                    <option value="RETREAT">Retreat / Camp</option>
                    <option value="PMK_OUTREACH">PMK Campus Outreach</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tanggal & Waktu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Lokasi / Venue</label>
                <input
                  type="text"
                  placeholder="Contoh: Hall Student Center / Zoom Meeting Room"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Keterangan Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi dresscode, link zoom, atau topik firman..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white resize-none"
                />
              </div>

              {/* DUTY ROSTER SELECTION */}
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-t border-white/10 pt-4">
                  Penugasan Petugas (Duty Roster)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Pembawa Firman / Speaker</label>
                    <select
                      value={speakerId}
                      onChange={e => setSpeakerId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Pilih Speaker --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">MC / Leader</label>
                    <select
                      value={mcId}
                      onChange={e => setMcId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Pilih MC --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Operator (Slides/Zoom)</label>
                    <select
                      value={operatorId}
                      onChange={e => setOperatorId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Pilih Operator --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Worship Leader</label>
                    <select
                      value={worshipId}
                      onChange={e => setWorshipId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Pilih Worship --</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  className="btn-glow px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Event</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

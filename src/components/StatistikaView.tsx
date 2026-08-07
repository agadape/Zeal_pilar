'use client';

import { useState, useEffect } from 'react';
import { Group, Person, WeeklyStat, MissingReason, StudyProgress } from '@/lib/types';
import { fetchGroupMembers } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { 
  IconClipboardCheck, 
  IconCopy, 
  IconCheck, 
  IconSparkles, 
  IconSend, 
  IconUsers, 
  IconAlertCircle 
} from '@tabler/icons-react';

interface StatistikaViewProps {
  groups: Group[];
  people: Person[];
  stats: WeeklyStat[];
  onSaveStat: (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => Promise<void>;
}

export default function StatistikaView({ groups, people, stats, onSaveStat }: StatistikaViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [weekDate, setWeekDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Group members loaded dynamically
  const [groupMembers, setGroupMembers] = useState<Person[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form State
  const [missingMembers, setMissingMembers] = useState<MissingReason[]>([]);
  const [studyProgresses, setStudyProgresses] = useState<StudyProgress[]>([]);
  const [reachoutCount, setReachoutCount] = useState<number>(0);
  const [sundayVisitorsCount, setSundayVisitorsCount] = useState<number>(0);
  const [eventVisitorsCount, setEventVisitorsCount] = useState<number>(0);
  const [baptismsCount, setBaptismsCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load group members when selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;
    let isMounted = true;
    setLoadingMembers(true);
    fetchGroupMembers(selectedGroupId).then(members => {
      if (isMounted) {
        setGroupMembers(members);
        // Reset checkins
        setMissingMembers([]);
        setStudyProgresses([]);
        setLoadingMembers(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedGroupId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const activeDisciplesCount = groupMembers.length;

  const handleToggleMissing = (p: Person, isMissing: boolean) => {
    if (isMissing) {
      if (!missingMembers.some(m => m.person_id === p.id)) {
        setMissingMembers([...missingMembers, { person_id: p.id, person_name: p.full_name, reason: 'Izin / Luar kota' }]);
      }
    } else {
      setMissingMembers(missingMembers.filter(m => m.person_id !== p.id));
    }
  };

  const handleUpdateMissingReason = (personId: string, reason: string) => {
    setMissingMembers(missingMembers.map(m => m.person_id === personId ? { ...m, reason } : m));
  };

  const handleToggleStudy = (p: Person, isStudying: boolean) => {
    if (isStudying) {
      if (!studyProgresses.some(s => s.person_id === p.id)) {
        setStudyProgresses([...studyProgresses, { person_id: p.id, person_name: p.full_name, stage: 'Murid' }]);
      }
    } else {
      setStudyProgresses(studyProgresses.filter(s => s.person_id !== p.id));
    }
  };

  const handleUpdateStudyStage = (personId: string, stage: string) => {
    setStudyProgresses(studyProgresses.map(s => s.person_id === personId ? { ...s, stage } : s));
  };

  // GENERATE WHATSAPP TEXT
  const generateWAText = () => {
    const formattedDate = new Date(weekDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();

    const groupName = selectedGroup ? selectedGroup.group_name : 'Group';
    const missingStr = missingMembers.length > 0 
      ? `${missingMembers.length}\n` + missingMembers.map(m => `* ${m.person_name} (${m.reason})`).join('\n')
      : '-';

    const studyStr = studyProgresses.length > 0
      ? `${studyProgresses.length}\n` + studyProgresses.map(s => `${s.person_name} - ${s.stage}`).join('\n')
      : '-';

    return `*STATISTIK MINGGU, ${formattedDate}*

>Nama Grups : *${groupName}*
* Jlh Disciple : ${activeDisciplesCount}
* Missing Ibadah/reason : ${missingStr}
* Jlh Study /progres: ${studyStr}
* JLh Reachout : ${reachoutCount}
* Visitor ibadah : ${sundayVisitorsCount}
* Visitor acara : ${eventVisitorsCount}
* Jlh Baptis : ${baptismsCount}${notes ? `\n\nCatatan: ${notes}` : ''}`;
  };

  const handleCopyWA = () => {
    const text = generateWAText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await onSaveStat({
        group_id: selectedGroupId,
        week_date: weekDate,
        active_disciples_count: activeDisciplesCount,
        missing_ibadah_count: missingMembers.length,
        missing_reasons: missingMembers,
        study_progress: studyProgresses,
        reachout_count: reachoutCount,
        sunday_visitors_count: sundayVisitorsCount,
        event_visitors_count: eventVisitorsCount,
        baptisms_count: baptismsCount,
        notes
      });
      handleCopyWA();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Statistika Minggu</h1>
          <p className="text-xs sm:text-sm text-slate-400">Input data jemaat mingguan, auto-load anggota group, dan ekspor pesan WhatsApp 1-klik!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM SECTION */}
        <div className="lg:col-span-2 tugu-card p-6 rounded-2xl border border-white/10 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* GROUP & DATE SELECTOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Pilih Small Group *</label>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.group_name} ({g.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Tanggal Ibadah *</label>
                <input
                  type="date"
                  value={weekDate}
                  onChange={e => setWeekDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* MEMBER CHECK-IN TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <IconUsers className="w-4 h-4 text-emerald-400" stroke={1.5} />
                  <span>Daftar Anggota Group ({groupMembers.length})</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Centang missing / BA</span>
              </div>

              {loadingMembers ? (
                <p className="text-xs font-mono text-slate-400 py-4">Memuat anggota group...</p>
              ) : groupMembers.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                  <IconAlertCircle className="w-4 h-4 shrink-0" stroke={1.5} />
                  <span>Belum ada anggota yang di-assign ke group ini. Buka tab <strong>Groups & Leaders</strong> untuk menambahkan anggota.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {groupMembers.map(m => {
                    const isMissing = missingMembers.some(mm => mm.person_id === m.id);
                    const missingReason = missingMembers.find(mm => mm.person_id === m.id)?.reason || '';
                    const isStudying = studyProgresses.some(sp => sp.person_id === m.id);
                    const studyStage = studyProgresses.find(sp => sp.person_id === m.id)?.stage || '';

                    return (
                      <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{m.full_name}</span>
                          
                          <div className="flex items-center space-x-4 text-xs">
                            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={isMissing}
                                onChange={e => handleToggleMissing(m, e.target.checked)}
                                className="rounded bg-zinc-900 border-white/20 text-amber-500 focus:ring-0"
                              />
                              <span className={isMissing ? 'text-amber-400 font-bold' : ''}>Missing</span>
                            </label>

                            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={isStudying}
                                onChange={e => handleToggleStudy(m, e.target.checked)}
                                className="rounded bg-zinc-900 border-white/20 text-emerald-500 focus:ring-0"
                              />
                              <span className={isStudying ? 'text-emerald-400 font-bold' : ''}>Belajar Alkitab</span>
                            </label>
                          </div>
                        </div>

                        {/* SUB INPUTS FOR MISSING REASON / STUDY STAGE */}
                        {(isMissing || isStudying) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            {isMissing && (
                              <input
                                type="text"
                                placeholder="Alasan missing (Luar kota/OJT/Sakit)"
                                value={missingReason}
                                onChange={e => handleUpdateMissingReason(m.id, e.target.value)}
                                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                              />
                            )}
                            {isStudying && (
                              <input
                                type="text"
                                placeholder="Stage BA (Murid/Tujuan Hidup)"
                                value={studyStage}
                                onChange={e => handleUpdateStudyStage(m.id, e.target.value)}
                                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* METRICS COUNTERS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">Reachout</label>
                <input
                  type="number"
                  min="0"
                  value={reachoutCount}
                  onChange={e => setReachoutCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold text-center tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">Visitor Ibadah</label>
                <input
                  type="number"
                  min="0"
                  value={sundayVisitorsCount}
                  onChange={e => setSundayVisitorsCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold text-center tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">Visitor Acara</label>
                <input
                  type="number"
                  min="0"
                  value={eventVisitorsCount}
                  onChange={e => setEventVisitorsCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold text-center tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase mb-1">Baptis</label>
                <input
                  type="number"
                  min="0"
                  value={baptismsCount}
                  onChange={e => setBaptismsCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold text-center tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Catatan perkembangan atau info khusus group..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleCopyWA}
                className="btn-tactile btn-secondary"
              >
                <IconCopy className="w-4 h-4" stroke={1.5} />
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Copy WA Saja'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-tactile btn-primary"
              >
                <IconSend className="w-4 h-4" stroke={2} />
                <span>{saving ? 'Menyimpan...' : 'Simpan & Copy WA'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* LIVE WHATSAPP TEMPLATE PREVIEW */}
        <div className="tugu-card p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <IconSparkles className="w-4 h-4 text-cyan-400" stroke={1.5} />
                <span>Live Preview Format WA</span>
              </h3>
              <button
                onClick={handleCopyWA}
                className="btn-tactile text-xs text-slate-300 hover:text-white flex items-center space-x-1 font-mono"
              >
                {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-400" stroke={2} /> : <IconCopy className="w-3.5 h-3.5" stroke={1.5} />}
                <span>Copy</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/15 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">
              {generateWAText()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-white">Petunjuk:</p>
            <p>Klik <strong>Simpan & Copy WA</strong> untuk menyimpan laporan ke database Supabase dan otomatis menyalin format ke clipboard WhatsApp.</p>
          </div>
        </div>

      </div>

    </div>
  );
}

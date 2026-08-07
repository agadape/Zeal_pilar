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
  IconAlertCircle,
  IconChartBar,
  IconTrash,
  IconHistory,
  IconTrendingUp
} from '@tabler/icons-react';

interface StatistikaViewProps {
  groups: Group[];
  people?: Person[];
  stats?: WeeklyStat[];
  onSaveStat: (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => Promise<void>;
  onDeleteStat?: (id: string) => Promise<void>;
}

export default function StatistikaView({ groups, stats = [], onSaveStat, onDeleteStat }: StatistikaViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'analytics'>('form');
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

  // Analytics Metrics Calculation
  const totalDisciplesTracked = stats.reduce((acc, curr) => acc + (curr.active_disciples_count || 0), 0);
  const totalReachoutsRecorded = stats.reduce((acc, curr) => acc + (curr.reachout_count || 0), 0);
  const totalVisitorsRecorded = stats.reduce((acc, curr) => acc + (curr.sunday_visitors_count || 0) + (curr.event_visitors_count || 0), 0);
  const totalBaptismsRecorded = stats.reduce((acc, curr) => acc + (curr.baptisms_count || 0), 0);

  // Group data max for progress bars
  const maxReachoutInGroup = Math.max(...stats.map(s => s.reachout_count || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER & SUB-TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <IconClipboardCheck className="w-7 h-7 text-[#b5852e] shrink-0" stroke={1.5} />
            <span>Statistika Minggu & Analisis Data</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Input data jemaat mingguan, simpan ke database, dan visualisasikan grafik perkembangan ministry.</p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('form')}
            className={`btn-tactile px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'form'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IconSend className="w-3.5 h-3.5" stroke={1.5} />
            <span>Input & Format WA</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`btn-tactile px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IconChartBar className="w-3.5 h-3.5 text-[#b5852e]" stroke={2} />
            <span>Visualisasi & Data ({stats.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FORM SECTION */}
          <div className="lg:col-span-2 tugu-card p-6 rounded-3xl border border-slate-200 bg-white space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* GROUP & DATE SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Pilih Small Group *</label>
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-[#b5852e]"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.group_name} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Tanggal Ibadah *</label>
                  <input
                    type="date"
                    value={weekDate}
                    onChange={e => setWeekDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* MEMBER CHECK-IN TABLE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <IconUsers className="w-4 h-4 text-emerald-700" stroke={1.5} />
                    <span>Daftar Anggota Group ({groupMembers.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">Centang missing / BA</span>
                </div>

                {loadingMembers ? (
                  <p className="text-xs font-mono text-slate-400 py-4">Memuat anggota group...</p>
                ) : groupMembers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 font-medium">
                    <IconAlertCircle className="w-4 h-4 shrink-0 text-amber-700" stroke={1.5} />
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
                        <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{m.full_name}</span>
                            
                            <div className="flex items-center space-x-4 text-xs">
                              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={isMissing}
                                  onChange={e => handleToggleMissing(m, e.target.checked)}
                                  className="rounded bg-white border-slate-300 text-amber-600 focus:ring-0"
                                />
                                <span className={isMissing ? 'text-amber-800 font-bold' : ''}>Missing</span>
                              </label>

                              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={isStudying}
                                  onChange={e => handleToggleStudy(m, e.target.checked)}
                                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-0"
                                />
                                <span className={isStudying ? 'text-emerald-800 font-bold' : ''}>Belajar Alkitab</span>
                              </label>
                            </div>
                          </div>

                          {/* SUB INPUTS FOR MISSING REASON / STUDY STAGE */}
                          {(isMissing || isStudying) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                              {isMissing && (
                                <input
                                  type="text"
                                  placeholder="Alasan missing (Luar kota/OJT/Sakit)"
                                  value={missingReason}
                                  onChange={e => handleUpdateMissingReason(m.id, e.target.value)}
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                                />
                              )}
                              {isStudying && (
                                <input
                                  type="text"
                                  placeholder="Stage BA (Murid/Tujuan Hidup)"
                                  value={studyStage}
                                  onChange={e => handleUpdateStudyStage(m.id, e.target.value)}
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
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
                  <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">Reachout</label>
                  <input
                    type="number"
                    min="0"
                    value={reachoutCount}
                    onChange={e => setReachoutCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-black text-center tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">Visitor Ibadah</label>
                  <input
                    type="number"
                    min="0"
                    value={sundayVisitorsCount}
                    onChange={e => setSundayVisitorsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-black text-center tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">Visitor Acara</label>
                  <input
                    type="number"
                    min="0"
                    value={eventVisitorsCount}
                    onChange={e => setEventVisitorsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-black text-center tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">Baptis</label>
                  <input
                    type="number"
                    min="0"
                    value={baptismsCount}
                    onChange={e => setBaptismsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-black text-center tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan perkembangan atau info khusus group..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
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
                  <span>{saving ? 'Menyimpan...' : 'Simpan Database & Copy WA'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* LIVE WHATSAPP TEMPLATE PREVIEW */}
          <div className="tugu-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <IconSparkles className="w-4 h-4 text-amber-600" stroke={1.5} />
                  <span>Live Preview Format WA</span>
                </h3>
                <button
                  onClick={handleCopyWA}
                  className="btn-tactile text-xs text-[#b5852e] hover:text-amber-900 flex items-center space-x-1 font-bold font-mono"
                >
                  {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" stroke={2} /> : <IconCopy className="w-3.5 h-3.5" stroke={1.5} />}
                  <span>Copy</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed select-all shadow-inner">
                {generateWAText()}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 space-y-1 font-medium">
              <p className="font-bold text-slate-900">Database & Format WA:</p>
              <p>Klik <strong>Simpan Database & Copy WA</strong> untuk menyimpan laporan ke tabel <code>weekly_stats</code> Supabase sekaligus menyalin format teks ke clipboard.</p>
            </div>
          </div>

        </div>
      ) : (
        /* VISUALIZATION & ANALYTICS TAB */
        <div className="space-y-6">
          
          {/* ANALYTICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="tugu-card p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Laporan Tersimpan</span>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{stats.length}</p>
              <p className="text-xs text-slate-500 font-medium">Entri di Database</p>
            </div>

            <div className="tugu-card p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Total Disciples</span>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{totalDisciplesTracked}</p>
              <p className="text-xs text-slate-500 font-medium">Total Akumulasi</p>
            </div>

            <div className="tugu-card p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Total Reachout</span>
              <p className="text-3xl font-black text-slate-900 tabular-nums text-[#b5852e]">{totalReachoutsRecorded}</p>
              <p className="text-xs text-slate-500 font-medium">Jiwa Terjangkau</p>
            </div>

            <div className="tugu-card p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Total Visitor & Baptis</span>
              <p className="text-3xl font-black text-slate-900 tabular-nums text-emerald-700">
                {totalVisitorsRecorded} <span className="text-xs font-normal text-slate-500">/ {totalBaptismsRecorded} Baptis</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">Ibadah & Acara</p>
            </div>

          </div>

          {/* VISUALIZATION CHARTS / PROGRESS BARS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="tugu-card p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <IconTrendingUp className="w-4 h-4 text-[#b5852e]" stroke={2} />
                  <span>Perbandingan Reachout Per Small Group</span>
                </h3>
              </div>

              {stats.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada data statistik di database untuk divisualisasikan.</p>
              ) : (
                <div className="space-y-3">
                  {stats.map(s => {
                    const pct = Math.min(100, Math.round(((s.reachout_count || 0) / maxReachoutInGroup) * 100));
                    return (
                      <div key={s.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{s.group_name}</span>
                          <span className="font-mono font-semibold text-slate-600">{s.reachout_count} Reachouts ({s.week_date})</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#b5852e] transition-all duration-500" 
                            style={{ width: `${Math.max(8, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RECENT SAVED STATS TABLE */}
            <div className="tugu-card p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <IconHistory className="w-4 h-4 text-emerald-700" stroke={2} />
                  <span>Riwayat Pelaporan Database</span>
                </h3>
              </div>

              {stats.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada entri statistik di database.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {stats.map(s => (
                    <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{s.group_name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{s.week_date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                          Disciple: {s.active_disciples_count} | Missing: {s.missing_ibadah_count} | Reachout: {s.reachout_count}
                        </p>
                      </div>

                      {onDeleteStat && (
                        <button
                          onClick={() => onDeleteStat(s.id)}
                          className="btn-tactile p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                          title="Hapus Laporan"
                        >
                          <IconTrash className="w-4 h-4" stroke={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

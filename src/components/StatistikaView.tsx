'use client';

import { useState, useEffect } from 'react';
import { Group, Person, WeeklyStat, MissingReason, } from '@/lib/types';
import { fetchGroupMembers } from '@/lib/supabase';
import { exportStatsToCSV } from '@/lib/exportUtils';
import confetti from 'canvas-confetti';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  IconCopy, 
  IconSparkles, 
  IconSend, 
  IconUsers, 
  IconAlertCircle,
  IconChartBar,
  IconTrash,
  IconHistory,
  IconTrendingUp,
  IconDownload,
  IconX
} from '@tabler/icons-react';

interface StatistikaViewProps {
  groups: Group[];
  people?: Person[];
  stats?: WeeklyStat[];
  currentUser?: Person | null;
  onSaveStat: (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => Promise<void>;
  onDeleteStat?: (id: string) => Promise<void>;
}

export default function StatistikaView({ groups, stats = [], currentUser, onSaveStat, onDeleteStat }: StatistikaViewProps) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const allowedGroups = isSuperAdmin ? groups : groups.filter(g => g.leader_id === currentUser?.id);

  const [activeSubTab, setActiveSubTab] = useState<'form' | 'analytics'>('form');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(allowedGroups.length > 0 ? allowedGroups[0].id : '');
  const getMostRecentSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };
  const [weekDate, setWeekDate] = useState<string>(getMostRecentSunday());
  
  // Group members loaded dynamically
  const [groupMembers, setGroupMembers] = useState<Person[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form State
  const [missingMembers, setMissingMembers] = useState<MissingReason[]>([]);
  const [reachoutMembers, setReachoutMembers] = useState<{person_id: string, person_name: string}[]>([]);
  const [sundayVisitorsCount, setSundayVisitorsCount] = useState<number>(0);
    const [baptismsCount, setBaptismsCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedGroupId) return;
    let isMounted = true;
    setLoadingMembers(true);
    fetchGroupMembers(selectedGroupId).then(members => {
      if (isMounted) {
        setGroupMembers(members);
        // Reset checkins
        setMissingMembers([]);
                setLoadingMembers(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedGroupId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const activeDisciplesCount = groupMembers.length;
  
  const groupTotalBaptisms = stats
    .filter(s => s.group_id === selectedGroupId)
    .reduce((acc, curr) => acc + (curr.baptisms_count || 0), 0);
  const baptismGoal = selectedGroup?.baptism_goal || 0;

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
    
    const reachoutStr = reachoutMembers.length > 0 
      ? `${reachoutMembers.length} (${reachoutMembers.map(r => r.person_name).join(', ')})`
      : '0';

    return `*STATISTIK MINGGU, ${formattedDate}*

>Nama Grups : *${groupName}*
* Jlh Disciple : ${activeDisciplesCount}
* Missing Ibadah/reason : ${missingStr}
* JLh Reachout : ${reachoutStr}
* Visitor ibadah : ${sundayVisitorsCount}
* Jlh Baptis : ${baptismsCount}${baptismGoal > 0 ? ` (Goal: ${groupTotalBaptisms + baptismsCount}/${baptismGoal})` : ''}${notes ? `\n\nCatatan: ${notes}` : ''}`;
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
        study_progress: [],
        reachout_count: reachoutMembers.length,
        reachouts_list: reachoutMembers,
        sunday_visitors_count: sundayVisitorsCount,
        event_visitors_count: 0,
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
  const totalVisitorsRecorded = stats.reduce((acc, curr) => acc + (curr.sunday_visitors_count || 0), 0);
  const totalBaptismsRecorded = stats.reduce((acc, curr) => acc + (curr.baptisms_count || 0), 0);

  // Prepare Recharts trend data chronologically
  const chartData = [...stats]
    .sort((a, b) => new Date(a.week_date).getTime() - new Date(b.week_date).getTime())
    .map(s => ({
      date: s.week_date.slice(5),
      group: s.group_name || 'Group',
      Reachout: s.reachout_count || 0,
      Visitor: s.sunday_visitors_count || 0,
      Disciple: s.active_disciples_count || 0
    }));

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      
      {/* HEADER & SUB-TAB SWITCHER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Statistik & Analitik 📊
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Input data disciple mingguan, simpan ke database, dan visualisasikan grafik perkembangan ministry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
          <button
            onClick={() => exportStatsToCSV(stats)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all shadow-sm"
            title="Download CSV Excel"
          >
            <IconDownload className="w-4 h-4 text-slate-500" stroke={2} />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>

          <div className="flex items-center p-1 sm:p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-inner w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('form')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${
                activeSubTab === 'form'
                  ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconSend className="w-4 h-4" stroke={2} />
              <span>Input Data</span>
            </button>
            
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${
                activeSubTab === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconChartBar className="w-4 h-4" stroke={2} />
              <span>Visualisasi</span>
              <span className="hidden sm:inline">({stats.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'form' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* FORM SECTION */}
          <div className="xl:col-span-2 p-6 sm:p-8 rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 space-y-8">
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* GROUP & DATE SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Small Group *</label>
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                  >
                    {allowedGroups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.group_name} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Ibadah (Minggu) *</label>
                  <input
                    type="date"
                    value={weekDate}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) return;
                      const date = new Date(val);
                      if (date.getDay() !== 0) {
                        alert("Hanya bisa memilih hari Minggu!");
                        return;
                      }
                      setWeekDate(val);
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* MEMBER CHECK-IN TABLE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <IconUsers className="w-5 h-5 text-indigo-500" stroke={2} />
                    <span>Kehadiran Anggota ({groupMembers.length})</span>
                  </h3>
                </div>

                {loadingMembers ? (
                  <p className="text-sm font-bold text-slate-400 py-8 text-center bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed">Memuat anggota group...</p>
                ) : groupMembers.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-100 text-amber-900 text-sm flex items-center justify-center gap-3 font-bold">
                    <IconAlertCircle className="w-5 h-5 text-amber-500" stroke={2} />
                    <span>Belum ada anggota yang di-assign ke group ini.</span>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                    <div className="flex flex-col divide-y divide-slate-100">
                      {groupMembers.map(m => {
                        const isMissing = missingMembers.some(mm => mm.person_id === m.id);
                        const missingReason = missingMembers.find(mm => mm.person_id === m.id)?.reason || '';

                        return (
                          <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                            <h4 className="font-extrabold text-slate-900 text-base">{m.full_name}</h4>
                            
                            <div className="w-full sm:w-64 shrink-0">
                              <select
                                value={isMissing ? (missingReason === 'Izin / Luar kota' || !['Sakit', 'Pulang Kampung', 'Kerja/OJT', 'Tugas Kampus', 'MIA'].includes(missingReason) ? 'Lainnya' : missingReason) : 'Hadir'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Hadir') {
                                    setMissingMembers(prev => prev.filter(mm => mm.person_id !== m.id));
                                  } else {
                                    const reason = val === 'Lainnya' ? 'Izin / Luar kota' : val;
                                    setMissingMembers(prev => {
                                      const exists = prev.some(mm => mm.person_id === m.id);
                                      if (exists) {
                                        return prev.map(mm => mm.person_id === m.id ? { ...mm, reason } : mm);
                                      }
                                      return [...prev, { person_id: m.id, person_name: m.full_name, reason }];
                                    });
                                  }
                                }}
                                className={`w-full text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 transition-all border-2 ${
                                  isMissing 
                                    ? 'bg-amber-50 text-amber-900 border-amber-200 focus:border-amber-300 focus:ring-amber-100' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100 focus:border-emerald-300 focus:ring-emerald-100'
                                }`}
                              >
                                <option value="Hadir">✅ Hadir Ibadah</option>
                                <optgroup label="Alasan Missing">
                                  <option value="Sakit">Sakit</option>
                                  <option value="Pulang Kampung">Pulang Kampung</option>
                                  <option value="Kerja/OJT">Kerja / OJT</option>
                                  <option value="Tugas Kampus">Tugas Kampus</option>
                                  <option value="MIA">MIA (Missing In Action)</option>
                                  <option value="Lainnya">Lainnya...</option>
                                </optgroup>
                              </select>
                              
                              {isMissing && missingReason && !['Sakit', 'Pulang Kampung', 'Kerja/OJT', 'Tugas Kampus', 'MIA'].includes(missingReason) && (
                                <input
                                  type="text"
                                  placeholder="Ketik alasan spesifik..."
                                  value={missingReason}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setMissingMembers(prev => prev.map(mm => mm.person_id === m.id ? { ...mm, reason: val } : mm));
                                  }}
                                  className="mt-2 w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 text-sm font-bold text-amber-900 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all shadow-sm"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* METRICS COUNTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reachout</label>
                  <div className="flex flex-col gap-3">
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                      onChange={e => {
                        const pid = e.target.value;
                        if (!pid) return;
                        const person = groupMembers.find(m => m.id === pid);
                        if (person && !reachoutMembers.some(r => r.person_id === pid)) {
                          setReachoutMembers([...reachoutMembers, { person_id: pid, person_name: person.full_name }]);
                        }
                        e.target.value = ""; // reset
                      }}
                    >
                      <option value="">+ Siapa yang Reachout?</option>
                      {groupMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                    {reachoutMembers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reachoutMembers.map(r => (
                          <span key={r.person_id} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-100 shadow-sm">
                            {r.person_name}
                            <button type="button" onClick={() => setReachoutMembers(prev => prev.filter(p => p.person_id !== r.person_id))} className="ml-2 hover:text-rose-500 transition-colors">
                              <IconX className="w-3.5 h-3.5" stroke={3} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Visitor Ibadah</label>
                  <input
                    type="number"
                    min="0"
                    value={sundayVisitorsCount}
                    onChange={e => setSundayVisitorsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-base text-slate-900 font-black text-center focus:outline-none focus:border-indigo-300 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <span>Baptis</span>
                    {baptismGoal > 0 && (
                      <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-md shadow-sm">
                        {groupTotalBaptisms}/{baptismGoal}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={baptismsCount}
                    onChange={e => setBaptismsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-base text-slate-900 font-black text-center focus:outline-none focus:border-indigo-300 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan Tambahan</label>
                <textarea
                  rows={3}
                  placeholder="Catatan perkembangan atau info khusus group..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopyWA}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <IconCopy className="w-5 h-5" stroke={2} />
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Copy WA Saja'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                >
                  <IconSend className="w-5 h-5" stroke={2} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Data & Copy WA'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* LIVE WHATSAPP TEMPLATE PREVIEW */}
          <div className="p-6 sm:p-8 rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 space-y-6 flex flex-col justify-between h-fit xl:sticky xl:top-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <IconSparkles className="w-5 h-5 text-amber-500" stroke={2} />
                  <span>Live Preview WA</span>
                </h3>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed select-all shadow-inner overflow-x-auto">
                {generateWAText()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-900 space-y-2 font-medium">
              <p className="font-bold text-amber-950">Database & Format WA:</p>
              <p>Klik <strong>Simpan Data & Copy WA</strong> untuk menyimpan laporan ke database Supabase sekaligus menyalin teks ke clipboard.</p>
            </div>
          </div>

        </div>
      ) : (
        /* VISUALIZATION & ANALYTICS TAB WITH RECHARTS */
        <div className="space-y-6">
          
          {/* ANALYTICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-2 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-indigo-400 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Laporan Tersimpan</span>
              <p className="text-4xl font-black text-slate-900 tabular-nums relative z-10">{stats.length}</p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Entri di Database</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-2 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-blue-400 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Disciples</span>
              <p className="text-4xl font-black text-slate-900 tabular-nums relative z-10">{totalDisciplesTracked}</p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Total Akumulasi</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-2 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-amber-400 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Reachout</span>
              <p className="text-4xl font-black text-amber-600 tabular-nums relative z-10">{totalReachoutsRecorded}</p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Jiwa Terjangkau</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-2 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-emerald-400 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Visitor / Baptis</span>
              <p className="text-4xl font-black text-emerald-600 tabular-nums relative z-10">
                {totalVisitorsRecorded} <span className="text-lg font-bold text-slate-400">/ {totalBaptismsRecorded}</span>
              </p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Ibadah & Acara</p>
            </div>

          </div>

          {/* RECHARTS INTERACTIVE TREND CHART */}
          <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <IconTrendingUp className="w-5 h-5 text-indigo-500" stroke={2} />
                <span>Grafik Tren Reachout & Visitor</span>
              </h3>
            </div>

            {chartData.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 py-16 text-center bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed">Belum ada data statistik mingguan di database untuk dibuatkan grafik.</p>
            ) : (
              <div className="w-full h-80 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReachout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 'bold', padding: '12px 16px' }} 
                      itemStyle={{ fontWeight: '800' }}
                    />
                    <Area type="monotone" dataKey="Reachout" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorReachout)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="Visitor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitor)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* RECENT SAVED STATS TABLE */}
          <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <IconHistory className="w-5 h-5 text-indigo-500" stroke={2} />
                <span>Riwayat Laporan Database</span>
              </h3>
            </div>

            {stats.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 py-12 text-center bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed">Belum ada entri statistik di database.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-100">
                <table className="w-full text-left border-collapse min-w-[700px] bg-white">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-5 py-4">Grup & Tanggal</th>
                      <th className="px-5 py-4 text-center">Disciple</th>
                      <th className="px-5 py-4 text-center">Missing</th>
                      <th className="px-5 py-4 text-center">Reachout</th>
                      <th className="px-5 py-4 text-center">Visitor</th>
                      <th className="px-5 py-4 text-center">Baptis</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-slate-900 text-sm tracking-tight">{s.group_name}</div>
                          <div className="font-black text-[10px] uppercase tracking-widest text-slate-400 mt-1">{new Date(s.week_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-black text-slate-700">{s.active_disciples_count}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest shadow-sm ${s.missing_ibadah_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                             {s.missing_ibadah_count}
                           </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-black text-slate-700">
                            {s.reachout_count} {s.reachouts_list && s.reachouts_list.length > 0 && (
                              <span className="block text-[9px] font-bold text-slate-400 max-w-[120px] mx-auto truncate mt-1" title={s.reachouts_list.map(r => r.person_name).join(', ')}>
                                {s.reachouts_list.map(r => r.person_name).join(', ')}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-black text-slate-700">{s.sunday_visitors_count}</td>
                        <td className="px-5 py-4 text-center font-black text-emerald-600">{s.baptisms_count}</td>
                        <td className="px-5 py-4 text-right">
                          {onDeleteStat && (isSuperAdmin || groups.find(g => g.id === s.group_id)?.leader_id === currentUser?.id) && (
                            <button
                              onClick={() => {
                                if (confirm('Yakin ingin menghapus statistik minggu ini?')) onDeleteStat(s.id);
                              }}
                              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all shadow-sm"
                              title="Hapus Laporan"
                            >
                              <IconTrash className="w-4 h-4" stroke={2} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

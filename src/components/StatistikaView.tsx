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
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER & SUB-TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <IconClipboardCheck className="w-7 h-7 text-[#b5852e] shrink-0" stroke={1.5} />
            <span>Statistika Minggu & Analisis Data</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Input data disciple mingguan, simpan ke database, dan visualisasikan grafik perkembangan ministry.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportStatsToCSV(stats)}
            className="btn-tactile px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
            title="Download CSV Excel"
          >
            <IconDownload className="w-3.5 h-3.5 text-slate-500" stroke={2} />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
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
                    {allowedGroups.map(g => (
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
                    <span>Belum ada anggota yang di-assign ke group ini.</span>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">Nama Disciple</th>
                            <th className="px-4 py-3 text-xs font-mono font-bold text-slate-600 uppercase tracking-wider min-w-[200px]">Kehadiran / Alasan Missing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {groupMembers.map(m => {
                            const isMissing = missingMembers.some(mm => mm.person_id === m.id);
                            const missingReason = missingMembers.find(mm => mm.person_id === m.id)?.reason || '';
                                                        
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="text-sm font-bold text-slate-900">{m.full_name}</span>
                                </td>
                                
                                <td className="px-4 py-3">
                                  <select
                                    value={isMissing ? (missingReason || 'Lainnya') : 'Hadir'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'Hadir') {
                                        setMissingMembers(prev => prev.filter(m => m.person_id !== m.id));
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
                                    className={`w-full text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none transition-colors border ${
                                      isMissing 
                                        ? 'bg-amber-50 text-amber-900 border-amber-200 focus:border-amber-400' 
                                        : 'bg-emerald-50/50 text-emerald-800 border-emerald-100 hover:bg-emerald-50'
                                    }`}
                                  >
                                    <option value="Hadir">✅ Hadir Ibadah</option>
                                    <optgroup label="Alasan Missing (Tidak Hadir)">
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
                                      className="mt-2 w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 focus:outline-none focus:border-amber-400 shadow-sm"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS VIEW */}
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                      {groupMembers.map(m => {
                        const isMissing = missingMembers.some(mm => mm.person_id === m.id);
                        const missingReason = missingMembers.find(mm => mm.person_id === m.id)?.reason || '';

                        return (
                          <div key={m.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                            <h4 className="font-bold text-slate-900 text-sm">{m.full_name}</h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <span className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Kehadiran & Alasan</span>
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
                                  className={`w-full text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none transition-colors border ${
                                    isMissing 
                                      ? 'bg-amber-50 text-amber-900 border-amber-200 focus:border-amber-400' 
                                      : 'bg-emerald-50/50 text-emerald-800 border-emerald-100 hover:bg-emerald-50'
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
                                    className="mt-2 w-full bg-white border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-900 focus:outline-none focus:border-amber-400 shadow-sm"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* METRICS COUNTERS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">Reachout</label>
                  <div className="flex flex-col gap-2">
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
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
                      <div className="flex flex-wrap gap-1">
                        {reachoutMembers.map(r => (
                          <span key={r.person_id} className="inline-flex items-center px-2 py-1 rounded bg-[#b5852e]/10 text-[#b5852e] text-[10px] font-bold border border-[#b5852e]/20">
                            {r.person_name}
                            <button type="button" onClick={() => setReachoutMembers(prev => prev.filter(p => p.person_id !== r.person_id))} className="ml-1 hover:text-red-500 transition-colors">
                              <IconX className="w-3 h-3" stroke={2} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <label className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">
                    <span>Baptis</span>
                    {baptismGoal > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded">
                        {groupTotalBaptisms}/{baptismGoal}
                      </span>
                    )}
                  </label>
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
        /* VISUALIZATION & ANALYTICS TAB WITH RECHARTS */
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

          {/* RECHARTS INTERACTIVE TREND CHART */}
          <div className="tugu-card p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <IconTrendingUp className="w-4 h-4 text-[#b5852e]" stroke={2} />
                <span>Grafik Tren Reachout & Visitor Minggu-ke-Minggu</span>
              </h3>
            </div>

            {chartData.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">Belum ada data statistik mingguan di database untuk dibuatkan grafik.</p>
            ) : (
              <div className="w-full h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReachout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b5852e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#b5852e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
                    />
                    <Area type="monotone" dataKey="Reachout" stroke="#b5852e" strokeWidth={2} fillOpacity={1} fill="url(#colorReachout)" />
                    <Area type="monotone" dataKey="Visitor" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitor)" />
                  </AreaChart>
                </ResponsiveContainer>
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
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[600px] bg-white">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3.5 font-bold">Grup & Tanggal</th>
                      <th className="px-4 py-3.5 font-bold text-center">Disciple</th>
                      <th className="px-4 py-3.5 font-bold text-center">Missing</th>
                      <th className="px-4 py-3.5 font-bold text-center">Reachout</th>
                      <th className="px-4 py-3.5 font-bold text-center">Visitor</th>
                      <th className="px-4 py-3.5 font-bold text-center">Baptis</th>
                      <th className="px-4 py-3.5 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-900 text-sm tracking-tight">{s.group_name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">{new Date(s.week_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-700">{s.active_disciples_count}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-widest ${s.missing_ibadah_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                             {s.missing_ibadah_count}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-700">
                            {s.reachout_count} {s.reachouts_list && s.reachouts_list.length > 0 && (
                              <span className="block text-[9px] font-medium text-slate-400 max-w-[100px] mx-auto truncate" title={s.reachouts_list.map(r => r.person_name).join(', ')}>
                                {s.reachouts_list.map(r => r.person_name).join(', ')}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{s.sunday_visitors_count}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{s.baptisms_count}</td>
                        <td className="px-4 py-3 text-right">
                          {onDeleteStat && (isSuperAdmin || groups.find(g => g.id === s.group_id)?.leader_id === currentUser?.id) && (
                            <button
                              onClick={() => onDeleteStat(s.id)}
                              className="btn-tactile p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-100"
                              title="Hapus Laporan"
                            >
                              <IconTrash className="w-4 h-4" stroke={1.5} />
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

import React, { useState, useEffect } from 'react';
import { Group, Person, WeeklyStat, MissingReason } from '@/lib/types';
import { fetchGroupMembers } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { IconCopy, IconSend, IconUsers, IconAlertCircle, IconX, IconSparkles } from '@tabler/icons-react';

interface Props {
  groups: Group[];
  stats: WeeklyStat[];
  onSaveStat: (stat: Omit<WeeklyStat, 'id'> & { id?: string }) => Promise<void>;
  onSuccess: () => void;
}

export default function StatistikaForm({ groups, stats, onSaveStat, onSuccess }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups.length > 0 ? groups[0].id : '');
  const getMostRecentSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };
  const [weekDate, setWeekDate] = useState<string>(getMostRecentSunday());
  
  const [groupMembers, setGroupMembers] = useState<Person[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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
      
      setMissingMembers([]);
      setReachoutMembers([]);
      setSundayVisitorsCount(0);
      setBaptismsCount(0);
      setNotes('');
      
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Group</label>
              <select 
                value={selectedGroupId} 
                onChange={e => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Ibadah Minggu</label>
              <input 
                type="date" 
                value={weekDate} 
                onChange={e => setWeekDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              <IconUsers className="w-4 h-4" stroke={2} />
              <span>Daftar Absensi Disciple</span>
            </label>
            {loadingMembers ? (
              <div className="animate-pulse flex flex-col gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full"></div>)}
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-sm font-bold text-slate-400 py-8 text-center bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed">
                Tidak ada anggota disciple di group ini.
              </div>
            ) : (
              <div className="bg-slate-50 p-2 sm:p-4 rounded-3xl border border-slate-100">
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {groupMembers.map(m => {
                    const missingData = missingMembers.find(mm => mm.person_id === m.id);
                    const isMissing = !!missingData;
                    const missingReason = missingData?.reason || '';
                    
                    return (
                      <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isMissing ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{m.full_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isMissing ? 'Missing' : 'Hadir'}</p>
                          </div>
                        </div>

                        <div className="flex-1 sm:max-w-xs">
                          <select
                            value={isMissing ? (['Sakit', 'Pulang Kampung', 'Kerja/OJT', 'Tugas Kampus', 'MIA'].includes(missingReason) ? missingReason : 'Lainnya') : 'Hadir'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'Hadir') {
                                setMissingMembers(prev => prev.filter(mm => mm.person_id !== m.id));
                              } else {
                                const reason = val === 'Lainnya' ? '' : val;
                                setMissingMembers(prev => {
                                  const existing = prev.find(mm => mm.person_id === m.id);
                                  if (existing) {
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
  );
}

'use client';

import { Person, Group, WeeklyStat } from '@/lib/types';
import { 
  IconUsers, 
  IconUsersGroup, 
  IconBook, 
  IconHeartHandshake, 
  IconPlus, 
  IconArrowRight, 
  IconAlertTriangle,
  IconHomeHeart
} from '@tabler/icons-react';

interface DashboardViewProps {
  people: Person[];
  groups: Group[];
  stats: WeeklyStat[];
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ people, groups, stats, onNavigate }: DashboardViewProps) {
  const totalPeople = people.length;
  const totalLeaders = people.filter(p => p.status === 'LEADER').length;
  const totalBibleStudies = people.filter(p => p.status === 'BIBLE_STUDY').length;
  
  const latestStats = stats.slice(0, 5);
  const totalReachouts = stats.reduce((acc, curr) => acc + (curr.reachout_count || 0), 0);
  const totalSundayVisitors = stats.reduce((acc, curr) => acc + (curr.sunday_visitors_count || 0), 0);
  const weakPeople = people.filter(p => p.status === 'WEAK' || p.status === 'INACTIVE');

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HERO BANNER - GKDI MOTTO */}
      <div className="tugu-card rounded-3xl p-6 sm:p-10 border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-slate-50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/60 text-xs font-semibold text-amber-900">
              <IconHomeHeart className="w-4 h-4 text-[#b5852e]" stroke={1.5} />
              <span>GKDI Jogja • Transisi Pilar ➔ Tugu</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Inilah Rumah Tuhan &<br />
              <span className="text-[#b5852e]">Kamu Semua Diundang</span>
            </h1>
            <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-normal">
              Pusat kelola data jemaat, mapping kelompok kecil (PDG), pelaporan Statistika Minggu 1-klik, dan koordinasi pelayanan ZEAL Tugu Jogja.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('statistika')}
              className="btn-tactile btn-primary"
            >
              <IconPlus className="w-4 h-4" stroke={2} />
              <span>Input Statistika</span>
            </button>
            <button
              onClick={() => onNavigate('people')}
              className="btn-tactile btn-secondary"
            >
              <span>Tambah Orang</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="tugu-card tugu-card-interactive p-5 rounded-2xl space-y-2 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total People</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <IconUsers className="w-4 h-4" stroke={1.5} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{totalPeople}</p>
          <p className="text-xs text-slate-500 font-medium">{totalLeaders} Leaders terdaftar</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-2xl space-y-2 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Small Groups</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <IconUsersGroup className="w-4 h-4" stroke={1.5} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{groups.length}</p>
          <p className="text-xs text-slate-500 font-medium">Brother & Sister PDG</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-2xl space-y-2 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Belajar Alkitab</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <IconBook className="w-4 h-4" stroke={1.5} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{totalBibleStudies}</p>
          <p className="text-xs text-slate-500 font-medium">Progres Murid & Stage</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-2xl space-y-2 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reachout</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <IconHeartHandshake className="w-4 h-4" stroke={1.5} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{totalReachouts}</p>
          <p className="text-xs text-slate-500 font-medium">{totalSundayVisitors} Visitor Ibadah</p>
        </div>

      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT STATS SUMMARY */}
        <div className="lg:col-span-2 tugu-card rounded-3xl p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Laporan Statistika Minggu Terbaru
            </h2>
            <button 
              onClick={() => onNavigate('statistika')} 
              className="btn-tactile text-xs text-[#b5852e] hover:text-amber-800 flex items-center space-x-1 font-bold"
            >
              <span>Lihat Semua</span>
              <IconArrowRight className="w-3.5 h-3.5" stroke={2} />
            </button>
          </div>

          {latestStats.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada statistik mingguan yang tersimpan.</p>
          ) : (
            <div className="space-y-2.5">
              {latestStats.map((st) => (
                <div key={st.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{st.group_name}</span>
                      <span className="text-xs font-mono text-slate-500">({st.week_date})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 tabular-nums">
                      Disciple: <strong className="text-slate-900">{st.active_disciples_count}</strong> | 
                      Missing: <strong className="text-amber-700">{st.missing_ibadah_count}</strong> | 
                      Reachout: <strong className="text-emerald-700">{st.reachout_count}</strong> | 
                      Visitor: <strong className="text-cyan-700">{st.sunday_visitors_count}</strong>
                    </p>
                  </div>
                  {st.study_progress && st.study_progress.length > 0 && (
                    <div className="text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-900 font-mono text-[11px] font-semibold border border-amber-200/60">
                        BA: {st.study_progress.map(s => `${s.person_name} (${s.stage})`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOLLOW UP / DISCIPLE CARE */}
        <div className="tugu-card rounded-3xl p-6 space-y-4 flex flex-col justify-between bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <IconAlertTriangle className="w-4 h-4 text-amber-600" stroke={1.5} />
                <span>Follow-up & Care</span>
              </h2>
            </div>
            
            <div className="space-y-2.5">
              {weakPeople.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Semua murid dalam kondisi baik!</p>
              ) : (
                weakPeople.map(p => (
                  <div key={p.id} className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{p.full_name}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono text-[10px] uppercase font-bold">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{p.notes || 'Perlu di-contact personal.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('people')}
            className="btn-tactile w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold text-center transition-colors block border border-slate-200"
          >
            Buka Direktori Orang
          </button>
        </div>

      </div>

    </div>
  );
}

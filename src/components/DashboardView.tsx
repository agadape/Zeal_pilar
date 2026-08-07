'use client';

import { Person, Group, WeeklyStat } from '@/lib/types';
import { 
  IconUsers, 
  IconUsersGroup, 
  IconBook, 
  IconHeartHandshake, 
  IconPlus, 
  IconArrowRight, 
  IconShieldCheck, 
  IconAlertTriangle 
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
      
      {/* HERO BANNER */}
      <div className="tugu-card rounded-2xl p-6 sm:p-8 border border-white/15 bg-zinc-900/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/10 border border-white/15 text-xs font-mono font-medium text-slate-300">
              <IconShieldCheck className="w-4 h-4 text-emerald-400" stroke={1.5} />
              <span>Transisi Pilar ➔ Tugu Jogja</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Tugu Leadership Portal
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Pusat kelola data jemaat, mapping kelompok kecil (PDG), pelaporan Statistika Minggu 1-klik, dan koordinasi jadwal pelayanan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
        
        <div className="tugu-card tugu-card-interactive p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total People</span>
            <IconUsers className="w-4 h-4 text-slate-300" stroke={1.5} />
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{totalPeople}</p>
          <p className="text-xs text-slate-400 font-medium">{totalLeaders} Leaders terdaftar</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Small Groups</span>
            <IconUsersGroup className="w-4 h-4 text-emerald-400" stroke={1.5} />
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{groups.length}</p>
          <p className="text-xs text-slate-400 font-medium">Brother & Sister PDG</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Belajar Alkitab</span>
            <IconBook className="w-4 h-4 text-amber-400" stroke={1.5} />
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{totalBibleStudies}</p>
          <p className="text-xs text-slate-400 font-medium">Progres Murid & Stage</p>
        </div>

        <div className="tugu-card tugu-card-interactive p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reachout</span>
            <IconHeartHandshake className="w-4 h-4 text-cyan-400" stroke={1.5} />
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{totalReachouts}</p>
          <p className="text-xs text-slate-400 font-medium">{totalSundayVisitors} Visitor Ibadah</p>
        </div>

      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT STATS SUMMARY */}
        <div className="lg:col-span-2 tugu-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white tracking-tight">
              Laporan Statistika Minggu Terbaru
            </h2>
            <button 
              onClick={() => onNavigate('statistika')} 
              className="btn-tactile text-xs text-slate-300 hover:text-white flex items-center space-x-1 font-semibold"
            >
              <span>Lihat Semua</span>
              <IconArrowRight className="w-3.5 h-3.5" stroke={1.5} />
            </button>
          </div>

          {latestStats.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada statistik mingguan yang tersimpan.</p>
          ) : (
            <div className="space-y-2.5">
              {latestStats.map((st) => (
                <div key={st.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{st.group_name}</span>
                      <span className="text-xs font-mono text-slate-400">({st.week_date})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 tabular-nums">
                      Disciple: <strong className="text-white">{st.active_disciples_count}</strong> | 
                      Missing: <strong className="text-amber-400">{st.missing_ibadah_count}</strong> | 
                      Reachout: <strong className="text-emerald-400">{st.reachout_count}</strong> | 
                      Visitor: <strong className="text-cyan-400">{st.sunday_visitors_count}</strong>
                    </p>
                  </div>
                  {st.study_progress && st.study_progress.length > 0 && (
                    <div className="text-xs">
                      <span className="px-2 py-1 rounded bg-white/10 text-white font-mono text-[11px]">
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
        <div className="tugu-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <IconAlertTriangle className="w-4 h-4 text-amber-400" stroke={1.5} />
                <span>Follow-up & Care</span>
              </h2>
            </div>
            
            <div className="space-y-2.5">
              {weakPeople.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Semua murid dalam kondisi baik!</p>
              ) : (
                weakPeople.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-slate-300">{p.notes || 'Perlu di-contact personal.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('people')}
            className="btn-tactile w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold text-center transition-colors block"
          >
            Buka Direktori Orang
          </button>
        </div>

      </div>

    </div>
  );
}

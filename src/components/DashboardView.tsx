'use client';

import { Person, Group, WeeklyStat } from '@/lib/types';
import { Users, UserCheck, HeartHandshake, Sparkles, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const totalWeak = people.filter(p => p.status === 'WEAK').length;
  
  const latestStats = stats.slice(0, 5);
  const totalReachouts = stats.reduce((acc, curr) => acc + (curr.reachout_count || 0), 0);
  const totalSundayVisitors = stats.reduce((acc, curr) => acc + (curr.sunday_visitors_count || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HERO BANNER */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 overflow-hidden border border-white/15 bg-gradient-to-r from-zinc-900 via-black to-zinc-900">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transisi Resmi: Pilar ➔ Tugu</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Tugu Leaders Portal
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base">
              Selamat datang di portal pelayanan ZEAL Jogja. Olah data jemaat (*Tambah Orang*), atur kelompok kecil (*PDG Groups*), dan kirim lapor *Statistika Minggu* dengan 1-klik!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('statistika')}
              className="btn-glow px-5 py-3 rounded-xl bg-white text-black font-bold text-sm flex items-center space-x-2 shadow-lg shadow-white/10 hover:bg-slate-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Statistika</span>
            </button>
            <button
              onClick={() => onNavigate('people')}
              className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              Tambah Orang
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total People</span>
            <Users className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-3xl font-black text-white">{totalPeople}</p>
          <p className="text-xs text-slate-400">{totalLeaders} Leaders registered</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Small Groups</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{groups.length}</p>
          <p className="text-xs text-slate-400">Brother & Sister PDGs</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Belajar Alkitab</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalBibleStudies}</p>
          <p className="text-xs text-amber-300/80">Progres Murid & Stage</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Reachout</span>
            <HeartHandshake className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalReachouts}</p>
          <p className="text-xs text-cyan-300/80">{totalSundayVisitors} Sunday Visitors</p>
        </div>

      </div>

      {/* QUICK SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT STATS SUMMARY */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Laporan Statistika Minggu Terbaru</span>
            </h2>
            <button 
              onClick={() => onNavigate('statistika')} 
              className="text-xs text-slate-300 hover:text-white flex items-center space-x-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {latestStats.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Belum ada statistik mingguan yang disimpan.</p>
          ) : (
            <div className="space-y-3">
              {latestStats.map((st) => (
                <div key={st.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{st.group_name}</span>
                      <span className="text-xs text-slate-400">({st.week_date})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Disciple: <strong className="text-white">{st.active_disciples_count}</strong> | 
                      Missing: <strong className="text-amber-400">{st.missing_ibadah_count}</strong> | 
                      Reachout: <strong className="text-emerald-400">{st.reachout_count}</strong> | 
                      Visitor: <strong className="text-cyan-400">{st.sunday_visitors_count}</strong>
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    {st.study_progress && st.study_progress.length > 0 && (
                      <span className="px-2 py-1 rounded bg-white/10 text-white font-medium">
                        BA: {st.study_progress.map(s => `${s.person_name} (${s.stage})`).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEAK & NEED CARE LIST */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Murid Butuh Follow-up</span>
          </h2>
          
          <div className="space-y-3">
            {people.filter(p => p.status === 'WEAK' || p.status === 'INACTIVE').length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Semua murid dalam kondisi baik!</p>
            ) : (
              people.filter(p => p.status === 'WEAK' || p.status === 'INACTIVE').map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{p.full_name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-300">{p.notes || 'Perlu didoakan dan di-contact.'}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('people')}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold text-center transition-colors block"
          >
            Buka Direktori Orang
          </button>
        </div>

      </div>

    </div>
  );
}

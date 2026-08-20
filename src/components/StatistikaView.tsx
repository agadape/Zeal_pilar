'use client';

import { useState } from 'react';
import { Group, Person, WeeklyStat } from '@/lib/types';
import { exportStatsToCSV } from '@/lib/exportUtils';
import { IconDownload, IconChartBar } from '@tabler/icons-react';

import StatistikaForm from './Statistika/StatistikaForm';
import StatistikaAnalytics from './Statistika/StatistikaAnalytics';
import StatistikaHistory from './Statistika/StatistikaHistory';

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

  // Analytics Metrics Calculation
  const totalDisciplesTracked = stats.reduce((acc, curr) => acc + (curr.active_disciples_count || 0), 0);
  const totalReachoutsRecorded = stats.reduce((acc, curr) => acc + (curr.reachout_count || 0), 0);
  const totalVisitorsRecorded = stats.reduce((acc, curr) => acc + (curr.sunday_visitors_count || 0), 0);
  const totalBaptismsRecorded = stats.reduce((acc, curr) => acc + (curr.baptisms_count || 0), 0);

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

          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setActiveSubTab('form')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeSubTab === 'form'
                  ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📝 Isi Laporan Mingguan
            </button>
            
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                activeSubTab === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconChartBar className="w-4 h-4 shrink-0" stroke={2} />
              <span>Visualisasi</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeSubTab === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/60 text-slate-500'
              }`}>
                {stats.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'form' ? (
        <StatistikaForm 
          groups={allowedGroups} 
          stats={stats} 
          onSaveStat={onSaveStat} 
          onSuccess={() => setActiveSubTab('analytics')} 
        />
      ) : (
        <div className="space-y-6">
          {/* ANALYTICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 sm:p-6 rounded-[2rem] bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2 tracking-tighter relative z-10">{totalDisciplesTracked}</p>
              <p className="text-xs text-indigo-200 font-bold relative z-10">Total Disciple Aktif</p>
            </div>
            
            <div className="p-5 sm:p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-blue-200 transition-colors">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-400 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-3xl sm:text-5xl font-black text-slate-800 mb-1 sm:mb-2 tracking-tighter relative z-10">{totalReachoutsRecorded}</p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Reachout Berhasil</p>
            </div>

            <div className="col-span-2 p-5 sm:p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-emerald-200 transition-colors">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-3xl sm:text-5xl font-black text-slate-800 mb-1 sm:mb-2 tracking-tighter flex items-baseline gap-2 relative z-10">
                {totalVisitorsRecorded} <span className="text-lg font-bold text-slate-400">/ {totalBaptismsRecorded}</span>
              </p>
              <p className="text-xs text-slate-500 font-bold relative z-10">Visitor Ibadah / Total Baptis</p>
            </div>
          </div>

          <StatistikaAnalytics stats={stats} />
          <StatistikaHistory 
            stats={stats} 
            groups={groups} 
            currentUser={currentUser} 
            onDeleteStat={onDeleteStat} 
          />
        </div>
      )}
    </div>
  );
}

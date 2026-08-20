import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IconTrendingUp } from '@tabler/icons-react';
import { WeeklyStat } from '@/lib/types';

interface Props {
  stats: WeeklyStat[];
}

export default function StatistikaAnalytics({ stats }: Props) {
  // Chart Data preparation
  const chartData = [...stats]
    .sort((a, b) => new Date(a.week_date).getTime() - new Date(b.week_date).getTime())
    .map(s => ({
      date: new Date(s.week_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      Reachout: s.reachout_count,
      Visitor: s.sunday_visitors_count + (s.event_visitors_count || 0)
    }));

  return (
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
  );
}

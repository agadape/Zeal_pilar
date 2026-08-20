import React from 'react';
import { IconHistory, IconTrash } from '@tabler/icons-react';
import { WeeklyStat, Group, Person } from '@/lib/types';

interface Props {
  stats: WeeklyStat[];
  groups: Group[];
  currentUser?: Person | null;
  onDeleteStat?: (id: string) => Promise<void>;
}

export default function StatistikaHistory({ stats, groups, currentUser, onDeleteStat }: Props) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
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
  );
}

import { useState, useEffect } from 'react';
import { Group, Person } from '@/lib/types';
import { fetchGroupMembers } from '@/lib/supabase';
import FormPanel from './FormPanel';
import { 
  IconUsersGroup, 
  IconEdit, 
  IconTrash, 
  IconShield,
  IconArrowsExchange,
  IconInfoCircle,
  IconUser
} from '@tabler/icons-react';

interface GroupDetailPanelProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (g: Group) => void;
  onManageMembers: (g: Group) => void;
  onHandover: (g: Group) => void;
  onDelete: (id: string) => void;
}

export default function GroupDetailPanel({ 
  group, 
  isOpen, 
  onClose, 
  onEdit, 
  onManageMembers, 
  onHandover, 
  onDelete 
}: GroupDetailPanelProps) {
  const [members, setMembers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setLoading(true);
      fetchGroupMembers(group.id).then(data => {
        setMembers(data);
        setLoading(false);
      });
    }
  }, [isOpen, group]);

  if (!group) return null;

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Kelompok"
      cancelLabel="Tutup"
    >
      <div className="space-y-6">
        
        {/* Header Profile */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{group.group_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${group.category === 'BROTHER' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-pink-50 text-pink-800 border-pink-200'}`}>
                {group.category} GROUP
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-slate-50 text-slate-600 border-slate-200">
                {members.length} Anggota
              </span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button 
              type="button"
              onClick={() => { onClose(); onEdit(group); }}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
              title="Edit Kelompok"
            >
              <IconEdit className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => { 
                if (confirm('Yakin ingin menghapus kelompok ini? Semua data statistik yang terhubung akan hilang.')) {
                  onDelete(group.id);
                  onClose();
                }
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 transition-colors"
              title="Hapus Kelompok"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leader Info */}
        <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase mb-0.5">Pemimpin Kelompok</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <IconShield className="w-4 h-4 text-[#b5852e]" />
              {group.leader_name || 'Belum Ada Leader'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); onHandover(group); }}
            className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <IconArrowsExchange className="w-3.5 h-3.5" /> Handover
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <IconUsersGroup className="w-4 h-4 text-[#b5852e]" />
              Daftar Anggota
            </h3>
            <button 
              type="button"
              onClick={() => { onClose(); onManageMembers(group); }}
              className="text-[10px] font-bold text-[#b5852e] hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
            >
              + Kelola Anggota
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 text-center py-4">Memuat anggota...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl">
              <IconUser className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Belum ada anggota di kelompok ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {members.map(m => (
                <div key={m.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.full_name}</p>
                    <p className="text-[10px] text-slate-500">{m.status} {m.campus ? `• ${m.campus}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </FormPanel>
  );
}

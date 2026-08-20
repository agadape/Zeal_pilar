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
  IconUser
} from '@tabler/icons-react';

interface GroupDetailPanelProps {
  group: Group | null;
  isOpen: boolean;
  currentUser?: Person | null;
  onClose: () => void;
  onEdit: (g: Group) => void;
  onManageMembers: (g: Group) => void;
  onHandover: (g: Group) => void;
  onDelete: (id: string) => void;
}

export default function GroupDetailPanel({ 
  group, 
  isOpen, 
  currentUser,
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

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isLeaderOfThisGroup = currentUser?.id === group.leader_id;
  const canEdit = isSuperAdmin || isLeaderOfThisGroup;

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Grup PDG"
      cancelLabel="Tutup"
    >
      <div className="space-y-6">
        
        {/* Header Profile */}
        <div className="flex items-start justify-between bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{group.group_name}</h2>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${group.category === 'BROTHER' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                {group.category} GROUP
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 shadow-sm border border-slate-200">
                {members.length} Anggota
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canEdit && (
              <button 
                type="button"
                onClick={() => { onClose(); onEdit(group); }}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-2xl text-indigo-600 transition-colors"
                title="Edit Grup PDG"
              >
                <IconEdit className="w-5 h-5" stroke={2} />
              </button>
            )}
            {isSuperAdmin && (
              <button 
                type="button"
                onClick={() => { 
                  if (confirm('Yakin ingin menghapus grup ini? Semua data statistik yang terhubung akan hilang.')) {
                    onDelete(group.id);
                    onClose();
                  }
                }}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 rounded-2xl text-rose-600 transition-colors"
                title="Hapus Grup PDG"
              >
                <IconTrash className="w-5 h-5" stroke={2} />
              </button>
            )}
          </div>
        </div>

        {/* Leader Info */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl flex items-center justify-between shadow-inner">
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pemimpin Grup PDG</p>
            <p className="text-base font-extrabold text-amber-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                <IconShield className="w-3.5 h-3.5" stroke={3} />
              </div>
              {group.leader_name || 'Belum Ada Leader'}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => { onClose(); onHandover(group); }}
              className="text-[10px] font-black text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors shadow-lg shadow-amber-500/30"
            >
              <IconArrowsExchange className="w-4 h-4" stroke={2} /> 
              <span>HANDOVER</span>
            </button>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <IconUsersGroup className="w-5 h-5 text-indigo-400" />
              Daftar Anggota
            </h3>
            {canEdit && (
              <button 
                type="button"
                onClick={() => { onClose(); onManageMembers(group); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                + Kelola Anggota
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm font-bold text-slate-500 text-center py-8">Memuat anggota...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border-2 border-slate-100 border-dashed rounded-[2rem]">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <IconUser className="w-6 h-6 text-slate-300" stroke={2} />
              </div>
              <p className="text-sm font-bold text-slate-500">Belum ada anggota di grup ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {members.map(m => (
                <div key={m.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${m.gender === 'BROTHER' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-rose-400 to-pink-500'}`}>
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{m.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.status} {m.campus ? `• ${m.campus}` : ''}</p>
                    </div>
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

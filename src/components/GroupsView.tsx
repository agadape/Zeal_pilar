import { useState, useEffect } from 'react';
import { Group, Person } from '@/lib/types';
import GroupDetailPanel from './GroupDetailPanel';
import { IconPlus, IconUsersGroup } from '@tabler/icons-react';

import GroupHandoverModal from './Groups/GroupHandoverModal';
import GroupFormModal from './Groups/GroupFormModal';
import GroupMembersModal from './Groups/GroupMembersModal';

interface GroupsViewProps {
  groups: Group[];
  people: Person[];
  currentUser?: Person | null;
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onHandoverLeadership?: (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export default function GroupsView({ groups, people, currentUser, onSaveGroup, onDeleteGroup, onHandoverLeadership, onRefreshData }: GroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [managingMembersGroup, setManagingMembersGroup] = useState<Group | null>(null);
  const [handoverGroup, setHandoverGroup] = useState<Group | null>(null);

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: Group) => {
    setEditingGroup(g);
    setIsGroupModalOpen(true);
  };

  const openManageMembersModal = (g: Group) => {
    setManagingMembersGroup(g);
  };

  const openHandoverModal = (g: Group) => {
    setHandoverGroup(g);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      
      {/* HEADER - Playful & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Grup PDG 🏕️
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Manajemen dan daftar grup kecil (PDG Brother/Sister).
          </p>
        </div>
        {(!currentUser || currentUser.role === 'SUPER_ADMIN') && (
          <button
            onClick={openAddGroupModal}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/30 flex items-center space-x-2 transition-transform hover:-translate-y-0.5 shrink-0"
          >
            <IconPlus className="w-5 h-5" stroke={2} />
            <span>Buat Grup Baru</span>
          </button>
        )}
      </div>

      {/* GROUPS GRID - Bento Box Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groups.map(g => (
          <div 
            key={g.id} 
            onClick={() => setSelectedGroup(g)}
            className="group p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-pointer flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${g.category === 'BROTHER' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  g.category === 'BROTHER' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                }`}>
                  {g.category}
                </span>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  <IconUsersGroup className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600">
                    {g.members_count || 0}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight line-clamp-2 leading-tight">{g.group_name}</h3>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100/80 relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs ${g.category === 'BROTHER' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-rose-400 to-pink-500'}`}>
                  {g.leader_name ? g.leader_name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Leader</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{g.leader_name || 'Belum Ada'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL PANEL MODAL */}
      <GroupDetailPanel 
        group={selectedGroup} 
        isOpen={!!selectedGroup} 
        currentUser={currentUser}
        onClose={() => setSelectedGroup(null)}
        onEdit={openEditGroupModal}
        onManageMembers={openManageMembersModal}
        onHandover={openHandoverModal}
        onDelete={onDeleteGroup}
      />

      {/* LEADER HANDOVER WIZARD MODAL */}
      {mounted && (
        <GroupHandoverModal
          handoverGroup={handoverGroup}
          people={people}
          onClose={() => setHandoverGroup(null)}
          onSubmit={onHandoverLeadership || (async () => {})}
          onSaveGroup={onSaveGroup}
          isLegacyOnHandover={!!onHandoverLeadership}
        />
      )}

      {/* CREATE / EDIT GROUP MODAL */}
      <GroupFormModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        editingGroup={editingGroup}
        people={people}
        onSaveGroup={onSaveGroup}
      />

      {/* MANAGE MEMBERS MODAL */}
      {mounted && (
        <GroupMembersModal
          managingMembersGroup={managingMembersGroup}
          people={people}
          onClose={() => setManagingMembersGroup(null)}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
}

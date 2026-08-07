'use client';

import { useState } from 'react';
import { Group, Person, Gender } from '@/lib/types';
import { fetchGroupMembers, updateGroupMembers } from '@/lib/supabase';
import { 
  IconUsersGroup, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconX, 
  IconCheck, 
  IconShield 
} from '@tabler/icons-react';

interface GroupsViewProps {
  groups: Group[];
  people: Person[];
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export default function GroupsView({ groups, people, onSaveGroup, onDeleteGroup }: GroupsViewProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Group Form
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState<Gender>('SISTER');
  const [leaderId, setLeaderId] = useState<string>('');

  // Member Assignment Modal
  const [managingMembersGroup, setManagingMembersGroup] = useState<Group | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setCategory('SISTER');
    setLeaderId('');
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: Group) => {
    setEditingGroup(g);
    setGroupName(g.group_name);
    setCategory(g.category);
    setLeaderId(g.leader_id || '');
    setIsGroupModalOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    await onSaveGroup({
      id: editingGroup?.id,
      group_name: groupName.trim(),
      category,
      leader_id: leaderId || undefined
    });
    setIsGroupModalOpen(false);
  };

  const openManageMembersModal = async (g: Group) => {
    setManagingMembersGroup(g);
    setLoadingMembers(true);
    try {
      const currentMembers = await fetchGroupMembers(g.id);
      setSelectedMemberIds(currentMembers.map(m => m.id));
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleToggleMember = (personId: string) => {
    if (selectedMemberIds.includes(personId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== personId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, personId]);
    }
  };

  const handleSaveMembers = async () => {
    if (!managingMembersGroup) return;
    await updateGroupMembers(managingMembersGroup.id, selectedMemberIds);
    setManagingMembersGroup(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Small Groups & Leaders</h1>
          <p className="text-xs sm:text-sm text-slate-400">Atur kelompok kecil (PDG Brother/Sister), tetapkan Pemimpin, dan mapping anggota kelompok.</p>
        </div>
        <button
          onClick={openAddGroupModal}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconPlus className="w-4 h-4" stroke={2} />
          <span>Buat Kelompok Baru</span>
        </button>
      </div>

      {/* GROUPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(g => (
          <div key={g.id} className="tugu-card tugu-card-interactive p-6 rounded-2xl space-y-4 relative flex flex-col justify-between border border-white/10">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border uppercase tracking-wider ${
                  g.category === 'BROTHER' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                }`}>
                  {g.category} GROUP
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditGroupModal(g)}
                    className="btn-tactile p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                  >
                    <IconEdit className="w-4 h-4" stroke={1.5} />
                  </button>
                  <button
                    onClick={() => onDeleteGroup(g.id)}
                    className="btn-tactile p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  >
                    <IconTrash className="w-4 h-4" stroke={1.5} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{g.group_name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                  <IconShield className="w-4 h-4 text-purple-400" stroke={1.5} />
                  <span>Pemimpin: <strong className="text-white">{g.leader_name}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => openManageMembersModal(g)}
                className="btn-tactile w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <IconUsersGroup className="w-4 h-4" stroke={1.5} />
                <span>Kelola Anggota Group</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* CREATE / EDIT GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tugu-card w-full max-w-md rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingGroup ? 'Edit Small Group' : 'Buat Small Group Baru'}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Nama Small Group *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Eve's Circle / Pelita"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Kategori *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Gender)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="SISTER">SISTER</option>
                  <option value="BROTHER">BROTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Tugaskan Pemimpin Group (Leader)</label>
                <select
                  value={leaderId}
                  onChange={e => setLeaderId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Pilih Leader dari User Table --</option>
                  {people
                    .filter(p => p.gender === category)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="btn-tactile btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Simpan Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {managingMembersGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tugu-card w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Anggota: {managingMembersGroup.group_name}</h3>
                <p className="text-xs text-slate-400">Pilih jemaat yang masuk ke dalam small group ini.</p>
              </div>
              <button onClick={() => setManagingMembersGroup(null)} className="text-slate-400 hover:text-white p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            {loadingMembers ? (
              <div className="py-12 text-center text-slate-400 text-xs font-mono">Memuat anggota group...</div>
            ) : (
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {people
                  .filter(p => p.gender === managingMembersGroup.category)
                  .map(p => {
                    const isSelected = selectedMemberIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleMember(p.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white/15 border-white text-white font-semibold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-white text-black border-white' : 'border-slate-500'
                          }`}>
                            {isSelected && <IconCheck className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold">{p.full_name}</span>
                            <span className="block text-[11px] font-mono text-slate-400">{p.status} {p.campus ? `• ${p.campus}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs font-mono text-slate-400">{selectedMemberIds.length} Anggota terpilih</span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setManagingMembersGroup(null)}
                  className="btn-tactile btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembers}
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Small Groups & Leaders</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Atur kelompok kecil (PDG Brother/Sister), tetapkan Pemimpin, dan mapping anggota kelompok.</p>
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
          <div key={g.id} className="tugu-card tugu-card-interactive p-6 rounded-3xl space-y-4 relative flex flex-col justify-between bg-white border border-slate-200">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border uppercase tracking-wider ${
                  g.category === 'BROTHER' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-pink-50 text-pink-800 border-pink-200'
                }`}>
                  {g.category} GROUP
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditGroupModal(g)}
                    className="btn-tactile p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
                  >
                    <IconEdit className="w-4 h-4" stroke={1.5} />
                  </button>
                  <button
                    onClick={() => onDeleteGroup(g.id)}
                    className="btn-tactile p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                  >
                    <IconTrash className="w-4 h-4" stroke={1.5} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{g.group_name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium mt-1">
                  <IconShield className="w-4 h-4 text-[#b5852e]" stroke={1.5} />
                  <span>Pemimpin: <strong className="text-slate-900">{g.leader_name}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openManageMembersModal(g)}
                className="btn-tactile w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-2 transition-colors border border-slate-200"
              >
                <IconUsersGroup className="w-4 h-4 text-slate-600" stroke={1.5} />
                <span>Kelola Anggota Group</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* CREATE / EDIT GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto sm:py-8">
          <div className="tugu-card w-full max-w-md rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGroup ? 'Edit Small Group' : 'Buat Small Group Baru'}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nama Small Group *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Eve's Circle / Pelita"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Kategori *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Gender)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                >
                  <option value="SISTER">SISTER</option>
                  <option value="BROTHER">BROTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Tugaskan Pemimpin Group (Leader)</label>
                <select
                  value={leaderId}
                  onChange={e => setLeaderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
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

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
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
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto sm:py-8">
          <div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl max-h-[85vh] flex flex-col my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Anggota: {managingMembersGroup.group_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Pilih jemaat yang masuk ke dalam small group ini.</p>
              </div>
              <button onClick={() => setManagingMembersGroup(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            {loadingMembers ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">Memuat anggota group...</div>
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
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/80 border-[#b5852e] text-slate-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-[#b5852e] text-white border-[#b5852e]' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <IconCheck className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold">{p.full_name}</span>
                            <span className="block text-[11px] font-mono text-slate-500">{p.status} {p.campus ? `• ${p.campus}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-mono text-slate-500 font-semibold">{selectedMemberIds.length} Anggota terpilih</span>
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

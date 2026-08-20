import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Group, Person, Gender } from '@/lib/types';
import { fetchGroupMembers, updateGroupMembers } from '@/lib/supabase';
import GroupDetailPanel from './GroupDetailPanel';
import FormPanel from './FormPanel';
import { 
  IconPlus, 
  IconX, 
  IconCheck, 
  IconShield,
  IconArrowsExchange,
  IconInfoCircle,
  IconUsersGroup
} from '@tabler/icons-react';

interface GroupsViewProps {
  groups: Group[];
  people: Person[];
  currentUser?: Person | null;
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onHandoverLeadership?: (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => Promise<void>;
}

export default function GroupsView({ groups, people, currentUser, onSaveGroup, onDeleteGroup, onHandoverLeadership }: GroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Group Form
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState<Gender>('SISTER');
  const [leaderId, setLeaderId] = useState<string>('');
  const [baptismGoal, setBaptismGoal] = useState<number>(5);

  // Member Assignment Modal
  const [managingMembersGroup, setManagingMembersGroup] = useState<Group | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Handover Modal
  const [handoverGroup, setHandoverGroup] = useState<Group | null>(null);
  const [newLeaderId, setNewLeaderId] = useState<string>('');
  const [handoverReason, setHandoverReason] = useState<string>('GRADUATED');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setCategory('SISTER');
    setLeaderId('');
    setBaptismGoal(5);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: Group) => {
    setEditingGroup(g);
    setGroupName(g.group_name);
    setCategory(g.category);
    setLeaderId(g.leader_id || '');
    setBaptismGoal(g.baptism_goal || 5);
    setIsGroupModalOpen(true);
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

  const openHandoverModal = (g: Group) => {
    setHandoverGroup(g);
    setNewLeaderId('');
    setHandoverReason('GRADUATED');
    setHandoverNotes('');
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setSubmittingGroup(true);
    try {
      await onSaveGroup({
        id: editingGroup?.id,
        group_name: groupName.trim(),
        category,
        leader_id: leaderId || undefined,
        baptism_goal: baptismGoal
      });
      setIsGroupModalOpen(false);
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverGroup || !newLeaderId) return;
    setSubmittingHandover(true);
    try {
      if (onHandoverLeadership) {
        await onHandoverLeadership({
          group_id: handoverGroup.id,
          new_leader_id: newLeaderId,
          reason: handoverReason,
          notes: handoverNotes.trim() || undefined
        });
      } else {
        await onSaveGroup({
          id: handoverGroup.id,
          group_name: handoverGroup.group_name,
          category: handoverGroup.category,
          leader_id: newLeaderId
        });
      }
      setHandoverGroup(null);
    } finally {
      setSubmittingHandover(false);
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
    if (typeof window !== 'undefined') window.location.reload();
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
      {mounted && handoverGroup && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end sm:justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setHandoverGroup(null)}></div>
          <div className="relative w-full max-w-md sm:rounded-[2rem] h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] bg-white shadow-2xl animate-slide-in-right sm:animate-fade-in flex flex-col overflow-hidden">
              
              <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <IconArrowsExchange className="w-6 h-6 text-indigo-500" stroke={2} />
                    <span>Handover Leader</span>
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{handoverGroup.group_name}</p>
                </div>
                <button type="button" onClick={() => setHandoverGroup(null)} className="text-slate-400 hover:text-slate-700 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                  <IconX className="w-5 h-5" stroke={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 custom-scrollbar">
                
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
                    <IconInfoCircle className="w-5 h-5 text-amber-600" stroke={2} />
                    <span>Leader: {handoverGroup.leader_name || 'Belum Ada'}</span>
                  </div>
                  <p className="text-xs text-amber-700/80 font-medium">
                    Statistik, log Belajar Alkitab, dan anggota akan tetap 100% utuh — hanya kepemimpinan yang dialihkan ke Leader baru.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Leader Baru *</label>
                    <select
                      required
                      value={newLeaderId}
                      onChange={e => setNewLeaderId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    >
                      <option value="">-- Pilih Leader Baru --</option>
                      {people
                        .filter(p => p.gender === handoverGroup.category && p.id !== handoverGroup.leader_id && p.status === 'LEADER')
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.campus || 'Umum'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Alasan Handover *</label>
                    <select
                      value={handoverReason}
                      onChange={e => setHandoverReason(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    >
                      <option value="GRADUATED">Lulus Kuliah / Wisuda</option>
                      <option value="RELOCATED">Pindah Kota / Pekerjaan</option>
                      <option value="ROTATION">Rotasi Terjadwal Ministry</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan Tambahan</label>
                    <textarea
                      rows={2}
                      placeholder="Pesan penggembalaan untuk leader baru..."
                      value={handoverNotes}
                      onChange={e => setHandoverNotes(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setHandoverGroup(null)}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleHandoverSubmit}
                  disabled={submittingHandover || !newLeaderId}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  <IconCheck className="w-5 h-5" stroke={2} />
                  <span>Konfirmasi Handover</span>
                </button>
              </div>

          </div>
        </div>,
        document.body
      )}

      {/* CREATE / EDIT GROUP MODAL */}
      <FormPanel
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? 'Edit Grup PDG' : 'Buat Grup Baru'}
        onSubmit={handleGroupSubmit}
        isSubmitDisabled={submittingGroup}
        submitLabel="Simpan Grup PDG"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Grup *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Eve's Circle / Pelita"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kategori *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Gender)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            >
              <option value="SISTER">SISTER 👧🏻</option>
              <option value="BROTHER">BROTHER 👦🏻</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pemimpin (Leader)</label>
            <select
              value={leaderId}
              onChange={e => setLeaderId(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            >
              <option value="">-- Pilih Leader --</option>
              {people
                .filter(p => p.gender === category && p.status === 'LEADER')
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.status})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Goal Baptisan</label>
            <input
              type="number"
              min="0"
              value={baptismGoal}
              onChange={e => setBaptismGoal(parseInt(e.target.value) || 0)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </FormPanel>

      {/* MANAGE MEMBERS MODAL */}
      {mounted && managingMembersGroup && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[85vh] overflow-hidden animate-fade-in">
            
            <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Kelola Anggota</h3>
                <p className="text-sm text-slate-500 font-medium">{managingMembersGroup.group_name}</p>
              </div>
              <button type="button" onClick={() => setManagingMembersGroup(null)} className="text-slate-400 hover:text-slate-700 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <IconX className="w-5 h-5" stroke={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar">
              {loadingMembers ? (
                <div className="py-12 text-center text-slate-500 text-sm font-bold">Memuat anggota group...</div>
              ) : (
                <div className="space-y-3">
                  {people
                    .filter(p => p.gender === managingMembersGroup.category)
                    .map(p => {
                      const isSelected = selectedMemberIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleMember(p.id)}
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 shadow-sm shadow-indigo-100'
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <IconCheck className="w-4 h-4" stroke={3} />}
                            </div>
                            <div>
                              <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{p.full_name}</span>
                              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.status} {p.campus ? `• ${p.campus}` : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{selectedMemberIds.length} Anggota Terpilih</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setManagingMembersGroup(null)}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembers}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  <IconCheck className="w-5 h-5" stroke={2} />
                  <span>Simpan</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

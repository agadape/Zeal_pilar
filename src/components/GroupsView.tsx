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
  } from '@tabler/icons-react';

interface GroupsViewProps {
  groups: Group[];
  people: Person[];
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onHandoverLeadership?: (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => Promise<void>;
}

export default function GroupsView({ groups, people, onSaveGroup, onDeleteGroup, onHandoverLeadership }: GroupsViewProps) {
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
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Grup PDG</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manajemen grup kecil (PDG Brother/Sister) dan anggotanya.</p>
        </div>
        <button
          onClick={openAddGroupModal}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconPlus className="w-4 h-4" stroke={2} />
          <span>Buat Grup Baru</span>
        </button>
      </div>

      {/* GROUPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map(g => (
          <div 
            key={g.id} 
            onClick={() => setSelectedGroup(g)}
            className="tugu-card tugu-card-interactive p-5 rounded-2xl space-y-4 relative flex flex-col justify-between bg-white border border-slate-200 cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${
                  g.category === 'BROTHER' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-pink-50 text-pink-800 border-pink-200'
                }`}>
                  {g.category}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {g.members_count || 0} Anggota
                </span>
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight line-clamp-1">{g.group_name}</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                  <IconShield className="w-4 h-4 text-[#b5852e]" stroke={1.5} />
                  <span className="truncate">Leader: <strong className="text-slate-900">{g.leader_name || '-'}</strong></span>
                </div>
                {g.baptism_goal && g.baptism_goal > 0 && (
                  <span className="text-[10px] font-bold text-[#b5852e] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Goal Baptis: {g.baptism_goal}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <span className="text-[#b5852e] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Buka Profil →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL PANEL MODAL */}
      <GroupDetailPanel 
        group={selectedGroup} 
        isOpen={!!selectedGroup} 
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
          <div className="relative w-full max-w-md sm:rounded-3xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] bg-white shadow-2xl animate-slide-in-right sm:animate-fade-in flex flex-col">
              
              <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <IconArrowsExchange className="w-5 h-5 text-[#b5852e]" stroke={2} />
                    <span>Handover Leader</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">{handoverGroup.group_name}</p>
                </div>
                <button type="button" onClick={() => setHandoverGroup(null)} className="text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full">
                  <IconX className="w-5 h-5" stroke={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 custom-scrollbar">
                
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1 font-medium">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                    <IconInfoCircle className="w-4 h-4 text-[#b5852e] shrink-0" stroke={1.5} />
                    <span>Leader Saat Ini: {handoverGroup.leader_name || 'Belum Ada'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Statistik, log Belajar Alkitab, dan anggota akan tetap 100% utuh — hanya kepemimpinan yang dialihkan ke Leader baru.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Pilih Leader Baru *</label>
                  <select
                    required
                    value={newLeaderId}
                    onChange={e => setNewLeaderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-[#b5852e]"
                  >
                    <option value="">-- Pilih Leader Baru dari Disciple --</option>
                    {people
                      .filter(p => p.gender === handoverGroup.category && p.id !== handoverGroup.leader_id && p.status === 'LEADER')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.status} • {p.campus || 'Umum'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Alasan Handover *</label>
                  <select
                    value={handoverReason}
                    onChange={e => setHandoverReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none font-medium"
                  >
                    <option value="GRADUATED">Lulus Kuliah / Wisuda</option>
                    <option value="RELOCATED">Pindah Kota / Pekerjaan</option>
                    <option value="ROTATION">Rotasi Terjadwal Ministry</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Pesan penggembalaan untuk leader baru..."
                    value={handoverNotes}
                    onChange={e => setHandoverNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 resize-none"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setHandoverGroup(null)}
                  className="btn-tactile btn-secondary px-4 py-2 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleHandoverSubmit}
                  disabled={submittingHandover || !newLeaderId}
                  className="btn-tactile btn-primary px-4 py-2 text-xs"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
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
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nama Grup *</label>
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
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Pemimpin (Leader)</label>
          <select
            value={leaderId}
            onChange={e => setLeaderId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
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
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Goal Baptisan</label>
          <input
            type="number"
            min="0"
            value={baptismGoal}
            onChange={e => setBaptismGoal(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
          />
        </div>
      </FormPanel>

      {/* MANAGE MEMBERS MODAL */}
      {mounted && managingMembersGroup && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="tugu-card w-full max-w-lg rounded-3xl bg-white shadow-xl flex flex-col max-h-[100dvh] sm:max-h-[85vh] overflow-hidden animate-fade-in">
            
            <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Kelola Anggota</h3>
                <p className="text-xs text-slate-500 font-medium">{managingMembersGroup.group_name}</p>
              </div>
              <button type="button" onClick={() => setManagingMembersGroup(null)} className="text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar">
              {loadingMembers ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">Memuat anggota group...</div>
              ) : (
                <div className="space-y-2">
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
            </div>

            <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-mono text-slate-500 font-semibold">{selectedMemberIds.length} Anggota</span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setManagingMembersGroup(null)}
                  className="btn-tactile btn-secondary px-4 py-2 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembers}
                  className="btn-tactile btn-primary px-4 py-2 text-xs"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
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

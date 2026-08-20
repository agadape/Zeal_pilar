import React, { useState, useEffect } from 'react';
import { Group, Person, Gender } from '@/lib/types';
import FormPanel from '../FormPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingGroup: Group | null;
  people: Person[];
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
}

export default function GroupFormModal({ isOpen, onClose, editingGroup, people, onSaveGroup }: Props) {
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState<Gender>('SISTER');
  const [leaderId, setLeaderId] = useState<string>('');
  const [baptismGoal, setBaptismGoal] = useState<number>(5);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setGroupName(editingGroup.group_name);
        setCategory(editingGroup.category);
        setLeaderId(editingGroup.leader_id || '');
        setBaptismGoal(editingGroup.baptism_goal || 5);
      } else {
        setGroupName('');
        setCategory('SISTER');
        setLeaderId('');
        setBaptismGoal(5);
      }
    }
  }, [isOpen, editingGroup]);

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
      onClose();
    } finally {
      setSubmittingGroup(false);
    }
  };

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingGroup ? 'Edit Grup PDG' : 'Buat Grup Baru'}
      onSubmit={handleGroupSubmit}
      isSubmitDisabled={submittingGroup}
      submitLabel={submittingGroup ? 'Menyimpan...' : 'Simpan Grup PDG'}
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
  );
}

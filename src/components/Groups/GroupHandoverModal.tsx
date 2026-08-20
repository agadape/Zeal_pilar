import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Group, Person } from '@/lib/types';
import { IconArrowsExchange, IconX, IconInfoCircle, IconCheck } from '@tabler/icons-react';

interface Props {
  handoverGroup: Group | null;
  people: Person[];
  onClose: () => void;
  onSubmit: (params: { group_id: string; new_leader_id: string; reason: string; notes?: string }) => Promise<void>;
  onSaveGroup: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>; // fallback
  isLegacyOnHandover?: boolean;
}

export default function GroupHandoverModal({ handoverGroup, people, onClose, onSubmit, onSaveGroup, isLegacyOnHandover }: Props) {
  const [newLeaderId, setNewLeaderId] = useState<string>('');
  const [handoverReason, setHandoverReason] = useState<string>('GRADUATED');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  if (!handoverGroup) return null;

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderId) return;
    setSubmittingHandover(true);
    try {
      if (isLegacyOnHandover) {
        await onSubmit({
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
      onClose();
    } finally {
      setSubmittingHandover(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end sm:justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md sm:rounded-[2rem] h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] bg-white shadow-2xl animate-slide-in-right sm:animate-fade-in flex flex-col overflow-hidden">
          
        <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <IconArrowsExchange className="w-6 h-6 text-indigo-500" stroke={2} />
              <span>Handover Leader</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">{handoverGroup.group_name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
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
            onClick={onClose}
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
  );
}

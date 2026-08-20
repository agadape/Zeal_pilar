import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Group, Person } from '@/lib/types';
import { fetchGroupMembers, updateGroupMembers } from '@/lib/supabase';
import { IconX, IconCheck } from '@tabler/icons-react';

interface Props {
  managingMembersGroup: Group | null;
  people: Person[];
  onClose: () => void;
  onRefreshData?: () => Promise<void>;
}

export default function GroupMembersModal({ managingMembersGroup, people, onClose, onRefreshData }: Props) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submittingMembers, setSubmittingMembers] = useState(false);

  useEffect(() => {
    if (managingMembersGroup) {
      let isMounted = true;
      setLoadingMembers(true);
      fetchGroupMembers(managingMembersGroup.id).then(currentMembers => {
        if (isMounted) {
          setSelectedMemberIds(currentMembers.map(m => m.id));
          setLoadingMembers(false);
        }
      });
      return () => { isMounted = false; };
    }
  }, [managingMembersGroup]);

  if (!managingMembersGroup) return null;

  const handleToggleMember = (personId: string) => {
    if (selectedMemberIds.includes(personId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== personId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, personId]);
    }
  };

  const handleSaveMembers = async () => {
    setSubmittingMembers(true);
    try {
      await updateGroupMembers(managingMembersGroup.id, selectedMemberIds);
      onClose();
      if (onRefreshData) {
        await onRefreshData();
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setSubmittingMembers(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[85vh] overflow-hidden animate-fade-in">
        
        <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Kelola Anggota</h3>
            <p className="text-sm text-slate-500 font-medium">{managingMembersGroup.group_name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <IconX className="w-5 h-5" stroke={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar">
          {loadingMembers ? (
            <div className="py-12 text-center text-slate-500 text-sm font-bold">Memuat anggota group...</div>
          ) : (
            <div className="space-y-3">
              {people
                .filter(p => p.gender === managingMembersGroup.category && p.id !== managingMembersGroup.leader_id)
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
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveMembers}
              disabled={submittingMembers}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <IconCheck className={`w-5 h-5 ${submittingMembers ? 'animate-spin' : ''}`} stroke={2} />
              <span>{submittingMembers ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

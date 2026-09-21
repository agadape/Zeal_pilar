'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck, IconCrown, IconX } from '@tabler/icons-react';
import { DTreeData, Group, Person } from '@/lib/types';
import { getDTreePersonGroupId } from '@/lib/dtree';

interface DTreeRootModalProps {
  isOpen: boolean;
  people: Person[];
  groups: Group[];
  data: DTreeData;
  onClose: () => void;
  onSave: (brotherRootId: string | null, sisterRootId: string | null) => Promise<void>;
}

export default function DTreeRootModal({
  isOpen,
  people,
  groups,
  data,
  onClose,
  onSave
}: DTreeRootModalProps) {
  const [brotherRootId, setBrotherRootId] = useState('');
  const [sisterRootId, setSisterRootId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setBrotherRootId(data.settings.brother_root_id || '');
    setSisterRootId(data.settings.sister_root_id || '');
    setError('');
  }, [data.settings, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const availablePeople = useMemo(() => people.filter(person => {
    if (person.archived_at) return false;
    const isCurrentRoot = person.id === data.settings.brother_root_id
      || person.id === data.settings.sister_root_id;
    return isCurrentRoot || !getDTreePersonGroupId(person.id, groups, data);
  }), [data, groups, people]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(brotherRootId || null, sisterRootId || null);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan Pemimpin Jemaat.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dtree-root-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-emerald-950/20 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between border-b border-emerald-100 bg-emerald-50/70 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
              <IconCrown className="h-5 w-5" stroke={1.8} />
            </div>
            <div>
              <h2 id="dtree-root-title" className="text-xl font-black tracking-tight text-slate-950">
                Pemimpin Jemaat
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Pasangan ini menjadi akar tetap seluruh d-Tree.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 active:scale-95"
          >
            <IconX className="h-5 w-5" stroke={2} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="space-y-2">
            <label htmlFor="brother-root" className="text-sm font-extrabold text-slate-800">
              Pemimpin jemaat laki-laki
            </label>
            <select
              id="brother-root"
              value={brotherRootId}
              onChange={event => setBrotherRootId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Belum dipilih</option>
              {availablePeople.filter(person => person.gender === 'BROTHER').map(person => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="sister-root" className="text-sm font-extrabold text-slate-800">
              Pemimpin jemaat perempuan
            </label>
            <select
              id="sister-root"
              value={sisterRootId}
              onChange={event => setSisterRootId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Belum dipilih</option>
              {availablePeople.filter(person => person.gender === 'SISTER').map(person => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>
          </div>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
            Pemimpin Jemaat harus aktif dan tidak boleh menjadi leader atau anggota grup.
          </p>
          {error && (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" onClick={onClose} className="btn-secondary btn-tactile">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !brotherRootId || !sisterRootId}
            className="btn-primary btn-tactile disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconCheck className="h-4 w-4" stroke={2.2} />
            {saving ? 'Menyimpan...' : 'Simpan pasangan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

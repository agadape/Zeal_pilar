'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconGitBranch,
  IconHistory,
  IconLink,
  IconPlus,
  IconShield,
  IconUser,
  IconUsers,
  IconX
} from '@tabler/icons-react';
import { DTreeData, Group, MentorshipRelationship, Person } from '@/lib/types';
import {
  getActiveMentorships,
  getDTreePersonGroupId,
  getInitials,
  getPersonDisplayName,
  getStageTone
} from '@/lib/dtree';
import { mentorshipLabel } from '@/lib/supabase';

type ModalTab = 'overview' | 'manage' | 'history';

interface DTreePersonModalProps {
  person: Person | null;
  people: Person[];
  groups: Group[];
  data: DTreeData;
  canManage: boolean;
  isRoot: boolean;
  isGroupLeader: boolean;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onSetPrimaryMentor: (menteeId: string, mentorId: string, reason?: string) => Promise<void>;
  onAddSecondaryMentor: (menteeId: string, mentorId: string) => Promise<void>;
  onEndMentorship: (relationshipId: string, reason?: string) => Promise<void>;
}

function PersonLink({ person, onClick }: { person?: Person; onClick: () => void }) {
  if (!person) return <span className="text-sm font-semibold text-slate-400">Data tidak ditemukan</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3 text-left active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-800">
        {getInitials(person)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold text-slate-800 group-hover:text-emerald-800">
          {getPersonDisplayName(person)}
        </span>
        <span className="block truncate text-xs font-medium text-slate-500">{person.full_name}</span>
      </span>
    </button>
  );
}

export default function DTreePersonModal({
  person,
  people,
  groups,
  data,
  canManage,
  isRoot,
  isGroupLeader,
  onClose,
  onSelectPerson,
  onSetPrimaryMentor,
  onAddSecondaryMentor,
  onEndMentorship
}: DTreePersonModalProps) {
  const activePersonId = person?.id;
  const [tab, setTab] = useState<ModalTab>('overview');
  const [primaryMentorId, setPrimaryMentorId] = useState('');
  const [secondaryMentorId, setSecondaryMentorId] = useState('');
  const [childId, setChildId] = useState('');
  const [reason, setReason] = useState('Penyesuaian struktur pembimbingan');
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activePersonId) return;
    setTab('overview');
    setPrimaryMentorId('');
    setSecondaryMentorId('');
    setChildId('');
    setReason('Penyesuaian struktur pembimbingan');
    setSubmitting('');
    setError('');
  }, [activePersonId]);

  useEffect(() => {
    if (!person) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, person]);

  const derived = useMemo(() => {
    if (!person) return null;
    const activeRelationships = getActiveMentorships(data);
    const peopleMap = new Map(people.map(item => [item.id, item]));
    const groupId = getDTreePersonGroupId(person.id, groups, data);
    const group = groups.find(item => item.id === groupId);
    const primary = activeRelationships.find(item =>
      item.mentee_id === person.id && item.relationship_type === 'PRIMARY'
    );
    const secondary = activeRelationships.filter(item =>
      item.mentee_id === person.id && item.relationship_type === 'SECONDARY'
    );
    const children = activeRelationships
      .filter(item => item.mentor_id === person.id && item.relationship_type === 'PRIMARY')
      .map(item => peopleMap.get(item.mentee_id))
      .filter((item): item is Person => Boolean(item) && !item?.archived_at);
    const history = data.relationships
      .filter(item => item.mentee_id === person.id && Boolean(item.ended_at))
      .sort((a, b) => (b.ended_at || '').localeCompare(a.ended_at || ''));
    const groupPeople = people.filter(item =>
      !item.archived_at
      && item.gender === person.gender
      && getDTreePersonGroupId(item.id, groups, data) === groupId
    );
    const activeMentorIds = new Set([
      primary?.mentor_id,
      ...secondary.map(item => item.mentor_id)
    ].filter(Boolean));
    const rootIds = new Set([
      data.settings.brother_root_id,
      data.settings.sister_root_id
    ].filter(Boolean));
    const leaderIds = new Set(groups.filter(item => !item.archived_at).map(item => item.leader_id).filter(Boolean));
    const menteesWithPrimary = new Set(
      activeRelationships
        .filter(item => item.relationship_type === 'PRIMARY')
        .map(item => item.mentee_id)
    );
    const primaryChildren = new Map<string, string[]>();
    activeRelationships
      .filter(item => item.relationship_type === 'PRIMARY')
      .forEach(item => {
        const children = primaryChildren.get(item.mentor_id) || [];
        children.push(item.mentee_id);
        primaryChildren.set(item.mentor_id, children);
      });
    const descendantIds = new Set<string>();
    const descendantQueue = [...(primaryChildren.get(person.id) || [])];
    while (descendantQueue.length > 0) {
      const descendantId = descendantQueue.shift()!;
      if (descendantIds.has(descendantId)) continue;
      descendantIds.add(descendantId);
      descendantQueue.push(...(primaryChildren.get(descendantId) || []));
    }

    return {
      peopleMap,
      group,
      groupId,
      primary,
      secondary,
      children,
      history,
      mentorCandidates: groupPeople.filter(item =>
        item.id !== person.id
        && !activeMentorIds.has(item.id)
        && !descendantIds.has(item.id)
      ),
      childCandidates: groupPeople.filter(item =>
        item.id !== person.id
        && !rootIds.has(item.id)
        && !leaderIds.has(item.id)
        && !menteesWithPrimary.has(item.id)
      )
    };
  }, [data, groups, people, person]);

  if (!person || !derived || typeof document === 'undefined') return null;

  const tone = getStageTone(person.study_stage);
  const runAction = async (key: string, action: () => Promise<void>) => {
    setSubmitting(key);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Perubahan d-Tree gagal disimpan.');
    } finally {
      setSubmitting('');
    }
  };

  const handleMove = () => {
    if (!primaryMentorId) return;
    const mentor = derived.peopleMap.get(primaryMentorId);
    if (!confirm(`Pindahkan ${person.full_name} ke bawah ${mentor?.full_name || 'pembimbing baru'}?`)) return;
    void runAction('primary', async () => {
      await onSetPrimaryMentor(person.id, primaryMentorId, reason);
      setPrimaryMentorId('');
    });
  };

  const handleAddChild = () => {
    if (!childId) return;
    const child = derived.peopleMap.get(childId);
    if (!confirm(`Tempatkan ${child?.full_name || 'anggota ini'} di bawah ${person.full_name}?`)) return;
    void runAction('child', async () => {
      await onSetPrimaryMentor(childId, person.id, 'Penempatan melalui d-Tree');
      setChildId('');
    });
  };

  const handleAddSecondary = () => {
    if (!secondaryMentorId) return;
    const mentor = derived.peopleMap.get(secondaryMentorId);
    if (!confirm(`Tambahkan ${mentor?.full_name || 'orang ini'} sebagai pembimbing pendamping?`)) return;
    void runAction('secondary', async () => {
      await onAddSecondaryMentor(person.id, secondaryMentorId);
      setSecondaryMentorId('');
    });
  };

  const renderRelationship = (relationship: MentorshipRelationship, allowEnd: boolean) => {
    const mentor = derived.peopleMap.get(relationship.mentor_id);
    return (
      <div key={relationship.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <PersonLink person={mentor} onClick={() => mentor && onSelectPerson(mentor)} />
        {allowEnd && canManage && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Akhiri relasi dengan ${mentor?.full_name || 'pembimbing ini'}?`)) return;
              void runAction(`end-${relationship.id}`, () => onEndMentorship(relationship.id));
            }}
            disabled={Boolean(submitting)}
            className="shrink-0 rounded-xl border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"
          >
            Lepaskan
          </button>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dtree-person-title"
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#fbfdfc] shadow-2xl shadow-emerald-950/20 sm:rounded-3xl"
      >
        <div className="relative overflow-hidden border-b border-emerald-100 bg-emerald-950 p-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border-[28px] border-emerald-800/50" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-200 text-base font-black text-emerald-950 shadow-lg shadow-emerald-950/30">
                {getInitials(person)}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-200">
                  {isRoot && <span>Pemimpin Jemaat</span>}
                  {isGroupLeader && <span>Leader Grup</span>}
                  {!isRoot && !isGroupLeader && <span>{person.status.replaceAll('_', ' ')}</span>}
                </div>
                <h2 id="dtree-person-title" className="truncate text-2xl font-black tracking-tight">
                  {getPersonDisplayName(person)}
                </h2>
                {person.nickname && <p className="mt-1 truncate text-sm font-medium text-emerald-100/80">{person.full_name}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="shrink-0 rounded-xl bg-white/10 p-2 text-emerald-50 transition hover:bg-white/20 active:scale-95"
            >
              <IconX className="h-5 w-5" stroke={2} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 pt-3 no-scrollbar">
          {([
            ['overview', 'Ringkasan', IconUser],
            ['manage', 'Kelola', IconGitBranch],
            ['history', 'Riwayat', IconHistory]
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-extrabold transition ${
                tab === id
                  ? 'bg-emerald-50 text-emerald-800 shadow-[inset_0_-2px_0_#047857]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" stroke={2} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">Grup</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{derived.group?.group_name || 'Di luar grup'}</p>
                </div>
                <div className={`rounded-2xl border p-4 ${tone.surface} ${tone.border}`}>
                  <p className="text-xs font-bold text-slate-500">Tahap pembimbingan</p>
                  <p className={`mt-1 line-clamp-2 text-sm font-black ${tone.accent}`}>{tone.label}</p>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <IconShield className="h-4 w-4 text-emerald-700" stroke={2} />
                  Pembimbing aktif
                </div>
                {isRoot ? (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                    Berada pada akar d-Tree sebagai Pemimpin Jemaat.
                  </p>
                ) : isGroupLeader ? (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                    Terhubung langsung ke Pemimpin Jemaat sesuai gender.
                  </p>
                ) : derived.primary ? (
                  renderRelationship(derived.primary, false)
                ) : (
                  <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                    Belum memiliki pembimbing utama dan tampil di panel Belum Ditempatkan.
                  </p>
                )}

                {derived.secondary.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-slate-500">Pembimbing pendamping</p>
                    {derived.secondary.map(item => renderRelationship(item, false))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <IconUsers className="h-4 w-4 text-emerald-700" stroke={2} />
                  Anak bimbingan ({derived.children.length})
                </div>
                {derived.children.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {derived.children.map(child => (
                      <div key={child.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <PersonLink person={child} onClick={() => onSelectPerson(child)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">Belum memiliki anak bimbingan langsung.</p>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <IconBook2 className="h-4 w-4 text-emerald-700" stroke={2} />
                  Progres Bible Academy
                </div>
                {person.study_history?.length ? (
                  <div className="space-y-2">
                    {person.study_history.slice(-4).reverse().map(log => (
                      <div key={log.id} className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-800">
                          {log.week_number}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold text-slate-800">{log.lesson_topic}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{log.study_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">Belum ada progres Bible Academy.</p>
                )}
              </section>
            </div>
          )}

          {tab === 'manage' && (
            <div className="space-y-6">
              {!canManage ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
                  Pengelolaan d-Tree hanya tersedia untuk Admin dan Leader.
                </p>
              ) : (
                <>
                  {!isRoot && !isGroupLeader && derived.groupId && (
                    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <IconArrowRight className="h-4 w-4 text-emerald-700" stroke={2} />
                        <h3 className="text-sm font-black text-slate-900">Pindahkan pembimbing utama</h3>
                      </div>
                      <label htmlFor="primary-mentor" className="block text-xs font-bold text-slate-600">Pembimbing baru</label>
                      <select
                        id="primary-mentor"
                        value={primaryMentorId}
                        onChange={event => setPrimaryMentorId(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="">Pilih pembimbing</option>
                        {derived.mentorCandidates.map(candidate => (
                          <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
                        ))}
                      </select>
                      <label htmlFor="move-reason" className="block text-xs font-bold text-slate-600">Alasan perubahan</label>
                      <input
                        id="move-reason"
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      />
                      <button
                        type="button"
                        onClick={handleMove}
                        disabled={!primaryMentorId || Boolean(submitting)}
                        className="btn-primary btn-tactile w-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <IconCheck className="h-4 w-4" stroke={2} />
                        {submitting === 'primary' ? 'Memindahkan...' : 'Konfirmasi perpindahan'}
                      </button>
                      {derived.primary && renderRelationship(derived.primary, true)}
                    </section>
                  )}

                  {derived.groupId && (
                    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <IconPlus className="h-4 w-4 text-emerald-700" stroke={2} />
                        <h3 className="text-sm font-black text-slate-900">Tambah anak bimbingan</h3>
                      </div>
                      <select
                        aria-label="Pilih anggota belum ditempatkan"
                        value={childId}
                        onChange={event => setChildId(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="">Pilih dari Belum Ditempatkan</option>
                        {derived.childCandidates.map(candidate => (
                          <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddChild}
                        disabled={!childId || Boolean(submitting)}
                        className="btn-primary btn-tactile w-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <IconPlus className="h-4 w-4" stroke={2} />
                        {submitting === 'child' ? 'Menempatkan...' : 'Tempatkan di bawah orang ini'}
                      </button>
                    </section>
                  )}

                  {!isRoot && !isGroupLeader && derived.groupId && (
                    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <IconLink className="h-4 w-4 text-emerald-700" stroke={2} />
                        <h3 className="text-sm font-black text-slate-900">Pembimbing pendamping</h3>
                      </div>
                      <select
                        aria-label="Pilih pembimbing pendamping"
                        value={secondaryMentorId}
                        onChange={event => setSecondaryMentorId(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="">Pilih pembimbing pendamping</option>
                        {derived.mentorCandidates.map(candidate => (
                          <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSecondary}
                        disabled={!secondaryMentorId || Boolean(submitting)}
                        className="btn-secondary btn-tactile w-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <IconPlus className="h-4 w-4" stroke={2} />
                        {submitting === 'secondary' ? 'Menambahkan...' : 'Tambah pendamping'}
                      </button>
                      {derived.secondary.map(item => renderRelationship(item, true))}
                    </section>
                  )}
                </>
              )}

              {error && (
                <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                  {error}
                </p>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              {derived.history.length > 0 ? derived.history.map(item => {
                const mentor = derived.peopleMap.get(item.mentor_id);
                return (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold text-emerald-700">{mentorshipLabel(item.relationship_type)}</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{mentor?.full_name || 'Data pembimbing dihapus'}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs font-bold text-slate-500">{item.started_at} sampai {item.ended_at}</span>
                    </div>
                    {item.end_reason && <p className="mt-3 text-sm font-medium text-slate-600">{item.end_reason}</p>}
                  </article>
                );
              }) : (
                <div className="py-12 text-center">
                  <IconHistory className="mx-auto h-9 w-9 text-slate-300" stroke={1.5} />
                  <p className="mt-3 text-sm font-bold text-slate-500">Belum ada riwayat perpindahan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

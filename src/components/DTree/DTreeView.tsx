'use client';

import { PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from 'react';
import {
  IconArrowsMove,
  IconBinaryTree,
  IconChevronDown,
  IconChevronRight,
  IconCrown,
  IconFocusCentered,
  IconGripVertical,
  IconHeartHandshake,
  IconInfoCircle,
  IconSearch,
  IconSettings,
  IconUserPlus,
  IconUsersGroup,
  IconZoomIn,
  IconZoomOut
} from '@tabler/icons-react';
import { DTreeData, Group, Person } from '@/lib/types';
import { isAdminPerson, isGroupLeaderPerson } from '@/lib/permissions';
import {
  getActiveMentorships,
  getDTreePersonGroupId,
  getInitials,
  getPersonDisplayName,
  getStageTone
} from '@/lib/dtree';
import DTreePersonModal from './DTreePersonModal';
import DTreeRootModal from './DTreeRootModal';

interface DTreeViewProps {
  people: Person[];
  groups: Group[];
  data: DTreeData;
  currentUser?: Person | null;
  onSaveRoots: (brotherRootId: string | null, sisterRootId: string | null) => Promise<void>;
  onSetPrimaryMentor: (menteeId: string, mentorId: string, reason?: string) => Promise<void>;
  onAddSecondaryMentor: (menteeId: string, mentorId: string) => Promise<void>;
  onEndMentorship: (relationshipId: string, reason?: string) => Promise<void>;
}

interface PersonNodeProps {
  person: Person;
  childCount: number;
  secondaryCount: number;
  collapsed: boolean;
  canCollapse: boolean;
  canManage: boolean;
  canDrag: boolean;
  highlighted: boolean;
  isLeader?: boolean;
  onClick: () => void;
  onToggle: () => void;
  onDropPerson: (menteeId: string, mentorId: string) => Promise<void>;
}

function PersonNode({
  person,
  childCount,
  secondaryCount,
  collapsed,
  canCollapse,
  canManage,
  canDrag,
  highlighted,
  isLeader,
  onClick,
  onToggle,
  onDropPerson
}: PersonNodeProps) {
  const [dropActive, setDropActive] = useState(false);
  const tone = getStageTone(person.study_stage);

  return (
    <div
      draggable={canManage && canDrag}
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-tugu-person', person.id);
      }}
      onDragOver={event => {
        if (!canManage) return;
        if (!event.dataTransfer.types.includes('application/x-tugu-person')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={event => {
        event.preventDefault();
        setDropActive(false);
        const menteeId = event.dataTransfer.getData('application/x-tugu-person');
        if (menteeId) void onDropPerson(menteeId, person.id);
      }}
      className={`dtree-person-node group relative mx-auto w-[214px] rounded-2xl border bg-white p-3 text-left shadow-sm transition duration-200 ${tone.border} ${
        highlighted ? 'ring-4 ring-amber-300 ring-offset-2' : ''
      } ${dropActive ? 'scale-[1.03] border-emerald-500 ring-4 ring-emerald-200' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/10'} ${
        canManage && canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {canManage && canDrag && (
        <IconGripVertical className="absolute right-2 top-2 h-4 w-4 text-slate-300" stroke={2} />
      )}
      <button type="button" onClick={onClick} className="w-full text-left">
        <span className="flex items-center gap-3 pr-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            isLeader ? 'bg-emerald-800 text-white' : `${tone.surface} ${tone.accent}`
          }`}>
            {getInitials(person)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-900">{getPersonDisplayName(person)}</span>
            <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-500">
              {isLeader ? 'Leader grup' : tone.label}
            </span>
          </span>
        </span>
        <span className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 text-[10px] font-extrabold text-slate-500">
          <span>{childCount} anak bimbingan</span>
          {secondaryCount > 0 && <span>{secondaryCount} pendamping</span>}
        </span>
      </button>

      {canCollapse && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onToggle();
          }}
          aria-label={collapsed ? 'Buka cabang' : 'Tutup cabang'}
          className="absolute -bottom-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-95"
        >
          {collapsed
            ? <IconChevronRight className="h-4 w-4" stroke={2.4} />
            : <IconChevronDown className="h-4 w-4" stroke={2.4} />}
        </button>
      )}
    </div>
  );
}

interface TreeBranchProps {
  person: Person;
  childrenByMentor: Map<string, Person[]>;
  secondaryCountByPerson: Map<string, number>;
  collapsedIds: Set<string>;
  canManage: boolean;
  leaderId?: string;
  query: string;
  path?: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDropPerson: (menteeId: string, mentorId: string) => Promise<void>;
}

function TreeBranch({
  person,
  childrenByMentor,
  secondaryCountByPerson,
  collapsedIds,
  canManage,
  leaderId,
  query,
  path = new Set(),
  onSelect,
  onToggle,
  onDropPerson
}: TreeBranchProps) {
  if (path.has(person.id)) return null;
  const nextPath = new Set(path);
  nextPath.add(person.id);
  const children = (childrenByMentor.get(person.id) || []).filter(child => !nextPath.has(child.id));
  const collapsed = collapsedIds.has(person.id);
  const normalizedQuery = query.trim().toLowerCase();
  const highlighted = normalizedQuery.length > 1
    && `${person.full_name} ${person.nickname || ''}`.toLowerCase().includes(normalizedQuery);

  return (
    <li>
      <PersonNode
        person={person}
        childCount={children.length}
        secondaryCount={secondaryCountByPerson.get(person.id) || 0}
        collapsed={collapsed}
        canCollapse={children.length > 0}
        canManage={canManage}
        canDrag={person.id !== leaderId}
        highlighted={highlighted}
        isLeader={person.id === leaderId}
        onClick={() => onSelect(person.id)}
        onToggle={() => onToggle(person.id)}
        onDropPerson={onDropPerson}
      />
      {children.length > 0 && !collapsed && (
        <ul>
          {children.map(child => (
            <TreeBranch
              key={child.id}
              person={child}
              childrenByMentor={childrenByMentor}
              secondaryCountByPerson={secondaryCountByPerson}
              collapsedIds={collapsedIds}
              canManage={canManage}
              leaderId={leaderId}
              query={query}
              path={nextPath}
              onSelect={onSelect}
              onToggle={onToggle}
              onDropPerson={onDropPerson}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function RootCard({ person, gender, onClick }: { person?: Person; gender: 'BROTHER' | 'SISTER'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!person}
      className={`relative flex min-h-[104px] w-[230px] items-center gap-3 rounded-2xl border p-4 text-left shadow-lg transition active:scale-[0.99] ${
        person
          ? 'border-emerald-700 bg-emerald-900 text-white shadow-emerald-950/20 hover:-translate-y-0.5'
          : 'cursor-default border-dashed border-slate-300 bg-white text-slate-500 shadow-slate-200/60'
      }`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${person ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-100 text-slate-400'}`}>
        {person ? <span className="text-sm font-black">{getInitials(person)}</span> : <IconCrown className="h-5 w-5" stroke={1.8} />}
      </span>
      <span className="min-w-0">
        <span className={`block text-[10px] font-extrabold ${person ? 'text-emerald-200' : 'text-slate-400'}`}>
          Pemimpin Jemaat {gender === 'BROTHER' ? 'Brother' : 'Sister'}
        </span>
        <span className="mt-1 block truncate text-sm font-black">{person ? getPersonDisplayName(person) : 'Belum dipilih'}</span>
        {person?.nickname && <span className="mt-0.5 block truncate text-[11px] font-medium text-emerald-100/70">{person.full_name}</span>}
      </span>
    </button>
  );
}

export default function DTreeView({
  people,
  groups,
  data,
  currentUser,
  onSaveRoots,
  onSetPrimaryMentor,
  onAddSecondaryMentor,
  onEndMentorship
}: DTreeViewProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [rootModalOpen, setRootModalOpen] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [unplacedGroupId, setUnplacedGroupId] = useState('ALL');
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ active: false, pointerId: 0, lastX: 0, lastY: 0 });

  const activePeople = useMemo(() => people.filter(person => !person.archived_at), [people]);
  const peopleMap = useMemo(() => new Map(activePeople.map(person => [person.id, person])), [activePeople]);
  const activeGroups = useMemo(() => groups.filter(group => !group.archived_at), [groups]);
  const rootIds = useMemo(() => new Set([
    data.settings.brother_root_id,
    data.settings.sister_root_id
  ].filter((id): id is string => Boolean(id))), [data.settings]);
  const leaderIds = useMemo(() => new Set(
    activeGroups.map(group => group.leader_id).filter((id): id is string => Boolean(id))
  ), [activeGroups]);

  const treeData = useMemo(() => {
    const activeRelationships = getActiveMentorships(data);
    const primaryRelationships = activeRelationships.filter(item => item.relationship_type === 'PRIMARY');
    const childrenByMentor = new Map<string, Person[]>();
    const secondaryCountByPerson = new Map<string, number>();

    primaryRelationships.forEach(relationship => {
      const child = peopleMap.get(relationship.mentee_id);
      if (!child) return;
      const children = childrenByMentor.get(relationship.mentor_id) || [];
      children.push(child);
      children.sort((a, b) => getPersonDisplayName(a).localeCompare(getPersonDisplayName(b), 'id'));
      childrenByMentor.set(relationship.mentor_id, children);
    });
    activeRelationships
      .filter(item => item.relationship_type === 'SECONDARY')
      .forEach(item => secondaryCountByPerson.set(
        item.mentee_id,
        (secondaryCountByPerson.get(item.mentee_id) || 0) + 1
      ));

    const placedMenteeIds = new Set(primaryRelationships.map(item => item.mentee_id));
    const unplaced = activePeople.filter(person =>
      !rootIds.has(person.id)
      && !leaderIds.has(person.id)
      && !placedMenteeIds.has(person.id)
    );

    return { childrenByMentor, secondaryCountByPerson, unplaced };
  }, [activePeople, data, leaderIds, peopleMap, rootIds]);

  const selectedPerson = selectedPersonId ? peopleMap.get(selectedPersonId) || null : null;
  const selectedIsRoot = selectedPerson ? rootIds.has(selectedPerson.id) : false;
  const selectedIsLeader = selectedPerson ? leaderIds.has(selectedPerson.id) : false;
  const canManage = isGroupLeaderPerson(currentUser);
  const canConfigureRoots = isAdminPerson(currentUser);
  const brotherRoot = data.settings.brother_root_id ? peopleMap.get(data.settings.brother_root_id) : undefined;
  const sisterRoot = data.settings.sister_root_id ? peopleMap.get(data.settings.sister_root_id) : undefined;

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return activePeople
      .filter(person => `${person.full_name} ${person.nickname || ''}`.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [activePeople, query]);

  const visibleUnplaced = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return treeData.unplaced.filter(person => {
      const groupId = getDTreePersonGroupId(person.id, activeGroups, data);
      const matchesGroup = unplacedGroupId === 'ALL'
        || (unplacedGroupId === 'NONE' ? !groupId : groupId === unplacedGroupId);
      const matchesQuery = normalized.length < 2
        || `${person.full_name} ${person.nickname || ''}`.toLowerCase().includes(normalized);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroups, data, query, treeData.unplaced, unplacedGroupId]);

  const applyTransform = () => {
    const world = worldRef.current;
    if (!world) return;
    const { x, y, scale } = transformRef.current;
    world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round(scale * 100)}%`;
  };

  const changeZoom = (delta: number) => {
    transformRef.current.scale = Math.min(1.5, Math.max(0.5, transformRef.current.scale + delta));
    applyTransform();
  };

  const resetCanvas = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    applyTransform();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, [draggable="true"]')) return;
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.lastX;
    const dy = event.clientY - dragRef.current.lastY;
    dragRef.current.lastX = event.clientX;
    dragRef.current.lastY = event.clientY;
    transformRef.current.x += dx;
    transformRef.current.y += dy;
    applyTransform();
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    event.currentTarget.style.cursor = 'grab';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleDropPerson = async (menteeId: string, mentorId: string) => {
    if (!canManage || menteeId === mentorId) return;
    const mentee = peopleMap.get(menteeId);
    const mentor = peopleMap.get(mentorId);
    if (!mentee || !mentor) return;
    if (rootIds.has(menteeId) || leaderIds.has(menteeId)) {
      alert('Pemimpin Jemaat dan leader grup tidak dapat dipindahkan sebagai anak bimbingan.');
      return;
    }
    const menteeGroupId = getDTreePersonGroupId(menteeId, activeGroups, data);
    const mentorGroupId = getDTreePersonGroupId(mentorId, activeGroups, data);
    if (!menteeGroupId || menteeGroupId !== mentorGroupId) {
      alert('Pembimbing dan anggota harus berada dalam grup yang sama.');
      return;
    }
    if (mentee.gender !== mentor.gender) {
      alert('Pembimbing dan anggota harus memiliki gender yang sama.');
      return;
    }
    if (!confirm(`Pindahkan ${mentee.full_name} ke bawah ${mentor.full_name}?`)) return;
    try {
      await onSetPrimaryMentor(menteeId, mentorId, 'Dipindahkan dengan drag and drop');
    } catch {
      // Root mutation handler already surfaces the database message to the user.
    }
  };

  const toggleCollapsed = (personId: string) => {
    setCollapsedIds(previous => {
      const next = new Set(previous);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  const renderGroup = (group: Group) => {
    const leader = group.leader_id ? peopleMap.get(group.leader_id) : undefined;
    return (
      <section key={group.id} className="dtree-group-branch">
        <div className="mb-6 flex items-center justify-center gap-2">
          <IconUsersGroup className="h-4 w-4 text-emerald-700" stroke={1.8} />
          <h3 className="text-sm font-black text-slate-800">{group.group_name}</h3>
        </div>
        {leader ? (
          <ul className="dtree-tree">
            <TreeBranch
              person={leader}
              childrenByMentor={treeData.childrenByMentor}
              secondaryCountByPerson={treeData.secondaryCountByPerson}
              collapsedIds={collapsedIds}
              canManage={canManage}
              leaderId={leader.id}
              query={query}
              onSelect={setSelectedPersonId}
              onToggle={toggleCollapsed}
              onDropPerson={handleDropPerson}
            />
          </ul>
        ) : (
          <div className="mx-auto flex min-h-28 w-[214px] items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-xs font-bold text-amber-900">
            Grup belum memiliki leader
          </div>
        )}
      </section>
    );
  };

  if (data.migration_required) {
    return (
      <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl shadow-slate-200/40">
        <div className="border-b border-amber-100 bg-amber-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <IconBinaryTree className="h-6 w-6" stroke={1.8} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">d-Tree belum diaktifkan</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600">
                Jalankan file supabase_dtree.sql melalui Supabase SQL Editor, lalu tekan Refresh.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-700">
            <IconBinaryTree className="h-4 w-4" stroke={2} />
            Pohon pembimbingan
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">d-Tree</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            Lihat alur pembimbingan dari Pemimpin Jemaat hingga setiap generasi dalam satu kanvas.
          </p>
        </div>
        {canConfigureRoots && (
          <button
            type="button"
            onClick={() => setRootModalOpen(true)}
            className="btn-secondary btn-tactile self-start lg:self-auto"
          >
            <IconSettings className="h-4 w-4" stroke={2} />
            Atur Pemimpin Jemaat
          </button>
        )}
      </header>

      <div className="relative z-20 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke={2} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Cari nama di d-Tree"
              aria-label="Cari nama di d-Tree"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                {searchResults.map(person => {
                  const groupId = getDTreePersonGroupId(person.id, activeGroups, data);
                  const group = activeGroups.find(item => item.id === groupId);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        setSelectedPersonId(person.id);
                        setQuery('');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-emerald-50 active:scale-[0.99]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-800">
                        {getInitials(person)}
                      </span>
                      <span>
                        <span className="block text-sm font-extrabold text-slate-900">{person.full_name}</span>
                        <span className="block text-xs font-medium text-slate-500">{group?.group_name || 'Belum memiliki grup'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <IconInfoCircle className="h-4 w-4 text-emerald-700" stroke={2} />
            Klik node untuk melihat detail. Geser kanvas untuk menjelajah.
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-[#f7fbf8] shadow-xl shadow-emerald-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-white/90 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <IconArrowsMove className="h-4 w-4 text-emerald-700" stroke={2} />
              Drag area kosong untuk menggeser
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => changeZoom(-0.1)} aria-label="Perkecil" className="rounded-lg p-2 text-slate-600 hover:bg-white hover:text-emerald-800 active:scale-95">
                <IconZoomOut className="h-4 w-4" stroke={2} />
              </button>
              <span ref={zoomLabelRef} className="w-12 text-center text-xs font-black text-slate-600">100%</span>
              <button type="button" onClick={() => changeZoom(0.1)} aria-label="Perbesar" className="rounded-lg p-2 text-slate-600 hover:bg-white hover:text-emerald-800 active:scale-95">
                <IconZoomIn className="h-4 w-4" stroke={2} />
              </button>
              <button type="button" onClick={resetCanvas} aria-label="Atur ulang kanvas" className="rounded-lg p-2 text-slate-600 hover:bg-white hover:text-emerald-800 active:scale-95">
                <IconFocusCentered className="h-4 w-4" stroke={2} />
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="dtree-viewport min-h-[660px] cursor-grab overflow-hidden touch-none select-none"
          >
            <div ref={worldRef} className="dtree-world min-w-[1120px] px-10 pb-24 pt-12">
              <div className="dtree-root-pair mx-auto flex w-fit items-center justify-center gap-12">
                <RootCard person={brotherRoot} gender="BROTHER" onClick={() => brotherRoot && setSelectedPersonId(brotherRoot.id)} />
                <div className="dtree-pair-link" aria-hidden="true">
                  <span><IconHeartHandshake className="h-4 w-4" stroke={2} /></span>
                </div>
                <RootCard person={sisterRoot} gender="SISTER" onClick={() => sisterRoot && setSelectedPersonId(sisterRoot.id)} />
              </div>

              <div className="dtree-main-trunk" aria-hidden="true" />

              <div className="grid grid-cols-2 items-start gap-10">
                {(['BROTHER', 'SISTER'] as const).map(gender => {
                  const genderGroups = activeGroups.filter(group => group.category === gender);
                  return (
                    <div key={gender} className="min-w-0">
                      <div className="mx-auto mb-8 w-fit rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900">
                        Cabang {gender === 'BROTHER' ? 'Brother' : 'Sister'}
                      </div>
                      {genderGroups.length > 0 ? (
                        <div className="flex items-start justify-center gap-8">
                          {genderGroups.map(renderGroup)}
                        </div>
                      ) : (
                        <div className="mx-auto w-64 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs font-bold text-slate-500">
                          Belum ada grup {gender === 'BROTHER' ? 'Brother' : 'Sister'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex max-h-[760px] flex-col overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl shadow-amber-950/5 xl:sticky xl:top-28">
          <div className="border-b border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <IconUserPlus className="h-5 w-5" stroke={2} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Belum Ditempatkan</h2>
                <p className="text-xs font-semibold text-amber-900/70">{visibleUnplaced.length} orang ditampilkan</p>
              </div>
            </div>
            <select
              value={unplacedGroupId}
              onChange={event => setUnplacedGroupId(event.target.value)}
              aria-label="Filter grup anggota belum ditempatkan"
              className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            >
              <option value="ALL">Semua grup</option>
              <option value="NONE">Belum punya grup</option>
              {activeGroups.map(group => <option key={group.id} value={group.id}>{group.group_name}</option>)}
            </select>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {visibleUnplaced.length > 0 ? visibleUnplaced.map(person => {
              const groupId = getDTreePersonGroupId(person.id, activeGroups, data);
              const group = activeGroups.find(item => item.id === groupId);
              return (
                <div
                  key={person.id}
                  draggable={canManage && Boolean(groupId)}
                  onDragStart={event => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('application/x-tugu-person', person.id);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-amber-300 hover:bg-amber-50/50 ${canManage && groupId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {canManage && groupId && <IconGripVertical className="h-4 w-4 shrink-0 text-slate-300" stroke={2} />}
                  <button type="button" onClick={() => setSelectedPersonId(person.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-black text-amber-900">
                      {getInitials(person)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-slate-900">{getPersonDisplayName(person)}</span>
                      <span className="block truncate text-[11px] font-semibold text-slate-500">{group?.group_name || 'Belum punya grup'}</span>
                    </span>
                  </button>
                </div>
              );
            }) : (
              <div className="px-4 py-12 text-center">
                <IconBinaryTree className="mx-auto h-9 w-9 text-emerald-300" stroke={1.5} />
                <p className="mt-3 text-sm font-black text-slate-700">Semua sudah ditempatkan</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Tidak ada anggota yang cocok dengan filter.</p>
              </div>
            )}
          </div>

          {canManage && (
            <div className="border-t border-amber-100 bg-amber-50/60 p-4 text-xs font-semibold leading-relaxed text-amber-900">
              Drag anggota ke node pembimbing, atau klik anggota untuk mengaturnya lewat popup.
            </div>
          )}
        </aside>
      </div>

      <DTreeRootModal
        isOpen={rootModalOpen}
        people={activePeople}
        groups={activeGroups}
        data={data}
        onClose={() => setRootModalOpen(false)}
        onSave={onSaveRoots}
      />

      <DTreePersonModal
        person={selectedPerson}
        people={activePeople}
        groups={activeGroups}
        data={data}
        canManage={canManage}
        isRoot={selectedIsRoot}
        isGroupLeader={selectedIsLeader}
        onClose={() => setSelectedPersonId(null)}
        onSelectPerson={person => setSelectedPersonId(person.id)}
        onSetPrimaryMentor={onSetPrimaryMentor}
        onAddSecondaryMentor={onAddSecondaryMentor}
        onEndMentorship={onEndMentorship}
      />
    </section>
  );
}

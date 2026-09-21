import { DTreeData, Group, MentorshipRelationship, Person } from './types';

export function getDTreePersonGroupId(
  personId: string,
  groups: Group[],
  data: DTreeData
): string | null {
  return groups.find(group => group.leader_id === personId && !group.archived_at)?.id
    || data.memberships.find(member => member.person_id === personId)?.group_id
    || null;
}

export function getActiveMentorships(data: DTreeData): MentorshipRelationship[] {
  return data.relationships.filter(relationship => !relationship.ended_at);
}

export function getPersonDisplayName(person?: Person | null): string {
  return person?.nickname?.trim() || person?.full_name || 'Tanpa nama';
}

export function getInitials(person?: Person | null): string {
  if (!person) return '?';
  return person.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';
}

export function getStageTone(stage?: string): {
  surface: string;
  border: string;
  accent: string;
  label: string;
} {
  const normalized = (stage || '').toLowerCase();
  if (normalized.includes('baptis')) {
    return { surface: 'bg-cyan-50', border: 'border-cyan-200', accent: 'text-cyan-800', label: 'Baptis' };
  }
  if (normalized.includes('kasih')) {
    return { surface: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-800', label: 'Kasih' };
  }
  if (normalized.includes('tujuan')) {
    return { surface: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-800', label: 'Tujuan Hidup' };
  }
  if (normalized.includes('minggu')) {
    return { surface: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-800', label: stage || 'Belajar Alkitab' };
  }
  return { surface: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-700', label: stage || 'Belum mulai' };
}

import { Person } from './types';

export function isAdminPerson(person?: Person | null): boolean {
  return person?.role === 'SUPER_ADMIN' || person?.is_admin === true;
}

export function isGroupLeaderPerson(person?: Person | null): boolean {
  return isAdminPerson(person) || person?.role === 'GROUP_LEADER';
}

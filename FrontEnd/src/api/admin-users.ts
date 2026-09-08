import { apiFetch, apiPost } from '@/src/api/client';
import type { AdminUser } from '@/src/types';

type GetAdminUsersOptions = {
  search?: string;
  staffOnly?: boolean;
};

export function getAdminUsers(options: GetAdminUsersOptions = {}) {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set('search', options.search.trim());
  }

  if (options.staffOnly) {
    query.set('staffOnly', 'true');
  }

  const queryString = query.toString();

  return apiFetch<AdminUser[]>(
    `/api/admin/users${queryString ? `?${queryString}` : ''}`,
  );
}

export function makeUserStaff(userId: string) {
  return apiPost<void>(`/api/admin/users/${userId}/staff`);
}

import { apiFetch } from '@/src/api/client';

export function makeUserStaff(userId: string) {
  return apiFetch<void>(`/api/admin/users/${userId}/staff`, {
    method: 'POST',
  });
}

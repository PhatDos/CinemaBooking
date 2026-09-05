import { apiFetch } from '@/src/api/client';

export function cancelHold(holdId: string) {
  return apiFetch<void>(`/api/holds/${holdId}`, {
    method: 'DELETE',
  });
}

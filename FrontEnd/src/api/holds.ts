import { apiDelete } from '@/src/api/client';

export function cancelHold(holdId: string) {
  return apiDelete<void>(`/api/holds/${holdId}`);
}

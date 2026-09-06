import { apiFetch } from '@/src/api/client';
import type { Checkout } from '@/src/types';

export function cancelCheckout(holdId: string) {
  return apiFetch<Checkout>(`/api/checkouts/${holdId}/cancel`, {
    method: 'POST',
  });
}

export function getCheckouts() {
  return apiFetch<Checkout[]>('/api/checkouts/me');
}

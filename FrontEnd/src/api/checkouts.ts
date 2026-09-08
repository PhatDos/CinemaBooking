import { apiFetch, apiPost } from '@/src/api/client';
import type { Checkout } from '@/src/types';

export function cancelCheckout(holdId: string) {
  return apiPost<Checkout>(`/api/checkouts/${holdId}/cancel`);
}

export function getCheckouts() {
  return apiFetch<Checkout[]>('/api/checkouts/me');
}

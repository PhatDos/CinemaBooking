import { apiFetch } from '@/src/api/client';
import type { CheckInTicketResponse } from '@/src/types';

export function checkInTicket(code: string) {
  return apiFetch<CheckInTicketResponse>('/api/tickets/check-in', {
    method: 'POST',
    body: { code },
  });
}

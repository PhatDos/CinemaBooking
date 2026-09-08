import { apiPost } from '@/src/api/client';
import type { CheckInTicketResponse } from '@/src/types';

export function checkInTicket(code: string) {
  return apiPost<CheckInTicketResponse>('/api/tickets/check-in', { code });
}

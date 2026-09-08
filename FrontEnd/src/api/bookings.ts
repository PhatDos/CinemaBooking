import { apiFetch, apiPost } from '@/src/api/client';
import type { Booking, Ticket } from '@/src/types';

export function cancelBooking(bookingId: string) {
  return apiPost<void>(`/api/bookings/${bookingId}/cancel`);
}

export function getBooking(bookingId: string) {
  return apiFetch<Booking>(`/api/bookings/${bookingId}`);
}

export function getBookings() {
  return apiFetch<Booking[]>('/api/bookings/me');
}

export function getBookingTickets(bookingId: string) {
  return apiFetch<Ticket[]>(`/api/bookings/${bookingId}/tickets`);
}

export function toTicketQrPayload(ticket: Pick<Ticket, 'code'>) {
  return `ticket:${ticket.code}`;
}

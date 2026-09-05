import { apiFetch } from '@/src/api/client';
import type { Booking, CreateBookingRequest, CreateBookingResult, Ticket } from '@/src/types';

export function createBooking(request: CreateBookingRequest) {
  return apiFetch<CreateBookingResult>('/api/bookings', {
    method: 'POST',
    body: request,
  });
}

export function cancelBooking(bookingId: string) {
  return apiFetch<void>(`/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
  });
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

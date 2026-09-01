import { apiFetch } from '@/src/api/client';
import type { Booking, CreateBookingRequest, CreateBookingResult } from '@/src/types';

export function createBooking(request: CreateBookingRequest) {
  return apiFetch<CreateBookingResult>('/api/bookings', {
    method: 'POST',
    body: request,
  });
}

export function getBooking(bookingId: string) {
  return apiFetch<Booking>(`/api/bookings/${bookingId}`);
}

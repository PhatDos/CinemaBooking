import { apiFetch } from '@/src/api/client';
import type { HoldSeatsRequest, HoldSeatsResponse, SeatAvailability } from '@/src/types';

export function getSeatAvailability(showtimeId: string) {
  return apiFetch<SeatAvailability[]>(`/api/showtimes/${showtimeId}/seats`);
}

export function holdSeats(showtimeId: string, request: HoldSeatsRequest) {
  return apiFetch<HoldSeatsResponse>(`/api/showtimes/${showtimeId}/holds`, {
    method: 'POST',
    body: request,
  });
}

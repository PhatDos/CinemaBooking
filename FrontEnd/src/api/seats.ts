import { apiFetch, apiPost } from '@/src/api/client';
import type { HoldSeatsRequest, HoldSeatsResponse, SeatAvailability } from '@/src/types';

export function getSeatAvailability(showtimeId: string) {
  return apiFetch<SeatAvailability[]>(`/api/showtimes/${showtimeId}/seats`);
}

export function holdSeats(showtimeId: string, request: HoldSeatsRequest) {
  return apiPost<HoldSeatsResponse>(`/api/showtimes/${showtimeId}/holds`, request);
}

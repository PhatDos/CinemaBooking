import { apiFetch } from '@/src/api/client';
import type { Cinema, Room, Seat } from '@/src/types';

export function getCinemas() {
  return apiFetch<Cinema[]>('/api/cinemas');
}

export function getCinema(id: string) {
  return apiFetch<Cinema>(`/api/cinemas/${id}`);
}

export function getRoom(id: string) {
  return apiFetch<Room>(`/api/rooms/${id}`);
}

export function getSeats() {
  return apiFetch<Seat[]>('/api/seats');
}

import { apiFetch } from '@/src/api/client';
import type { Cinema, CinemaShowtime, Room, Seat, SeatType } from '@/src/types';

type GetCinemasOptions = {
  provinceCode?: string | null;
  wardCode?: string | null;
};

type GetCinemaShowtimeHistoryOptions = {
  from?: string;
  to?: string;
};

export function getCinemas(options: GetCinemasOptions = {}) {
  const query = new URLSearchParams();

  if (options.provinceCode) {
    query.set('provinceCode', options.provinceCode);
  }

  if (options.wardCode) {
    query.set('wardCode', options.wardCode);
  }

  const queryString = query.toString();

  return apiFetch<Cinema[]>(`/api/cinemas${queryString ? `?${queryString}` : ''}`);
}

export function getCinema(id: string) {
  return apiFetch<Cinema>(`/api/cinemas/${id}`);
}

export function getRoom(id: string) {
  return apiFetch<Room>(`/api/rooms/${id}`);
}

export function getRoomsByCinema(cinemaId: string) {
  return apiFetch<Room[]>(`/api/cinemas/${cinemaId}/rooms`);
}

export function getCinemaShowtimes(cinemaId: string) {
  return apiFetch<CinemaShowtime[]>(`/api/cinemas/${cinemaId}/showtimes`);
}

export function getCinemaShowtimeHistory(
  cinemaId: string,
  options: GetCinemaShowtimeHistoryOptions = {},
) {
  const query = new URLSearchParams();

  if (options.from) {
    query.set('from', options.from);
  }

  if (options.to) {
    query.set('to', options.to);
  }

  const queryString = query.toString();

  return apiFetch<CinemaShowtime[]>(
    `/api/cinemas/${cinemaId}/showtimes/history${queryString ? `?${queryString}` : ''}`,
  );
}

export function getSeats() {
  return apiFetch<Seat[]>('/api/seats');
}

export function getSeatsByRoom(roomId: string) {
  return apiFetch<Seat[]>(`/api/rooms/${roomId}/seats`);
}

export type CreateRoomRequest = {
  name: string;
  isActive?: boolean;
};

export type UpdateRoomRequest = {
  name: string;
  isActive: boolean;
};

export type CreateSeatRequest = {
  row: string;
  number: number;
  type?: SeatType;
};

export function createRoom(cinemaId: string, request: CreateRoomRequest) {
  return apiFetch<Room>(`/api/cinemas/${cinemaId}/rooms`, {
    method: 'POST',
    body: request,
  });
}

export function updateRoom(roomId: string, request: UpdateRoomRequest) {
  return apiFetch<void>(`/api/rooms/${roomId}`, {
    method: 'PUT',
    body: request,
  });
}

export function createSeat(roomId: string, request: CreateSeatRequest) {
  return apiFetch<Seat>(`/api/rooms/${roomId}/seats`, {
    method: 'POST',
    body: request,
  });
}

export function bulkCreateSeats(roomId: string, seats: CreateSeatRequest[]) {
  return apiFetch<{ createdCount: number; seatIds: string[] }>(
    `/api/rooms/${roomId}/seats/bulk`,
    {
      method: 'POST',
      body: { seats },
    },
  );
}

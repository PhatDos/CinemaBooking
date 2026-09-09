import { apiFetch, apiPost, apiPut } from '@/src/api/client';
import type {
  Cinema,
  CinemaShowtime,
  Room,
  Seat,
  SeatType,
  ShowtimeQueryOptions,
} from '@/src/types';

type GetCinemasOptions = {
  provinceCode?: string | null;
  wardCode?: string | null;
};

type GetCinemaShowtimeHistoryOptions = {
  from?: string;
  to?: string;
};

export type CreateCinemaRequest = {
  name: string;
  address: string;
  city: string;
  description?: string | null;
  imageUrl?: string | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  addressLine?: string | null;
};

export type UpdateCinemaRequest = CreateCinemaRequest & {
  isActive: boolean;
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

export function createCinema(request: CreateCinemaRequest) {
  return apiPost<Cinema>('/api/cinemas', request);
}

export function updateCinema(id: string, request: UpdateCinemaRequest) {
  return apiPut<void>(`/api/cinemas/${id}`, request);
}

export function getRoom(id: string) {
  return apiFetch<Room>(`/api/rooms/${id}`);
}

export function getRoomsByCinema(cinemaId: string) {
  return apiFetch<Room[]>(`/api/cinemas/${cinemaId}/rooms`);
}

export function getCinemaShowtimes(
  cinemaId: string,
  options: ShowtimeQueryOptions = {},
) {
  const queryString = buildShowtimeQueryString(options);

  return apiFetch<CinemaShowtime[]>(
    `/api/cinemas/${cinemaId}/showtimes${queryString}`,
  );
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

export function assignStaffToCinema(cinemaId: string, userId: string) {
  return apiPost<void>(`/api/cinemas/${cinemaId}/staff`, { userId });
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
  return apiPost<Room>(`/api/cinemas/${cinemaId}/rooms`, request);
}

export function updateRoom(roomId: string, request: UpdateRoomRequest) {
  return apiPut<void>(`/api/rooms/${roomId}`, request);
}

export function createSeat(roomId: string, request: CreateSeatRequest) {
  return apiPost<Seat>(`/api/rooms/${roomId}/seats`, request);
}

export function bulkCreateSeats(roomId: string, seats: CreateSeatRequest[]) {
  return apiPost<{ createdCount: number; seatIds: string[] }>(
    `/api/rooms/${roomId}/seats/bulk`,
    { seats },
  );
}

function buildShowtimeQueryString(options: ShowtimeQueryOptions) {
  const query = new URLSearchParams();

  if (options.from) {
    query.set('from', options.from);
  }

  if (options.to) {
    query.set('to', options.to);
  }

  if (options.includePast) {
    query.set('includePast', 'true');
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

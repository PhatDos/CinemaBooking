import { apiFetch } from '@/src/api/client';
import type {
  BulkCreateShowtimesRequest,
  BulkCreateShowtimesResult,
  CreateShowtimeRequest,
  Showtime,
} from '@/src/types';

export function getShowtimeById(id: string) {
  return apiFetch<Showtime>(`/api/showtimes/${id}`);
}

export function createShowtime(request: CreateShowtimeRequest) {
  return apiFetch<Showtime>('/api/showtimes', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function bulkCreateShowtimes(
  request: BulkCreateShowtimesRequest,
) {
  return apiFetch<BulkCreateShowtimesResult>('/api/showtimes/bulk', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

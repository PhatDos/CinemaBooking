import { apiFetch, apiPost } from '@/src/api/client';
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
  return apiPost<Showtime>('/api/showtimes', request);
}

export function bulkCreateShowtimes(
  request: BulkCreateShowtimesRequest,
) {
  return apiPost<BulkCreateShowtimesResult>('/api/showtimes/bulk', request);
}

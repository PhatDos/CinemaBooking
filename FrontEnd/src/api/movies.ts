import { apiFetch } from '@/src/api/client';
import type {
  BulkCreateMoviesRequest,
  BulkCreateMoviesResult,
  Movie,
  MovieDetail,
  Showtime,
} from '@/src/types';

export function getMovies() {
  return apiFetch<Movie[]>('/api/movies');
}

export function getMovieById(id: string) {
  return apiFetch<MovieDetail>(`/api/movies/${id}`);
}

export function getMovieShowtimes(movieId: string) {
  return apiFetch<Showtime[]>(`/api/movies/${movieId}/showtimes`);
}

export function bulkCreateMovies(request: BulkCreateMoviesRequest) {
  return apiFetch<BulkCreateMoviesResult>('/api/movies/bulk', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

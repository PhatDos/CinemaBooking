import { apiFetch } from '@/src/api/client';
import type { Movie, MovieDetail, Showtime } from '@/src/types';

export function getMovies() {
  return apiFetch<Movie[]>('/api/movies');
}

export function getMovieById(id: string) {
  return apiFetch<MovieDetail>(`/api/movies/${id}`);
}

export function getMovieShowtimes(movieId: string) {
  return apiFetch<Showtime[]>(`/api/movies/${movieId}/showtimes`);
}

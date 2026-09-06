import { apiFetch } from '@/src/api/client';
import type {
  BulkCreateMoviesRequest,
  BulkCreateMoviesResult,
  CreateMovieRequest,
  Movie,
  MovieDetail,
  Showtime,
  UpdateMovieRequest,
} from '@/src/types';

export function getMovies() {
  return apiFetch<Movie[]>('/api/movies');
}

export function getNowShowingMovies() {
  return apiFetch<Movie[]>('/api/movies/now-showing');
}

export function getMovieById(id: string) {
  return apiFetch<MovieDetail>(`/api/movies/${id}`);
}

export function getMovieShowtimes(movieId: string) {
  return apiFetch<Showtime[]>(`/api/movies/${movieId}/showtimes`);
}

export function createMovie(request: CreateMovieRequest) {
  return apiFetch<Movie>('/api/movies', {
    method: 'POST',
    body: request,
  });
}

export function updateMovie(id: string, request: UpdateMovieRequest) {
  return apiFetch<void>(`/api/movies/${id}`, {
    method: 'PUT',
    body: request,
  });
}

export function bulkCreateMovies(request: BulkCreateMoviesRequest) {
  return apiFetch<BulkCreateMoviesResult>('/api/movies/bulk', {
    method: 'POST',
    body: request,
  });
}

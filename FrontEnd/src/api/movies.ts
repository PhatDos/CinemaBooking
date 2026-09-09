import { apiFetch, apiPost, apiPut } from '@/src/api/client';
import type {
  BulkCreateMoviesRequest,
  BulkCreateMoviesResult,
  CreateMovieRequest,
  Movie,
  MovieDetail,
  Showtime,
  ShowtimeQueryOptions,
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

export function getMovieShowtimes(
  movieId: string,
  options: ShowtimeQueryOptions = {},
) {
  const queryString = buildShowtimeQueryString(options);

  return apiFetch<Showtime[]>(
    `/api/movies/${movieId}/showtimes${queryString}`,
  );
}

export function createMovie(request: CreateMovieRequest) {
  return apiPost<Movie>('/api/movies', request);
}

export function updateMovie(id: string, request: UpdateMovieRequest) {
  return apiPut<void>(`/api/movies/${id}`, request);
}

export function bulkCreateMovies(request: BulkCreateMoviesRequest) {
  return apiPost<BulkCreateMoviesResult>('/api/movies/bulk', request);
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

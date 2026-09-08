import { getYouTubeVideoId } from '@/src/media/youtube';
import type { Movie, UpdateMovieRequest } from '@/src/types';

export type MovieFormState = {
  description: string;
  durationMinutes: string;
  genreIds: string[];
  isActive: boolean;
  posterPublicId: string;
  posterUrl: string;
  releaseDate: string;
  title: string;
  trailerUrl: string;
};

export const defaultMovieForm: MovieFormState = {
  description: '',
  durationMinutes: '',
  genreIds: [],
  isActive: true,
  posterPublicId: '',
  posterUrl: '',
  releaseDate: toDateInputValue(new Date().toISOString()),
  title: '',
  trailerUrl: '',
};

export function toFormState(movie: Movie): MovieFormState {
  return {
    description: movie.description,
    durationMinutes: movie.durationMinutes.toString(),
    genreIds: movie.genres?.length
      ? movie.genres.map((genre) => genre.id)
      : movie.genreId ? [movie.genreId] : [],
    isActive: movie.isActive,
    posterPublicId: movie.posterPublicId ?? '',
    posterUrl: movie.posterUrl ?? '',
    releaseDate: toDateInputValue(movie.releaseDate),
    title: movie.title,
    trailerUrl: movie.trailerUrl ?? '',
  };
}

export function toRequest(form: MovieFormState): UpdateMovieRequest {
  const genreIds = form.genreIds;

  return {
    description: form.description.trim(),
    durationMinutes: Number(form.durationMinutes),
    genreId: genreIds[0] ?? null,
    genreIds,
    isActive: form.isActive,
    posterPublicId: toOptionalString(form.posterPublicId),
    posterUrl: toOptionalString(form.posterUrl),
    releaseDate: `${form.releaseDate.trim()}T00:00:00.000Z`,
    title: form.title.trim(),
    trailerUrl: toOptionalString(form.trailerUrl),
  };
}

export function validateMovieForm(form: MovieFormState) {
  if (!form.title.trim()) {
    return 'Movie title is required.';
  }

  if (!form.description.trim()) {
    return 'Movie description is required.';
  }

  const duration = Number(form.durationMinutes);

  if (!Number.isInteger(duration) || duration < 1 || duration > 500) {
    return 'Duration must be between 1 and 500 minutes.';
  }

  if (!isValidDateInput(form.releaseDate)) {
    return 'Release date must use YYYY-MM-DD.';
  }

  if (form.genreIds.length === 0) {
    return 'At least one genre is required.';
  }

  if (!isValidPosterUrl(form.posterUrl)) {
    return 'Poster URL must start with http:// or https://.';
  }

  if (!isValidOptionalYouTubeUrl(form.trailerUrl)) {
    return 'Trailer URL must be a YouTube URL.';
  }

  return '';
}

export function toDateInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function isValidPosterUrl(value: string) {
  return (
    value.startsWith('file:') ||
    value.startsWith('ph:') ||
    value.startsWith('assets-library:') ||
    isValidOptionalUrl(value)
  );
}

function isValidDateInput(value: string) {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === trimmed;
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidOptionalYouTubeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  return getYouTubeVideoId(trimmed) !== null;
}

function toOptionalString(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

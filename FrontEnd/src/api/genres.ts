import { apiDelete, apiFetch, apiPost, apiPut } from '@/src/api/client';
import type {
  CreateGenreRequest,
  Genre,
  UpdateGenreRequest,
} from '@/src/types';

let genresCache: Genre[] | null = null;
let genresPromise: Promise<Genre[]> | null = null;

type GetGenresOptions = {
  forceRefresh?: boolean;
};

export async function getGenres(options: GetGenresOptions = {}) {
  if (!options.forceRefresh && genresCache) {
    return genresCache;
  }

  if (!options.forceRefresh && genresPromise) {
    return genresPromise;
  }

  genresPromise = apiFetch<Genre[]>('/api/genres', {
    auth: false,
  })
    .then((genres) => {
      genresCache = genres;
      return genres;
    })
    .finally(() => {
      genresPromise = null;
    });

  return genresPromise;
}

export function clearGenresCache() {
  genresCache = null;
  genresPromise = null;
}

export async function createGenre(request: CreateGenreRequest) {
  const genre = await apiPost<Genre>('/api/genres', request);

  clearGenresCache();

  return genre;
}

export async function updateGenre(
  id: string,
  request: UpdateGenreRequest,
) {
  await apiPut<void>(`/api/genres/${id}`, request);

  clearGenresCache();
}

export async function deleteGenre(id: string) {
  await apiDelete<void>(`/api/genres/${id}`);

  clearGenresCache();
}

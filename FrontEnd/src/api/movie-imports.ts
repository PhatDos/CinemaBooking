import { apiFetch } from '@/src/api/client';
import type {
  Movie,
  MovieImportBatch,
  MovieImportCandidate,
  MovieImportRunRequest,
} from '@/src/types';

export function runMovieImport(request: MovieImportRunRequest = {}) {
  return apiFetch<MovieImportBatch>('/api/admin/movie-imports/run', {
    method: 'POST',
    body: {
      source: request.source ?? 'Moveek',
    },
  });
}

export function discoverMovieImport(request: MovieImportRunRequest = {}) {
  return apiFetch<MovieImportBatch>('/api/admin/movie-imports/discover', {
    method: 'POST',
    body: {
      source: request.source ?? 'Moveek',
    },
  });
}

export function getMovieImportBatches() {
  return apiFetch<MovieImportBatch[]>('/api/admin/movie-imports');
}

export function getMovieImportCandidates(batchId: string) {
  return apiFetch<MovieImportCandidate[]>(
    `/api/admin/movie-imports/${batchId}/candidates`,
  );
}

export function crawlMovieImportBatch(batchId: string) {
  return apiFetch<MovieImportBatch>(
    `/api/admin/movie-imports/${batchId}/crawl`,
    {
      method: 'POST',
    },
  );
}

export function crawlMovieImportCandidate(candidateId: string) {
  return apiFetch<MovieImportCandidate>(
    `/api/admin/movie-import-candidates/${candidateId}/crawl`,
    {
      method: 'POST',
    },
  );
}

export function approveMovieImportCandidate(candidateId: string) {
  return apiFetch<Movie>(
    `/api/admin/movie-import-candidates/${candidateId}/approve`,
    {
      method: 'POST',
    },
  );
}

export function rejectMovieImportCandidate(candidateId: string) {
  return apiFetch<void>(
    `/api/admin/movie-import-candidates/${candidateId}/reject`,
    {
      method: 'POST',
    },
  );
}

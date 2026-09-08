import { apiFetch, apiPost } from '@/src/api/client';
import type {
  Movie,
  MovieImportBatch,
  MovieImportCandidate,
  MovieImportRunRequest,
} from '@/src/types';

export function runMovieImport(request: MovieImportRunRequest = {}) {
  return apiPost<MovieImportBatch>('/api/admin/movie-imports/run', {
    source: request.source ?? 'Moveek',
  });
}

export function discoverMovieImport(request: MovieImportRunRequest = {}) {
  return apiPost<MovieImportBatch>('/api/admin/movie-imports/discover', {
    source: request.source ?? 'Moveek',
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
  return apiPost<MovieImportBatch>(
    `/api/admin/movie-imports/${batchId}/crawl`,
  );
}

export function crawlMovieImportCandidate(candidateId: string) {
  return apiPost<MovieImportCandidate>(
    `/api/admin/movie-import-candidates/${candidateId}/crawl`,
  );
}

export function approveMovieImportCandidate(candidateId: string) {
  return apiPost<Movie>(
    `/api/admin/movie-import-candidates/${candidateId}/approve`,
  );
}

export function rejectMovieImportCandidate(candidateId: string) {
  return apiPost<void>(
    `/api/admin/movie-import-candidates/${candidateId}/reject`,
  );
}

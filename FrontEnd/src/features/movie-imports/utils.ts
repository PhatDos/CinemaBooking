import { ApiError } from '@/src/api/client';
import type { MovieImportCandidate, MovieImportCandidateStatus } from '@/src/types';

export type BulkAction = 'discover' | 'crawl' | 'run' | null;

export type TrailerState = {
  title: string;
  videoId: string;
} | null;

export function countCandidatesByStatus(candidates: MovieImportCandidate[]) {
  return candidates.reduce<Record<MovieImportCandidateStatus, number>>(
    (result, candidate) => ({
      ...result,
      [candidate.status]: result[candidate.status] + 1,
    }),
    {
      Approved: 0,
      Crawled: 0,
      Discovered: 0,
      Failed: 0,
      NeedsReview: 0,
      Rejected: 0,
    },
  );
}

export function canCrawl(status: MovieImportCandidateStatus) {
  return status === 'Discovered' || status === 'Failed';
}

export function canApprove(status: MovieImportCandidateStatus) {
  return status === 'Crawled' || status === 'NeedsReview';
}

export function canReject(status: MovieImportCandidateStatus) {
  return status !== 'Approved' && status !== 'Rejected';
}

export function getCandidateGenreNames(candidate: MovieImportCandidate) {
  return candidate.genreNames.length > 0
    ? candidate.genreNames
    : candidate.listingGenres;
}

export function getFriendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) {
    return `${fallback} Import API is missing on the running backend. Rebuild/restart Docker API.`;
  }

  return error instanceof ApiError ? error.message : fallback;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatReleaseTimestamp(value: number | null) {
  if (!value) {
    return 'No release date';
  }

  return formatDate(new Date(value * 1000).toISOString());
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

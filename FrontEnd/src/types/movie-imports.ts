import type { Movie } from './movies';

export type MovieImportBatchStatus = 'Running' | 'Completed' | 'Failed';

export type MovieImportCandidateStatus =
  | 'Discovered'
  | 'Crawled'
  | 'Failed'
  | 'NeedsReview'
  | 'Approved'
  | 'Rejected';

export type MovieImportBatch = {
  id: string;
  source: string;
  status: MovieImportBatchStatus;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  candidateCount: number;
};

export type MovieImportCandidate = {
  id: string;
  batchId: string;
  source: string;
  sourceUrl: string;
  listingTitle: string | null;
  listingGenres: string[];
  popularity: number | null;
  releaseTimestamp: number | null;
  title: string;
  normalizedTitle: string;
  description: string;
  durationMinutes: number | null;
  releaseDate: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  genreName: string | null;
  genreNames: string[];
  matchMovieId: string | null;
  matchMovie: Movie | null;
  status: MovieImportCandidateStatus;
  warnings: string | null;
  detailError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MovieImportRunRequest = {
  source?: string;
};

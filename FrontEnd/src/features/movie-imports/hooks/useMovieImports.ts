import { useCallback, useEffect, useMemo, useState } from 'react';

import { clearGenresCache } from '@/src/api/genres';
import {
  approveMovieImportCandidate,
  crawlMovieImportBatch,
  crawlMovieImportCandidate,
  discoverMovieImport,
  getMovieImportBatches,
  getMovieImportCandidates,
  rejectMovieImportCandidate,
  runMovieImport,
} from '@/src/api/movie-imports';
import { useAppNotification } from '@/src/components/AppNotification';
import { getYouTubeVideoId } from '@/src/media/youtube';
import type { MovieImportBatch, MovieImportCandidate } from '@/src/types';

import {
  countCandidatesByStatus,
  getFriendlyError,
  type BulkAction,
  type TrailerState,
} from '../utils';

export function useMovieImports() {
  const { showNotification } = useAppNotification();
  const [batches, setBatches] = useState<MovieImportBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MovieImportCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [candidateToReject, setCandidateToReject] =
    useState<MovieImportCandidate | null>(null);
  const [trailer, setTrailer] = useState<TrailerState>(null);
  const [error, setError] = useState('');

  const busy = bulkAction !== null || savingCandidateId !== null;
  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );
  const counts = useMemo(
    () => countCandidatesByStatus(candidates),
    [candidates],
  );

  const loadImports = useCallback(async (
    batchId: string | null = null,
    showSpinner = true,
  ) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const batchResult = await getMovieImportBatches();
      const nextBatchId = batchId ?? batchResult[0]?.id ?? null;

      setBatches(batchResult);
      setSelectedBatchId(nextBatchId);

      if (nextBatchId) {
        setCandidates(await getMovieImportCandidates(nextBatchId));
      } else {
        setCandidates([]);
      }
    } catch (loadError) {
      console.error(loadError);
      setError(getFriendlyError(loadError, 'Cannot load movie imports'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadImports();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadImports]);

  async function refreshImports() {
    setRefreshing(true);
    await loadImports(selectedBatchId, false);
  }

  async function discoverImports() {
    if (busy) {
      return;
    }

    setBulkAction('discover');
    setError('');

    try {
      const batch = await discoverMovieImport({ source: 'Moveek' });

      showNotification('Moveek links discovered.', { tone: 'success' });
      await loadImports(batch.id, false);
    } catch (discoverError) {
      console.error(discoverError);
      showNotification(
        getFriendlyError(
          discoverError,
          'Cannot discover Moveek movies right now.',
        ),
        { tone: 'error' },
      );
    } finally {
      setBulkAction(null);
    }
  }

  async function crawlAllCandidates() {
    if (busy || !selectedBatchId) {
      return;
    }

    setBulkAction('crawl');
    setError('');

    try {
      await crawlMovieImportBatch(selectedBatchId);
      showNotification('Movie details crawled.', { tone: 'success' });
      await loadImports(selectedBatchId, false);
    } catch (crawlError) {
      console.error(crawlError);
      showNotification(
        getFriendlyError(crawlError, 'Cannot crawl this batch right now.'),
        { tone: 'error' },
      );
    } finally {
      setBulkAction(null);
    }
  }

  async function runFullImport() {
    if (busy) {
      return;
    }

    setBulkAction('run');
    setError('');

    try {
      const batch = await runMovieImport({ source: 'Moveek' });

      showNotification('Moveek import completed.', { tone: 'success' });
      await loadImports(batch.id, false);
    } catch (runError) {
      console.error(runError);
      showNotification(
        getFriendlyError(runError, 'Cannot run movie import right now.'),
        { tone: 'error' },
      );
    } finally {
      setBulkAction(null);
    }
  }

  async function crawlCandidate(candidate: MovieImportCandidate) {
    if (busy) {
      return;
    }

    setSavingCandidateId(candidate.id);

    try {
      await crawlMovieImportCandidate(candidate.id);
      showNotification('Movie detail crawled.', { tone: 'success' });
      await loadImports(candidate.batchId, false);
    } catch (crawlError) {
      console.error(crawlError);
      showNotification(
        getFriendlyError(crawlError, 'Cannot crawl this movie right now.'),
        { tone: 'error' },
      );
    } finally {
      setSavingCandidateId(null);
    }
  }

  async function approveCandidate(candidate: MovieImportCandidate) {
    if (busy) {
      return;
    }

    setSavingCandidateId(candidate.id);

    try {
      await approveMovieImportCandidate(candidate.id);
      clearGenresCache();
      showNotification('Candidate approved.', { tone: 'success' });
      await loadImports(candidate.batchId, false);
    } catch (approveError) {
      console.error(approveError);
      showNotification(
        getFriendlyError(approveError, 'Cannot approve this candidate.'),
        { tone: 'error' },
      );
    } finally {
      setSavingCandidateId(null);
    }
  }

  async function rejectCandidate(candidate: MovieImportCandidate) {
    if (busy && savingCandidateId !== candidate.id) {
      return;
    }

    setSavingCandidateId(candidate.id);

    try {
      await rejectMovieImportCandidate(candidate.id);
      setCandidateToReject(null);
      showNotification('Candidate rejected.', { tone: 'success' });
      await loadImports(candidate.batchId, false);
    } catch (rejectError) {
      console.error(rejectError);
      showNotification(
        getFriendlyError(rejectError, 'Cannot reject this candidate.'),
        { tone: 'error' },
      );
    } finally {
      setSavingCandidateId(null);
    }
  }

  function openTrailer(candidate: MovieImportCandidate) {
    const videoId = getYouTubeVideoId(candidate.trailerUrl);

    if (!videoId) {
      showNotification('Trailer URL is not a supported YouTube link.', {
        tone: 'error',
      });
      return;
    }

    setTrailer({
      title: candidate.title || candidate.listingTitle || 'Trailer',
      videoId,
    });
  }

  function selectBatch(batchId: string) {
    setSelectedBatchId(batchId);
    void loadImports(batchId, false);
  }

  return {
    approveCandidate,
    batches,
    bulkAction,
    busy,
    candidateToReject,
    candidates,
    counts,
    crawlAllCandidates,
    crawlCandidate,
    discoverImports,
    error,
    loadImports,
    loading,
    openTrailer,
    refreshImports,
    refreshing,
    rejectCandidate,
    runFullImport,
    savingCandidateId,
    selectBatch,
    selectedBatch,
    selectedBatchId,
    setCandidateToReject,
    setTrailer,
    trailer,
  };
}

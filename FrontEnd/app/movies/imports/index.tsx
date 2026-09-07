import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/src/api/client';
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
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { YouTubeEmbed } from '@/src/components/YouTubeEmbed';
import { useAppNotification } from '@/src/components/AppNotification';
import { getYouTubeVideoId } from '@/src/media/youtube';
import { styles } from '@/src/styles/screens/movie-imports.styles';
import type {
  MovieImportBatch,
  MovieImportCandidate,
  MovieImportCandidateStatus,
} from '@/src/types';

const movieManageRoute = '/movies/manage' as Href;

type BulkAction = 'discover' | 'crawl' | 'run' | null;

export default function MovieImportsScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
  const [trailer, setTrailer] =
    useState<{ title: string; videoId: string } | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const busy = bulkAction !== null || savingCandidateId !== null;

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );

  const counts = useMemo(() => {
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
  }, [candidates]);

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
    if (isAuthenticated && isAdmin) {
      const timeoutId = setTimeout(() => {
        void loadImports();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isAdmin, loadImports]);

  async function handleDiscover() {
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
        getFriendlyError(discoverError, 'Cannot discover Moveek movies right now.'),
        { tone: 'error' },
      );
    } finally {
      setBulkAction(null);
    }
  }

  async function handleCrawlAll() {
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

  async function handleRunImport() {
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

  async function handleCrawlCandidate(candidate: MovieImportCandidate) {
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

  async function handleApprove(candidate: MovieImportCandidate) {
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

  async function handleReject(candidate: MovieImportCandidate) {
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

  function handleOpenTrailer(candidate: MovieImportCandidate) {
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

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/movies" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedPressable
          contentStyle={styles.backButton}
          disabled={busy}
          onPress={() => router.replace(movieManageRoute)}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.heading}>Movie Import</Text>
        <Text style={styles.subtitle}>
          Discover Moveek links first, then crawl details and approve into Catalog.
        </Text>

        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <ActionButton
              disabled={busy}
              fill
              label="Run full import"
              loading={bulkAction === 'run'}
              onPress={handleRunImport}
              variant="primary"
            />
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              disabled={busy || !selectedBatchId}
              fill
              label="Crawl all details"
              loading={bulkAction === 'crawl'}
              onPress={handleCrawlAll}
              variant="neutral"
            />
            <ActionButton
              disabled={busy}
              fill
              label="Discover Moveek"
              loading={bulkAction === 'discover'}
              onPress={handleDiscover}
              variant="neutral"
            />
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            onPress={() => loadImports(selectedBatchId)}
            style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={candidates}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadImports(selectedBatchId, false);
              }}
            />
          }
          ListHeaderComponent={
            <ImportSummary
              batches={batches}
              counts={counts}
              selectedBatch={selectedBatch}
              onSelectBatch={(batchId) => {
                setSelectedBatchId(batchId);
                void loadImports(batchId, false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No import candidates</Text>
              <Text style={styles.emptyText}>Discover Moveek movies to stage links.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 35}>
              <CandidateCard
                candidate={item}
                loading={savingCandidateId === item.id}
                onApprove={() => void handleApprove(item)}
                onCrawl={() => void handleCrawlCandidate(item)}
                onReject={() => setCandidateToReject(item)}
                onTrailer={() => handleOpenTrailer(item)}
              />
            </FadeInView>
          )}
        />
      )}

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Keep"
        confirmLabel="Reject"
        destructive
        loading={savingCandidateId !== null}
        message="This candidate will stay in history but will not update the catalog."
        onCancel={() => {
          if (!savingCandidateId) {
            setCandidateToReject(null);
          }
        }}
        onConfirm={() => {
          if (candidateToReject) {
            void handleReject(candidateToReject);
          }
        }}
        title="Reject import candidate?"
        visible={candidateToReject !== null}
      />
      <TrailerModal
        onClose={() => setTrailer(null)}
        trailer={trailer}
      />
    </View>
  );
}

type ActionButtonProps = {
  disabled: boolean;
  fill?: boolean;
  label: string;
  loading: boolean;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
};

function ActionButton({
  disabled,
  fill = false,
  label,
  loading,
  onPress,
  variant = 'neutral',
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      contentStyle={[
        styles.importActionButton,
        isPrimary ? styles.importActionButtonPrimary : styles.importActionButtonNeutral,
        fill && styles.importActionButtonFill,
        disabled && styles.importActionButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      pressableStyle={fill && styles.importActionPressableFill}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#111827'} />
      ) : (
        <Text
          style={
            isPrimary
              ? styles.importActionButtonTextPrimary
              : styles.importActionButtonTextNeutral
          }>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

type CandidateCardProps = {
  candidate: MovieImportCandidate;
  loading: boolean;
  onApprove: () => void;
  onCrawl: () => void;
  onReject: () => void;
  onTrailer: () => void;
};

function CandidateCard({
  candidate,
  loading,
  onApprove,
  onCrawl,
  onReject,
  onTrailer,
}: CandidateCardProps) {
  const sourceTitle = candidate.listingTitle ?? candidate.title;
  const genreNames = candidate.genreNames.length > 0
    ? candidate.genreNames
    : candidate.listingGenres;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.poster}>
          {candidate.posterUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: candidate.posterUrl }}
              style={styles.posterImage}
              transition={180}
            />
          ) : (
            <Text style={styles.posterText}>
              {candidate.status === 'Discovered' ? 'Link' : 'Poster'}
            </Text>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text numberOfLines={3} style={styles.title}>{sourceTitle}</Text>
            <StatusBadge status={candidate.status} />
          </View>

          <Text style={styles.meta}>
            {candidate.durationMinutes ? `${candidate.durationMinutes} min` : 'No duration'}
            {' | '}
            {candidate.releaseDate
              ? formatDate(candidate.releaseDate)
              : formatReleaseTimestamp(candidate.releaseTimestamp)}
          </Text>

          {genreNames.length > 0 ? (
            <Text style={styles.genre}>{genreNames.join(', ')}</Text>
          ) : (
            <Text style={styles.genre}>No genre</Text>
          )}

          {candidate.popularity !== null ? (
            <Text style={styles.meta}>
              Popularity {Math.round(candidate.popularity).toLocaleString('vi-VN')}
            </Text>
          ) : null}

          {candidate.warnings ? (
            <Text numberOfLines={3} style={styles.warning}>{candidate.warnings}</Text>
          ) : null}

          {candidate.detailError ? (
            <Text numberOfLines={3} style={styles.warning}>{candidate.detailError}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text numberOfLines={3} style={styles.description}>
          {candidate.description || 'Discovered from listing. Crawl detail to load metadata.'}
        </Text>

        {candidate.matchMovie ? (
          <View style={styles.matchBox}>
            <Text style={styles.matchLabel}>Matched movie</Text>
            <Text style={styles.matchTitle}>{candidate.matchMovie.title}</Text>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <AnimatedPressable
            contentStyle={styles.secondaryButton}
            onPress={() => void Linking.openURL(candidate.sourceUrl)}>
            <Text style={styles.secondaryButtonText}>Source</Text>
          </AnimatedPressable>

          {candidate.trailerUrl ? (
            <AnimatedPressable
              contentStyle={styles.secondaryButton}
              onPress={onTrailer}>
              <Text style={styles.secondaryButtonText}>Trailer</Text>
            </AnimatedPressable>
          ) : null}

          {canCrawl(candidate.status) ? (
            <AnimatedPressable
              contentStyle={styles.secondaryButton}
              disabled={loading}
              onPress={onCrawl}>
              {loading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.secondaryButtonText}>Crawl detail</Text>
              )}
            </AnimatedPressable>
          ) : null}

          {canApprove(candidate.status) ? (
            <AnimatedPressable
              contentStyle={styles.approveButton}
              disabled={loading}
              onPress={onApprove}>
              {loading ? (
                <ActivityIndicator color="#067647" />
              ) : (
                <Text style={styles.approveButtonText}>Approve</Text>
              )}
            </AnimatedPressable>
          ) : null}

          {canReject(candidate.status) ? (
            <AnimatedPressable
              contentStyle={styles.rejectButton}
              disabled={loading}
              onPress={onReject}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type TrailerModalProps = {
  onClose: () => void;
  trailer: { title: string; videoId: string } | null;
};

function TrailerModal({ onClose, trailer }: TrailerModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={trailer !== null}>
      <View style={styles.trailerBackdrop}>
        <Pressable
          accessibilityLabel="Close trailer"
          onPress={onClose}
          style={styles.trailerBackdropPressable}
        />
        <View style={styles.trailerModal}>
          <View style={styles.trailerHeader}>
            <Text numberOfLines={2} style={styles.trailerTitle}>
              {trailer?.title ?? 'Trailer'}
            </Text>
            <Pressable onPress={onClose} style={styles.trailerCloseButton}>
              <Text style={styles.trailerCloseText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.trailerPlayer}>
            {trailer ? (
              <YouTubeEmbed
                height={220}
                play={false}
                videoId={trailer.videoId}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type ImportSummaryProps = {
  batches: MovieImportBatch[];
  counts: Record<MovieImportCandidateStatus, number>;
  selectedBatch: MovieImportBatch | null;
  onSelectBatch: (batchId: string) => void;
};

function ImportSummary({
  batches,
  counts,
  selectedBatch,
  onSelectBatch,
}: ImportSummaryProps) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Latest batch</Text>
        <Text style={styles.summaryValue}>
          {selectedBatch
            ? `${selectedBatch.source} | ${selectedBatch.status}`
            : 'No batch yet'}
        </Text>
        {selectedBatch ? (
          <Text style={styles.summaryMeta}>
            {selectedBatch.candidateCount} candidates | {formatDateTime(selectedBatch.startedAt)}
          </Text>
        ) : null}
        {selectedBatch ? (
          <Text style={styles.summaryMeta}>
            {counts.Discovered} discovered | {counts.Crawled} crawled | {counts.NeedsReview} review | {counts.Failed} failed
          </Text>
        ) : null}
      </View>

      {batches.length > 1 ? (
        <View style={styles.batchList}>
          {batches.map((batch) => (
            <Pressable
              key={batch.id}
              onPress={() => onSelectBatch(batch.id)}
              style={[
                styles.batchChip,
                selectedBatch?.id === batch.id && styles.batchChipActive,
              ]}>
              <Text
                style={[
                  styles.batchChipText,
                  selectedBatch?.id === batch.id && styles.batchChipTextActive,
                ]}>
                {formatShortDate(batch.startedAt)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: MovieImportCandidateStatus }) {
  return (
    <View style={[styles.badge, styles[getStatusStyleKey(status)]]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

function getStatusStyleKey(status: MovieImportCandidateStatus) {
  switch (status) {
    case 'Approved':
      return 'badgeApproved';
    case 'Rejected':
      return 'badgeRejected';
    case 'NeedsReview':
      return 'badgeReview';
    case 'Failed':
      return 'badgeRejected';
    case 'Discovered':
      return 'badgeDiscovered';
    default:
      return 'badgeSuggested';
  }
}

function canCrawl(status: MovieImportCandidateStatus) {
  return status === 'Discovered' || status === 'Failed';
}

function canApprove(status: MovieImportCandidateStatus) {
  return status === 'Crawled' || status === 'NeedsReview';
}

function canReject(status: MovieImportCandidateStatus) {
  return status !== 'Approved' && status !== 'Rejected';
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function getFriendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) {
    return `${fallback} Import API is missing on the running backend. Rebuild/restart Docker API.`;
  }

  return error instanceof ApiError
    ? error.message
    : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatReleaseTimestamp(value: number | null) {
  if (!value) {
    return 'No release date';
  }

  return formatDate(new Date(value * 1000).toISOString());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

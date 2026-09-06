import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import {
  approveMovieImportCandidate,
  getMovieImportBatches,
  getMovieImportCandidates,
  rejectMovieImportCandidate,
  runMovieImport,
} from '@/src/api/movie-imports';
import { clearGenresCache } from '@/src/api/genres';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { styles } from '@/src/styles/screens/movie-imports.styles';
import type {
  MovieImportBatch,
  MovieImportCandidate,
  MovieImportCandidateStatus,
} from '@/src/types';

const movieManageRoute = '/movies/manage' as Href;

export default function MovieImportsScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [batches, setBatches] = useState<MovieImportBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MovieImportCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [candidateToReject, setCandidateToReject] =
    useState<MovieImportCandidate | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
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
      setError('Cannot load movie imports');
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

  async function handleRunImport() {
    if (running) {
      return;
    }

    setRunning(true);
    setError('');

    try {
      const batch = await runMovieImport({ source: 'Moveek' });

      showNotification('Movie import completed.', { tone: 'success' });
      await loadImports(batch.id, false);
    } catch (runError) {
      console.error(runError);
      showNotification('Cannot run movie import right now.', { tone: 'error' });
    } finally {
      setRunning(false);
    }
  }

  async function handleApprove(candidate: MovieImportCandidate) {
    if (savingCandidateId) {
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
      showNotification('Cannot approve this candidate.', { tone: 'error' });
    } finally {
      setSavingCandidateId(null);
    }
  }

  async function handleReject(candidate: MovieImportCandidate) {
    if (savingCandidateId) {
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
      showNotification('Cannot reject this candidate.', { tone: 'error' });
    } finally {
      setSavingCandidateId(null);
    }
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
          disabled={running}
          onPress={() => router.replace(movieManageRoute)}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.heading}>Movie Import</Text>
        <Text style={styles.subtitle}>
          Review Moveek metadata before updating the catalog.
        </Text>

        <View style={styles.actions}>
          <AnimatedPressable
            contentStyle={[styles.primaryButton, running && styles.disabledButton]}
            disabled={running}
            onPress={handleRunImport}>
            {running ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Run Moveek Import</Text>
            )}
          </AnimatedPressable>
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
              <Text style={styles.emptyText}>Run Moveek import to stage movies.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 35}>
              <View style={styles.card}>
                <View style={styles.poster}>
                  {item.posterUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: item.posterUrl }}
                      style={styles.posterImage}
                      transition={180}
                    />
                  ) : (
                    <Text style={styles.posterText}>Poster</Text>
                  )}
                </View>

                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                    <StatusBadge status={item.status} />
                  </View>

                  <Text style={styles.meta}>
                    {item.durationMinutes ? `${item.durationMinutes} min` : 'No duration'}
                    {' | '}
                    {item.releaseDate ? formatDate(item.releaseDate) : 'No release date'}
                  </Text>

                  <Text style={styles.genre}>
                    {item.genreName ?? 'No genre'}
                  </Text>

                  {item.warnings ? (
                    <Text style={styles.warning}>{item.warnings}</Text>
                  ) : null}

                  <Text numberOfLines={3} style={styles.description}>
                    {item.description || 'No description'}
                  </Text>

                  {item.matchMovie ? (
                    <View style={styles.matchBox}>
                      <Text style={styles.matchLabel}>Matched movie</Text>
                      <Text style={styles.matchTitle}>{item.matchMovie.title}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardActions}>
                    <AnimatedPressable
                      contentStyle={styles.secondaryButton}
                      onPress={() => void Linking.openURL(item.sourceUrl)}>
                      <Text style={styles.secondaryButtonText}>Source</Text>
                    </AnimatedPressable>

                    {item.trailerUrl ? (
                      <AnimatedPressable
                        contentStyle={styles.secondaryButton}
                        onPress={() => void Linking.openURL(item.trailerUrl!)}>
                        <Text style={styles.secondaryButtonText}>Trailer</Text>
                      </AnimatedPressable>
                    ) : null}

                    {canChangeStatus(item.status) ? (
                      <>
                        <AnimatedPressable
                          contentStyle={styles.approveButton}
                          disabled={savingCandidateId === item.id}
                          onPress={() => void handleApprove(item)}>
                          {savingCandidateId === item.id ? (
                            <ActivityIndicator color="#067647" />
                          ) : (
                            <Text style={styles.approveButtonText}>Approve</Text>
                          )}
                        </AnimatedPressable>

                        <AnimatedPressable
                          contentStyle={styles.rejectButton}
                          disabled={savingCandidateId === item.id}
                          onPress={() => setCandidateToReject(item)}>
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </AnimatedPressable>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>
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
    </View>
  );
}

type ImportSummaryProps = {
  batches: MovieImportBatch[];
  selectedBatch: MovieImportBatch | null;
  onSelectBatch: (batchId: string) => void;
};

function ImportSummary({
  batches,
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
    default:
      return 'badgeSuggested';
  }
}

function canChangeStatus(status: MovieImportCandidateStatus) {
  return status !== 'Approved' && status !== 'Rejected';
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
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

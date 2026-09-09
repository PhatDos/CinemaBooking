import type { Href } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useThemeMode } from '@/src/theme';

import { ActionButton } from './components/ActionButton';
import { CandidateCard } from './components/CandidateCard';
import { ImportSummary } from './components/ImportSummary';
import { TrailerModal } from './components/TrailerModal';
import { useMovieImports } from './hooks/useMovieImports';
import { styles } from './styles';

const movieManageRoute = '/movies/manage' as Href;

export function MovieImportsScreen() {
  const dark = useThemeMode() === 'dark';
  const {
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
  } = useMovieImports();

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {error ? (
        <View style={[styles.center, dark && styles.centerDark]}>
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
              onRefresh={() => void refreshImports()}
            />
          }
          ListHeaderComponent={
            <View>
              <ScreenHeader
                backHref={movieManageRoute}
                title="Movie Import"
              />

              <View style={styles.actions}>
                <View style={styles.actionRow}>
                  <ActionButton
                    disabled={busy}
                    fill
                    label="Run full import"
                    loading={bulkAction === 'run'}
                    onPress={runFullImport}
                    variant="primary"
                  />
                </View>

                <View style={styles.actionRow}>
                  <ActionButton
                    disabled={busy || !selectedBatchId}
                    fill
                    label="Crawl all details"
                    loading={bulkAction === 'crawl'}
                    onPress={crawlAllCandidates}
                  />
                  <ActionButton
                    disabled={busy}
                    fill
                    label="Discover Moveek"
                    loading={bulkAction === 'discover'}
                    onPress={discoverImports}
                  />
                </View>
              </View>

              <View style={styles.summaryWrap}>
                <ImportSummary
                  batches={batches}
                  counts={counts}
                  selectedBatch={selectedBatch}
                  onSelectBatch={selectBatch}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, dark && styles.textDark]}>
                No import candidates
              </Text>
              <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>
                Discover Moveek movies to stage links.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.listItem}>
              <FadeInView delay={index * 35}>
                <CandidateCard
                  candidate={item}
                  loading={savingCandidateId === item.id}
                  onApprove={() => void approveCandidate(item)}
                  onCrawl={() => void crawlCandidate(item)}
                  onReject={() => setCandidateToReject(item)}
                  onTrailer={() => openTrailer(item)}
                />
              </FadeInView>
            </View>
          )}
        />
      )}
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
            void rejectCandidate(candidateToReject);
          }
        }}
        title="Reject import candidate?"
        visible={candidateToReject !== null}
      />
      <TrailerModal onClose={() => setTrailer(null)} trailer={trailer} />
    </View>
  );
}

function CenteredLoader() {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.centerDark]}>
      <ActivityIndicator color={dark ? '#ffffff' : undefined} size="large" />
    </View>
  );
}

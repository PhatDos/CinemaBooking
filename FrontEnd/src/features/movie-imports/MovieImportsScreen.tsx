import { router, type Href } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';

import { ActionButton } from './components/ActionButton';
import { CandidateCard } from './components/CandidateCard';
import { ImportSummary } from './components/ImportSummary';
import { TrailerModal } from './components/TrailerModal';
import { useMovieImports } from './hooks/useMovieImports';
import { styles } from './styles';

const movieManageRoute = '/movies/manage' as Href;

export function MovieImportsScreen() {
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
              onRefresh={() => void refreshImports()}
            />
          }
          ListHeaderComponent={
            <ImportSummary
              batches={batches}
              counts={counts}
              selectedBatch={selectedBatch}
              onSelectBatch={selectBatch}
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
                onApprove={() => void approveCandidate(item)}
                onCrawl={() => void crawlCandidate(item)}
                onReject={() => setCandidateToReject(item)}
                onTrailer={() => openTrailer(item)}
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
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

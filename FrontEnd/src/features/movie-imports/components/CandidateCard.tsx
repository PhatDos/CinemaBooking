import { Image } from 'expo-image';
import { ActivityIndicator, Linking, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import type { MovieImportCandidate, MovieImportCandidateStatus } from '@/src/types';

import { styles } from '../styles';
import {
  canApprove,
  canCrawl,
  canReject,
  formatDate,
  formatReleaseTimestamp,
  getCandidateGenreNames,
} from '../utils';

type CandidateCardProps = {
  candidate: MovieImportCandidate;
  loading: boolean;
  onApprove: () => void;
  onCrawl: () => void;
  onReject: () => void;
  onTrailer: () => void;
};

export function CandidateCard({
  candidate,
  loading,
  onApprove,
  onCrawl,
  onReject,
  onTrailer,
}: CandidateCardProps) {
  const sourceTitle = candidate.listingTitle ?? candidate.title;
  const genreNames = getCandidateGenreNames(candidate);

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
            <Text numberOfLines={3} style={styles.title}>
              {sourceTitle}
            </Text>
            <StatusBadge status={candidate.status} />
          </View>

          <Text style={styles.meta}>
            {candidate.durationMinutes
              ? `${candidate.durationMinutes} min`
              : 'No duration'}
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
            <Text numberOfLines={3} style={styles.warning}>
              {candidate.warnings}
            </Text>
          ) : null}

          {candidate.detailError ? (
            <Text numberOfLines={3} style={styles.warning}>
              {candidate.detailError}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text numberOfLines={3} style={styles.description}>
          {candidate.description ||
            'Discovered from listing. Crawl detail to load metadata.'}
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
            <AnimatedPressable contentStyle={styles.secondaryButton} onPress={onTrailer}>
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

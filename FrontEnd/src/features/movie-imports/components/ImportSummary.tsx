import { Pressable, Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme';
import type {
  MovieImportBatch,
  MovieImportCandidateStatus,
} from '@/src/types';

import { styles } from '../styles';
import { formatDateTime, formatShortDate } from '../utils';

type ImportSummaryProps = {
  batches: MovieImportBatch[];
  counts: Record<MovieImportCandidateStatus, number>;
  selectedBatch: MovieImportBatch | null;
  onSelectBatch: (batchId: string) => void;
};

export function ImportSummary({
  batches,
  counts,
  selectedBatch,
  onSelectBatch,
}: ImportSummaryProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={styles.summary}>
      <View style={[styles.summaryCard, dark && styles.summaryCardDark]}>
        <Text style={[styles.summaryLabel, dark && styles.mutedTextDark]}>Latest batch</Text>
        <Text style={[styles.summaryValue, dark && styles.textDark]}>
          {selectedBatch
            ? `${selectedBatch.source} | ${selectedBatch.status}`
            : 'No batch yet'}
        </Text>
        {selectedBatch ? (
          <Text style={[styles.summaryMeta, dark && styles.mutedTextDark]}>
            {selectedBatch.candidateCount} candidates |{' '}
            {formatDateTime(selectedBatch.startedAt)}
          </Text>
        ) : null}
        {selectedBatch ? (
          <Text style={[styles.summaryMeta, dark && styles.mutedTextDark]}>
            {counts.Discovered} discovered | {counts.Crawled} crawled |{' '}
            {counts.NeedsReview} review | {counts.Failed} failed
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
                dark && styles.batchChipDark,
                selectedBatch?.id === batch.id && styles.batchChipActive,
                selectedBatch?.id === batch.id && dark && styles.batchChipActiveDark,
              ]}>
              <Text
                style={[
                  styles.batchChipText,
                  dark && styles.mutedTextDark,
                  selectedBatch?.id === batch.id && !dark && styles.batchChipTextActive,
                  selectedBatch?.id === batch.id && dark && styles.batchChipTextActiveDark,
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

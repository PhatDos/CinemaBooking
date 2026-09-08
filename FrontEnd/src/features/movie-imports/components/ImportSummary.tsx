import { Pressable, Text, View } from 'react-native';

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
            {selectedBatch.candidateCount} candidates |{' '}
            {formatDateTime(selectedBatch.startedAt)}
          </Text>
        ) : null}
        {selectedBatch ? (
          <Text style={styles.summaryMeta}>
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

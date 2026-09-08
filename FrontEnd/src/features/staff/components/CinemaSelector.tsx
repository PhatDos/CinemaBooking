import { Pressable, Text, View } from 'react-native';

import { formatCinemaName } from '@/src/display';
import type { Cinema } from '@/src/types';

import { styles } from '../styles';
import { getCinemaCity } from '../utils';
import { EmptyPanel } from './EmptyPanel';

type CinemaSelectorProps = {
  cinemas: Cinema[];
  isStaff: boolean;
  saving: boolean;
  selectedCinemaId: string | null;
  onSelectCinema: (cinemaId: string) => void;
};

export function CinemaSelector({
  cinemas,
  isStaff,
  saving,
  selectedCinemaId,
  onSelectCinema,
}: CinemaSelectorProps) {
  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cinema</Text>
        <Text style={styles.sectionCount}>{cinemas.length}</Text>
      </View>
      {cinemas.length === 0 ? (
        <EmptyPanel
          body={
            isStaff
              ? 'No cinema has been assigned to this staff account.'
              : 'No active cinemas available.'
          }
          title="No cinemas"
        />
      ) : (
        <View style={styles.optionList}>
          {cinemas.map((cinema) => {
            const selected = cinema.id === selectedCinemaId;

            return (
              <Pressable
                disabled={saving}
                key={cinema.id}
                onPress={() => onSelectCinema(cinema.id)}
                style={[styles.optionRow, selected && styles.optionRowSelected]}>
                <View style={styles.radioOuter}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.optionText}>
                  <Text numberOfLines={1} style={styles.optionTitle}>
                    {formatCinemaName(cinema.name)}
                  </Text>
                  <Text numberOfLines={1} style={styles.optionMeta}>
                    {getCinemaCity(cinema)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

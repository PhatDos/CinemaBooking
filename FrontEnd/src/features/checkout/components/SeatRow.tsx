import { Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';
import { formatSeatFallback } from '../utils';

type SeatRowProps = {
  fallbackCount: number;
  labels: string[];
};

export function SeatRow({ labels, fallbackCount }: SeatRowProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, dark && styles.infoLabelDark]}>Seats</Text>
      {labels.length > 0 ? (
        <View style={styles.seatPills}>
          {labels.map((label) => (
            <View key={label} style={[styles.seatPill, dark && styles.seatPillDark]}>
              <Text style={[styles.seatPillText, dark && styles.seatPillTextDark]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.infoValue, dark && styles.infoValueDark]}>
          {formatSeatFallback(fallbackCount)}
        </Text>
      )}
    </View>
  );
}

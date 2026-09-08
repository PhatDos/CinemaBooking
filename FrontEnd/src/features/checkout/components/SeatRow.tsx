import { Text, View } from 'react-native';

import { styles } from '../styles';
import { formatSeatFallback } from '../utils';

type SeatRowProps = {
  fallbackCount: number;
  labels: string[];
};

export function SeatRow({ labels, fallbackCount }: SeatRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Seats</Text>
      {labels.length > 0 ? (
        <View style={styles.seatPills}>
          {labels.map((label) => (
            <View key={label} style={styles.seatPill}>
              <Text style={styles.seatPillText}>{label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.infoValue}>{formatSeatFallback(fallbackCount)}</Text>
      )}
    </View>
  );
}

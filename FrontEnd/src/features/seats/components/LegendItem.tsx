import { Text, View } from 'react-native';

import { styles } from '../styles';

type LegendItemProps = {
  color: string;
  label: string;
};

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

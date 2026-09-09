import { Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';

type LegendItemProps = {
  color: string;
  label: string;
};

export function LegendItem({ color, label }: LegendItemProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, dark && styles.legendSwatchDark, { backgroundColor: color }]} />
      <Text style={[styles.legendText, dark && styles.legendTextDark]}>{label}</Text>
    </View>
  );
}

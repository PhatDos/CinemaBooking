import { Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';

type InfoRowProps = {
  highlight?: boolean;
  label: string;
  value: string;
};

export function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, dark && styles.infoLabelDark]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          dark && styles.infoValueDark,
          highlight && styles.infoValueHighlight,
          highlight && dark && styles.infoValueHighlightDark,
        ]}>
        {value}
      </Text>
    </View>
  );
}

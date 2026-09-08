import { Text, View } from 'react-native';

import { styles } from '../styles';

type InfoRowProps = {
  highlight?: boolean;
  label: string;
  value: string;
};

export function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

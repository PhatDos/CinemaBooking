import { Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';

type EmptyPanelProps = {
  body: string;
  title: string;
};

export function EmptyPanel({ body, title }: EmptyPanelProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.emptyPanel, dark && styles.emptyPanelDark]}>
      <Text style={[styles.emptyTitle, dark && styles.textDark]}>{title}</Text>
      <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>{body}</Text>
    </View>
  );
}

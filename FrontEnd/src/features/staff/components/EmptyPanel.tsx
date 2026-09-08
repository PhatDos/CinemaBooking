import { Text, View } from 'react-native';

import { styles } from '../styles';

type EmptyPanelProps = {
  body: string;
  title: string;
};

export function EmptyPanel({ body, title }: EmptyPanelProps) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{body}</Text>
    </View>
  );
}

import { Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';

import { styles } from '../styles';

type StatusToggleProps = {
  active: boolean;
  disabled?: boolean;
  label?: string;
  onToggle: () => void;
};

export function StatusToggle({
  active,
  disabled = false,
  label = 'Status',
  onToggle,
}: StatusToggleProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable
        contentStyle={[styles.toggle, active ? styles.toggleActive : styles.toggleInactive]}
        disabled={disabled}
        onPress={onToggle}>
        <Text style={[styles.toggleText, active ? styles.toggleTextActive : styles.toggleTextInactive]}>
          {active ? 'Active' : 'Inactive'}
        </Text>
      </AnimatedPressable>
    </View>
  );
}

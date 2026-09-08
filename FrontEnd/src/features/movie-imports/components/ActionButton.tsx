import { ActivityIndicator, Text } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';

import { styles } from '../styles';

type ActionButtonProps = {
  disabled: boolean;
  fill?: boolean;
  label: string;
  loading: boolean;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
};

export function ActionButton({
  disabled,
  fill = false,
  label,
  loading,
  onPress,
  variant = 'neutral',
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      contentStyle={[
        styles.importActionButton,
        isPrimary
          ? styles.importActionButtonPrimary
          : styles.importActionButtonNeutral,
        fill && styles.importActionButtonFill,
        disabled && styles.importActionButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      pressableStyle={fill && styles.importActionPressableFill}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#111827'} />
      ) : (
        <Text
          style={
            isPrimary
              ? styles.importActionButtonTextPrimary
              : styles.importActionButtonTextNeutral
          }>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

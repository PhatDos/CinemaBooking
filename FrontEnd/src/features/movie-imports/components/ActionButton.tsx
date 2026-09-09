import { ActivityIndicator, Text } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useThemeMode } from '@/src/theme';

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
  const dark = useThemeMode() === 'dark';

  return (
    <AnimatedPressable
      contentStyle={[
        styles.importActionButton,
        isPrimary
          ? styles.importActionButtonPrimary
          : styles.importActionButtonNeutral,
        !isPrimary && dark && styles.importActionButtonNeutralDark,
        fill && styles.importActionButtonFill,
        disabled && styles.importActionButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      pressableStyle={fill && styles.importActionPressableFill}>
      {loading ? (
        <ActivityIndicator color={isPrimary || dark ? '#ffffff' : '#111827'} />
      ) : (
        <Text
          style={[
            isPrimary
              ? styles.importActionButtonTextPrimary
              : styles.importActionButtonTextNeutral,
            !isPrimary && dark && styles.textDark,
          ]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

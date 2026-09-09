import type { ComponentProps } from 'react';
import { Text, TextInput } from 'react-native';

import { useThemeMode } from '@/src/theme';

import { styles } from '../movie-form.styles';

type FieldProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label: string;
};

export function Field({ label, ...props }: FieldProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <>
      <Text style={[styles.label, dark && styles.textDark]}>{label}</Text>
      <TextInput
        placeholderTextColor={dark ? '#6e7683' : '#98a2b3'}
        style={[styles.input, dark && styles.inputDark]}
        {...props}
      />
    </>
  );
}

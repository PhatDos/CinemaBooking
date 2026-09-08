import type { ComponentProps } from 'react';
import { Text, TextInput } from 'react-native';

import { styles } from '../movie-form.styles';

type FieldProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label: string;
};

export function Field({ label, ...props }: FieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#98a2b3"
        style={styles.input}
        {...props}
      />
    </>
  );
}

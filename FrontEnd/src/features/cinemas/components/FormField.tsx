import type { ComponentProps } from 'react';
import { Text, TextInput, View } from 'react-native';

import { styles } from '../styles';

type FormFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
};

export function FormField({ label, style, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#98a2b3"
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { colors, radius, shadow } from '@/src/theme';

export default function LoginScreen() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      router.replace('/');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Cannot login';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const disabled = submitting || !email.trim() || !password;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <FadeInView style={styles.form}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>CB</Text>
        </View>

        <Text style={styles.kicker}>Welcome back</Text>
        <Text style={styles.title}>Cinema Booking</Text>
        <Text style={styles.subtitle}>Sign in to reserve seats, pay securely, and manage your tickets.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          inputMode="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#98a2b3"
          style={styles.input}
          value={email}
        />

        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#98a2b3"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AnimatedPressable
          disabled={disabled}
          onPress={handleLogin}
          contentStyle={[styles.button, disabled && styles.buttonDisabled]}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </AnimatedPressable>
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 22,
    ...shadow.card,
  },
  brandMark: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  brandMarkText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  kicker: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  input: {
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#fbfcfe',
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  error: {
    marginBottom: 14,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
});

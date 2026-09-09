import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/auth/AuthContext';
import { AppNotificationProvider } from '@/src/components/AppNotification';
import { ThemeProvider, useThemeMode } from '@/src/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppNotificationProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppNotificationProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const themeMode = useThemeMode();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      </Stack>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

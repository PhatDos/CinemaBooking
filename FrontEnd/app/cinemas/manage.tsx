import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { CinemaManageScreen } from '@/src/features/cinemas/CinemaManageScreen';
import { styles } from '@/src/features/cinemas/styles';

export default function CinemaManageRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/movies" />;
  }

  return <CinemaManageScreen />;
}

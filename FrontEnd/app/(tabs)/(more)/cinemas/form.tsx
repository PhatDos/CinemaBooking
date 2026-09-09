import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { CinemaFormScreen } from '@/src/features/cinemas/CinemaFormScreen';
import { styles } from '@/src/features/cinemas/styles';

export default function CinemaFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const cinemaId = Array.isArray(id) ? id[0] : id;

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

  return <CinemaFormScreen cinemaId={cinemaId} />;
}

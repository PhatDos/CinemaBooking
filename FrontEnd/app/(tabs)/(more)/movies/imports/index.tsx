import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { MovieImportsScreen } from '@/src/features/movie-imports/MovieImportsScreen';
import { styles } from '@/src/features/movie-imports/styles';

export default function MovieImportsRoute() {
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

  return <MovieImportsScreen />;
}

import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import MovieFormScreen from '@/src/features/movies/MovieFormScreen';
import { styles } from '@/src/features/movies/movie-form.styles';

export default function MovieFormRoute() {
  const { movieId } = useLocalSearchParams<{ movieId?: string }>();
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

  return <MovieFormScreen movieId={movieId} />;
}

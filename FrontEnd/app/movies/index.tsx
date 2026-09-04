import { router, Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMovies } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import type { Movie } from '@/src/types';

const scanTicketRoute = '/staff/scan-ticket' as Href;

export default function MoviesScreen() {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadMovies(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getMovies();
      setMovies(result);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load movies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadMovies();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  const canCheckIn = user?.roles.some((role) => role === 'Staff' || role === 'Admin') ?? false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Movies</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.actions}>
          {canCheckIn && (
            <Pressable onPress={() => router.push(scanTicketRoute)} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionText}>Scan Ticket</Text>
            </Pressable>
          )}

          <Pressable onPress={() => router.push('/bookings')} style={styles.actionButton}>
            <Text style={styles.actionText}>My Bookings</Text>
          </Pressable>

          <Pressable onPress={signOut} style={styles.actionButton}>
            <Text style={styles.actionText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadMovies()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={movies}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                loadMovies(false);
              }}
              refreshing={refreshing}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/movies/[id]',
                  params: { id: item.id },
                })
              }
              style={styles.card}>
              <View style={styles.poster}>
                <Text style={styles.posterText}>{getInitials(item.title)}</Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.durationMinutes} min</Text>
                <Text style={styles.meta}>Release: {formatDate(item.releaseDate)}</Text>
                <Text style={styles.detail}>View details</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  heading: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryActionButton: {
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 20,
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  poster: {
    width: 96,
    minHeight: 144,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  posterText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    padding: 14,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 14,
  },
  detail: {
    marginTop: 16,
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  error: {
    color: '#b91c1c',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

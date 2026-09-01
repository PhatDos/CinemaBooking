import { router, Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMovieById, getMovieShowtimes } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import type { MovieDetail, Showtime } from '@/src/types';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id || !isAuthenticated) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [movieResult, showtimeResult] = await Promise.all([
          getMovieById(id),
          getMovieShowtimes(id),
        ]);

        setMovie(movieResult);
        setShowtimes(showtimeResult);
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load movie');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isAuthenticated]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  if (error || !movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Movie not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back</Text>
      </Pressable>

      <View style={styles.poster}>
        <Text style={styles.posterText}>{getInitials(movie.title)}</Text>
      </View>

      <Text style={styles.title}>{movie.title}</Text>

      {movie.description ? <Text style={styles.description}>{movie.description}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{movie.durationMinutes} min</Text>
        <Text style={styles.meta}>Release: {formatDate(movie.releaseDate)}</Text>
      </View>

      <Text style={styles.heading}>Showtimes</Text>

      {showtimes.length === 0 ? (
        <Text style={styles.empty}>No showtimes available</Text>
      ) : (
        showtimes.map((showtime) => (
          <Pressable
            key={showtime.id}
            onPress={() =>
              router.push({
                pathname: '/seats/[showtimeId]',
                params: { showtimeId: showtime.id },
              })
            }
            style={styles.showtime}>
            <Text style={styles.showtimeTime}>{formatDateTime(showtime.startTime)}</Text>
            <Text style={styles.meta}>Room: {showtime.roomId}</Text>
            <Text style={styles.meta}>Price: {formatCurrency(showtime.basePrice)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
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
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLinkText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  poster: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  posterText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    marginTop: 24,
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
  },
  description: {
    marginTop: 12,
    color: '#374151',
    fontSize: 16,
    lineHeight: 23,
  },
  metaRow: {
    gap: 6,
    marginTop: 16,
  },
  meta: {
    color: '#6b7280',
    fontSize: 14,
  },
  heading: {
    marginTop: 32,
    marginBottom: 14,
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  showtime: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  showtimeTime: {
    marginBottom: 8,
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  empty: {
    color: '#6b7280',
    fontSize: 15,
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
  backButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

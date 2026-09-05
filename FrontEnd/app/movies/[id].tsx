import { router, Redirect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById, getMovieShowtimes } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatVenueName } from '@/src/display';
import type { MovieDetail, Showtime } from '@/src/types';
import { styles } from '@/src/styles/screens/movie-detail.styles';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [venueLabels, setVenueLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVenueLabels = useCallback(async (items: Showtime[]) => {
    const uniqueRoomIds = Array.from(new Set(items.map((item) => item.roomId)));
    const entries = await Promise.all(
      uniqueRoomIds.map(async (roomId) => {
        try {
          const room = await getRoom(roomId);
          const cinema = await getCinema(room.cinemaId);

          return [roomId, formatVenueName(cinema.name, room.name)] as const;
        } catch (venueError) {
          console.error(venueError);
          return [roomId, 'Room details unavailable'] as const;
        }
      }),
    );

    setVenueLabels(Object.fromEntries(entries));
  }, []);

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
        void loadVenueLabels(showtimeResult);
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load movie');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isAuthenticated, loadVenueLabels]);

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Back</Text>
        </AnimatedPressable>

        <FadeInView>
          <View style={styles.poster}>
            {movie.posterUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: movie.posterUrl }}
                style={StyleSheet.absoluteFill}
                transition={300}
              />
            ) : (
              <Text style={styles.posterText}>{getInitials(movie.title)}</Text>
            )}
          </View>
        </FadeInView>

        <Text style={styles.title}>{movie.title}</Text>

        {movie.description ? <Text style={styles.description}>{movie.description}</Text> : null}

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{movie.durationMinutes} min</Text>
          <Text style={styles.meta}>Release: {formatDate(movie.releaseDate)}</Text>
          {movie.genre ? <Text style={styles.genre}>{movie.genre}</Text> : null}
        </View>

        {movie.trailerUrl ? (
          <AnimatedPressable
            contentStyle={styles.trailerButton}
            onPress={() => void Linking.openURL(movie.trailerUrl!)}>
            <Text style={styles.trailerText}>Open trailer</Text>
          </AnimatedPressable>
        ) : null}

        <Text style={styles.heading}>Showtimes</Text>

        {showtimes.length === 0 ? (
          <Text style={styles.empty}>No showtimes available</Text>
        ) : (
          showtimes.map((showtime, index) => (
            <FadeInView delay={index * 45 + 80} key={showtime.id}>
              <AnimatedPressable
                contentStyle={styles.showtime}
                onPress={() =>
                  router.push({
                    pathname: '/seats/[showtimeId]',
                    params: { showtimeId: showtime.id },
                  })
                }>
                <View style={styles.showtimeInfo}>
                  <Text style={styles.showtimeTime}>{formatDateTime(showtime.startTime)}</Text>
                  <Text style={styles.meta}>{venueLabels[showtime.roomId] ?? 'Loading room...'}</Text>
                </View>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>{formatCurrency(showtime.basePrice)}</Text>
                </View>
              </AnimatedPressable>
            </FadeInView>
          ))
        )}
      </ScrollView>

      <BottomNav />
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
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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

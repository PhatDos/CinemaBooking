import { router, Redirect, type Href } from 'expo-router';
import { Image } from 'expo-image';
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
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import type { Movie } from '@/src/types';
import { styles } from '@/src/styles/screens/movies.styles';

const scanTicketRoute = '/staff/scan-ticket' as Href;

export default function MoviesScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
      const timeoutId = setTimeout(() => {
        void loadMovies();
      }, 0);

      return () => clearTimeout(timeoutId);
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
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Cinema Booking</Text>
          <Text style={styles.heading}>Now Showing</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.actions}>
          {canCheckIn && (
            <AnimatedPressable
              contentStyle={styles.primaryActionButton}
              onPress={() => router.push(scanTicketRoute)}>
              <Text style={styles.primaryActionText}>Scan Ticket</Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable
            contentStyle={styles.actionButton}
            onPress={() => router.push('/bookings')}>
            <Text style={styles.actionText}>My Bookings</Text>
          </AnimatedPressable>

          <LogoutButton style={styles.actionButton} textStyle={styles.actionText} />
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
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 45}>
              <AnimatedPressable
                contentStyle={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/movies/[id]',
                    params: { id: item.id },
                  })
                }>
                <View style={styles.poster}>
                  {item.posterUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: item.posterUrl }}
                      style={StyleSheet.absoluteFill}
                      transition={250}
                    />
                  ) : (
                    <Text style={styles.posterText}>{getInitials(item.title)}</Text>
                  )}
                  {item.genre ? (
                    <View style={styles.posterBadge}>
                      <Text style={styles.posterBadgeText}>{item.genre}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.info}>
                  <Text numberOfLines={2} style={styles.title}>
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{item.durationMinutes} min</Text>
                    <Text style={styles.dot}>|</Text>
                    <Text style={styles.meta}>{formatDate(item.releaseDate)}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.description}>
                    {item.description || 'No description yet.'}
                  </Text>
                  <Text style={styles.detail}>View showtimes</Text>
                </View>
              </AnimatedPressable>
            </FadeInView>
          )}
        />
      )}

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

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

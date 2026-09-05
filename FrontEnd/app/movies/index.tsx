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
import { BottomNav, bottomNavHeight } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import { colors, radius, shadow } from '@/src/theme';
import type { Movie } from '@/src/types';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryActionButton: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  list: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: bottomNavHeight + 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  poster: {
    width: 110,
    minHeight: 164,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  posterText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  posterBadge: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(16, 24, 40, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  posterBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  info: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  detail: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '600',
  },
});

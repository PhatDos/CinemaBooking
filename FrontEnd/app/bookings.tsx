import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getBookings } from '@/src/api/bookings';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav, bottomNavHeight } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import { formatVenueName } from '@/src/display';
import { colors, radius, shadow } from '@/src/theme';
import type { Booking, BookingStatus } from '@/src/types';

export default function BookingsScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showtimeLabels, setShowtimeLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadShowtimeLabels = useCallback(async (items: Booking[]) => {
    const uniqueShowtimeIds = Array.from(new Set(items.map((item) => item.showtimeId)));
    const entries = await Promise.all(
      uniqueShowtimeIds.map(async (showtimeId) => {
        try {
          const showtime = await getShowtimeById(showtimeId);
          const [movie, room] = await Promise.all([
            getMovieById(showtime.movieId),
            getRoom(showtime.roomId),
          ]);
          const cinema = await getCinema(room.cinemaId);

          return [
            showtimeId,
            `${movie.title} | ${formatDateTime(showtime.startTime)} | ${formatVenueName(cinema.name, room.name)}`,
          ] as const;
        } catch (labelError) {
          console.error(labelError);
          return [showtimeId, 'Showtime details unavailable'] as const;
        }
      }),
    );

    setShowtimeLabels(Object.fromEntries(entries));
  }, []);

  const loadBookings = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getBookings();
      setBookings(result);
      void loadShowtimeLabels(result);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadShowtimeLabels]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadBookings();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loadBookings]);

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>My Bookings</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.actions}>
          <AnimatedPressable
            contentStyle={styles.actionButton}
            onPress={() => router.replace('/movies')}>
            <Text style={styles.actionText}>Movies</Text>
          </AnimatedPressable>

          <LogoutButton style={styles.actionButton} textStyle={styles.actionText} />
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadBookings()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={bookings.length === 0 ? styles.emptyList : styles.list}
          data={bookings}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Choose a movie and reserve your first seats.</Text>
              <Pressable onPress={() => router.replace('/movies')} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Browse movies</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadBookings(false);
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
                    pathname: '/checkout/[bookingId]',
                    params: { bookingId: item.id },
                  })
                }>
                <View style={styles.cardHeader}>
                  <View style={styles.bookingTitleBlock}>
                    <Text style={styles.bookingId}>Booking</Text>
                    <Text style={styles.date}>Created: {formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.badge, getStatusBadgeStyle(item.status)]}>
                    <Text style={[styles.badgeText, getStatusBadgeTextStyle(item.status)]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingMetaGrid}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Seats</Text>
                    <Text style={styles.metaValue}>{item.seatIds.length}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Showtime</Text>
                    <Text numberOfLines={3} style={styles.metaValue}>
                      {showtimeLabels[item.showtimeId] ?? 'Loading details...'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
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

function normalizeStatus(status: BookingStatus) {
  return status.toLowerCase();
}

function getStatusLabel(status: BookingStatus) {
  const normalized = normalizeStatus(status);

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusBadgeStyle(status: BookingStatus) {
  switch (normalizeStatus(status)) {
    case 'confirmed':
      return styles.badgeConfirmed;
    case 'expired':
      return styles.badgeExpired;
    case 'cancelled':
      return styles.badgeCancelled;
    default:
      return styles.badgePending;
  }
}

function getStatusBadgeTextStyle(status: BookingStatus) {
  switch (normalizeStatus(status)) {
    case 'confirmed':
      return styles.badgeTextConfirmed;
    case 'expired':
      return styles.badgeTextExpired;
    case 'cancelled':
      return styles.badgeTextCancelled;
    default:
      return styles.badgeTextPending;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    color: colors.ink,
    fontSize: 32,
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
  actionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 20,
    paddingBottom: bottomNavHeight + 24,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: bottomNavHeight + 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  bookingId: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  bookingTitleBlock: {
    flex: 1,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePending: {
    backgroundColor: '#e0f2fe',
  },
  badgeConfirmed: {
    backgroundColor: '#dcfce7',
  },
  badgeExpired: {
    backgroundColor: '#fee2e2',
  },
  badgeCancelled: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  badgeTextPending: {
    color: colors.blue,
  },
  badgeTextConfirmed: {
    color: colors.success,
  },
  badgeTextExpired: {
    color: colors.danger,
  },
  badgeTextCancelled: {
    color: colors.muted,
  },
  bookingMetaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metaBlock: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  total: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  date: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
});

import {
  Redirect,
  router } from 'expo-router';
import { useCallback,
  useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { getBookings } from '@/src/api/bookings';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import { formatVenueName } from '@/src/display';
import type { Booking, BookingStatus } from '@/src/types';
import { styles } from '@/src/styles/screens/bookings.styles';

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

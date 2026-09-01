import { Redirect, router } from 'expo-router';
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

import { getBookings } from '@/src/api/bookings';
import { useAuth } from '@/src/auth/AuthContext';
import type { Booking, BookingStatus } from '@/src/types';

export default function BookingsScreen() {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadBookings(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getBookings();
      setBookings(result);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadBookings();
    }
  }, [isAuthenticated]);

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
          <Pressable onPress={() => router.replace('/movies')} style={styles.actionButton}>
            <Text style={styles.actionText}>Movies</Text>
          </Pressable>

          <Pressable onPress={signOut} style={styles.actionButton}>
            <Text style={styles.actionText}>Logout</Text>
          </Pressable>
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/checkout/[bookingId]',
                  params: { bookingId: item.id },
                })
              }
              style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bookingId}>#{item.id.slice(0, 8)}</Text>
                <View style={[styles.badge, getStatusBadgeStyle(item.status)]}>
                  <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              <Text style={styles.meta}>Showtime: {item.showtimeId}</Text>
              <Text style={styles.meta}>Seats: {item.seatIds.length}</Text>
              <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
              <Text style={styles.date}>Created: {formatDate(item.createdAt)}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  actionText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  bookingId: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePending: {
    backgroundColor: '#dbeafe',
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
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    color: '#4b5563',
    fontSize: 14,
  },
  total: {
    marginTop: 12,
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  date: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
    fontSize: 16,
  },
});

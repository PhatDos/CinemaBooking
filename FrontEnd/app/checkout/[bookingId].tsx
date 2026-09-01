import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getBooking } from '@/src/api/bookings';
import { ApiError } from '@/src/api/client';
import { payBooking } from '@/src/api/payments';
import { useAuth } from '@/src/auth/AuthContext';
import type { Booking, Payment } from '@/src/types';

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId || !isAuthenticated) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await getBooking(bookingId);
        setBooking(result);
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load booking');
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [bookingId, isAuthenticated]);

  async function handlePay() {
    if (!bookingId || paying || payment?.status === 'Succeeded') {
      return;
    }

    setPaying(true);
    setError('');

    try {
      const result = await payBooking(bookingId);
      const refreshed = await getBooking(bookingId);

      setPayment(result);
      setBooking(refreshed);
    } catch (payError) {
      console.error(payError);
      setError(getPaymentErrorMessage(payError));
    } finally {
      setPaying(false);
    }
  }

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Booking not found'}</Text>
        <Pressable onPress={() => router.replace('/movies')} style={styles.button}>
          <Text style={styles.buttonText}>Back to movies</Text>
        </Pressable>
      </View>
    );
  }

  const paid = payment?.status === 'Succeeded' || isConfirmed(booking.status);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Pressable onPress={() => router.replace('/movies')} style={styles.backLink}>
        <Text style={styles.backLinkText}>Movies</Text>
      </Pressable>

      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.text}>Booking: {booking.id}</Text>

      <View style={styles.panel}>
        <InfoRow label="Status" value={booking.status} />
        <InfoRow label="Seats" value={booking.seatIds.length.toString()} />
        <InfoRow label="Total" value={formatCurrency(booking.totalAmount)} />
        <InfoRow label="Expires" value={booking.expiresAt ? formatDate(booking.expiresAt) : '-'} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        disabled={paying || paid}
        onPress={handlePay}
        style={[styles.button, (paying || paid) && styles.buttonDisabled]}>
        {paying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{paid ? 'Paid' : 'Pay now'}</Text>
        )}
      </Pressable>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function isConfirmed(status: string) {
  return status === 'CONFIRMED' || status === 'Confirmed';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'Booking is no longer payable.' : error.message;
  }

  return 'Cannot complete payment';
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
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
  title: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
  },
  text: {
    marginTop: 12,
    color: '#374151',
    fontSize: 14,
  },
  panel: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 9,
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  button: {
    marginTop: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  error: {
    marginTop: 18,
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
});

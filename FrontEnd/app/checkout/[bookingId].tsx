import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getBooking } from '@/src/api/bookings';
import { ApiError } from '@/src/api/client';
import { getPayment, payBooking } from '@/src/api/payments';
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

  useEffect(() => {
    if (!payment?.id || payment.status !== 'Pending' || !isAuthenticated) {
      return;
    }

    let cancelled = false;
    const paymentId = payment.id;

    async function pollPayment() {
      while (!cancelled) {
        await sleep(2500);

        if (cancelled) {
          return;
        }

        try {
          const refreshedPayment = await getPayment(paymentId);
          setPayment(refreshedPayment);

          if (refreshedPayment.status === 'Succeeded') {
            const refreshedBooking = await getBooking(refreshedPayment.bookingId);
            setBooking(refreshedBooking);
            return;
          }
        } catch (pollError) {
          console.error(pollError);
        }
      }
    }

    void pollPayment();

    return () => {
      cancelled = true;
    };
  }, [payment?.id, payment?.status, isAuthenticated]);

  async function handlePay() {
    if (
      !bookingId ||
      !booking ||
      paying ||
      normalizeStatus(booking.status) !== 'pending' ||
      payment?.status === 'Succeeded'
    ) {
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

  const status = normalizeStatus(booking.status);
  const paid = payment?.status === 'Succeeded' || status === 'confirmed';
  const hasPaymentLink = payment?.status === 'Pending' && !!payment.checkoutUrl;
  const canPay = status === 'pending' && !paid && !hasPaymentLink;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Pressable onPress={() => router.replace('/movies')} style={styles.backLink}>
        <Text style={styles.backLinkText}>Movies</Text>
      </Pressable>

      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.text}>Booking: {booking.id}</Text>

      <View style={styles.panel}>
        <InfoRow label="Status" value={getStatusLabel(status)} />
        <InfoRow label="Seats" value={booking.seatIds.length.toString()} />
        <InfoRow label="Total" value={formatCurrency(booking.totalAmount)} />
        <InfoRow label="Expires" value={booking.expiresAt ? formatDate(booking.expiresAt) : '-'} />
      </View>

      <Text style={styles.stateText}>{getCheckoutStateText(status, paid)}</Text>

      {hasPaymentLink ? (
        <Pressable
          onPress={() => void Linking.openURL(payment.checkoutUrl!)}
          style={styles.paymentLinkButton}>
          <Text style={styles.paymentLinkText}>Open PayOS checkout</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        disabled={paying || !canPay}
        onPress={handlePay}
        style={[styles.button, (paying || !canPay) && styles.buttonDisabled]}>
        {paying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText(status, paid)}</Text>
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

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCheckoutStateText(status: string, paid: boolean) {
  if (paid || status === 'confirmed') {
    return 'Payment completed';
  }

  if (status === 'expired') {
    return 'Booking expired';
  }

  if (status === 'cancelled') {
    return 'Booking cancelled';
  }

  return 'Pending payment';
}

function getButtonText(status: string, paid: boolean) {
  if (paid || status === 'confirmed') {
    return 'Payment completed';
  }

  if (status === 'expired') {
    return 'Booking expired';
  }

  if (status === 'cancelled') {
    return 'Booking cancelled';
  }

  return 'Pay now';
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

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  stateText: {
    marginTop: 18,
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
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
  paymentLinkButton: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paymentLinkText: {
    color: '#111827',
    fontWeight: '700',
  },
  error: {
    marginTop: 18,
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
});

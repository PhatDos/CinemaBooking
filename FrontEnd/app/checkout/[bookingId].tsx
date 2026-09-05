import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getBooking } from '@/src/api/bookings';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { ApiError } from '@/src/api/client';
import { getMovieById } from '@/src/api/movies';
import { getPayment, getPaymentByBooking, payBooking } from '@/src/api/payments';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav, bottomNavHeight } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatDateTime, formatVenueName } from '@/src/display';
import { colors, radius, shadow } from '@/src/theme';
import type { Booking, Payment } from '@/src/types';

type CheckoutContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  startTime: string;
};

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext | null>(null);

  const loadCheckoutContext = useCallback(async (showtimeId: string) => {
    try {
      const showtime = await getShowtimeById(showtimeId);
      const [movie, room] = await Promise.all([
        getMovieById(showtime.movieId),
        getRoom(showtime.roomId),
      ]);
      const cinema = await getCinema(room.cinemaId);

      setCheckoutContext({
        cinemaName: cinema.name,
        movieTitle: movie.title,
        roomName: room.name,
        startTime: showtime.startTime,
      });
    } catch (contextError) {
      console.error(contextError);
      setCheckoutContext(null);
    }
  }, []);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId || !isAuthenticated) {
        return;
      }

      setLoading(true);
      setError('');
      setPayment(null);

      try {
        const result = await getBooking(bookingId);
        setBooking(result);
        void loadCheckoutContext(result.showtimeId);

        try {
          const existingPayment = await getPaymentByBooking(bookingId);
          setPayment(existingPayment);
        } catch (paymentLoadError) {
          if (paymentLoadError instanceof ApiError && paymentLoadError.status === 404) {
            setPayment(null);
          } else {
            console.error(paymentLoadError);
          }
        }
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load booking');
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [bookingId, isAuthenticated, loadCheckoutContext]);

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topActions}>
        <AnimatedPressable contentStyle={styles.backLink} onPress={goBack}>
          <Text style={styles.backLinkText}>Go back</Text>
        </AnimatedPressable>

        <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.replace('/movies')}>
          <Text style={styles.backLinkText}>Movies</Text>
        </AnimatedPressable>
      </View>

      <FadeInView>
        <Text style={styles.kicker}>Payment</Text>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.text}>
          {checkoutContext
            ? `${checkoutContext.movieTitle} | ${formatDateTime(checkoutContext.startTime)}`
            : 'Loading booking details...'}
        </Text>
      </FadeInView>

      <FadeInView delay={70}>
        <View style={styles.panel}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>Current status</Text>
              <Text style={styles.stateText}>{getCheckoutStateText(status, paid)}</Text>
            </View>
            <View style={[styles.statusPill, getStatusPillStyle(status, paid)]}>
              <Text style={[styles.statusPillText, getStatusPillTextStyle(status, paid)]}>
                {paid ? 'Paid' : getStatusLabel(status)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <InfoRow label="Seats" value={booking.seatIds.length.toString()} />
          <InfoRow label="Total" value={formatCurrency(booking.totalAmount)} highlight />
          {checkoutContext ? (
            <InfoRow label="Cinema" value={formatVenueName(checkoutContext.cinemaName, checkoutContext.roomName)} />
          ) : null}
          <InfoRow label="Expires" value={booking.expiresAt ? formatDate(booking.expiresAt) : '-'} />
        </View>
      </FadeInView>

      {hasPaymentLink ? (
        <AnimatedPressable
          contentStyle={styles.paymentLinkButton}
          onPress={() => void Linking.openURL(payment.checkoutUrl!)}
          pressedScale={0.97}>
          <Text style={styles.paymentLinkText}>Open PayOS checkout</Text>
        </AnimatedPressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AnimatedPressable
        disabled={paying || !canPay}
        onPress={handlePay}
        contentStyle={[styles.button, (paying || !canPay) && styles.buttonDisabled]}>
        {paying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText(status, paid)}</Text>
        )}
      </AnimatedPressable>
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

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

function goBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/movies');
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

function getStatusPillStyle(status: string, paid: boolean) {
  if (paid || status === 'confirmed') {
    return styles.statusPillSuccess;
  }

  if (status === 'expired' || status === 'cancelled') {
    return styles.statusPillDanger;
  }

  return styles.statusPillPending;
}

function getStatusPillTextStyle(status: string, paid: boolean) {
  if (paid || status === 'confirmed') {
    return styles.statusPillTextSuccess;
  }

  if (status === 'expired' || status === 'cancelled') {
    return styles.statusPillTextDanger;
  }

  return styles.statusPillTextPending;
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: bottomNavHeight + 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  backLink: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLinkText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  text: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  panel: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadow.card,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: '#eef1f5',
  },
  stateText: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillPending: {
    backgroundColor: '#e0f2fe',
  },
  statusPillSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusPillDanger: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusPillTextPending: {
    color: colors.blue,
  },
  statusPillTextSuccess: {
    color: colors.success,
  },
  statusPillTextDanger: {
    color: colors.danger,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 9,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  button: {
    marginTop: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...shadow.soft,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  paymentLinkButton: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff7f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paymentLinkText: {
    color: colors.primary,
    fontWeight: '900',
  },
  error: {
    marginTop: 18,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});

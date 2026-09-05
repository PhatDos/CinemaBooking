import {
  Redirect,
  router,
  useLocalSearchParams } from 'expo-router';
import { useCallback,
  useEffect,
  useState } from 'react';
import { ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { cancelBooking, getBooking } from '@/src/api/bookings';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { ApiError } from '@/src/api/client';
import { getMovieById } from '@/src/api/movies';
import { getPayment, getPaymentByBooking, payBooking } from '@/src/api/payments';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { formatDateTime, formatVenueName } from '@/src/display';
import type { Booking, Payment } from '@/src/types';
import { styles } from '@/src/styles/screens/checkout.styles';

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
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [canceling, setCanceling] = useState(false);
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

          if (refreshedPayment.status === 'Succeeded' && refreshedPayment.bookingId) {
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

  function handleGoBack() {
    if (!booking) {
      router.replace('/movies');
      return;
    }

    const currentStatus = normalizeStatus(booking.status);
    const hasActivePayment =
      payment?.status === 'Pending' ||
      payment?.status === 'Succeeded' ||
      payment?.fulfillmentStatus === 'Conflict';

    if (currentStatus === 'pending' && !hasActivePayment) {
      setCancelDialogVisible(true);
      return;
    }

    if (currentStatus === 'expired' || currentStatus === 'cancelled') {
      router.replace({
        pathname: '/seats/[showtimeId]',
        params: { showtimeId: booking.showtimeId },
      });
      return;
    }

    router.replace('/bookings');
  }

  async function handleConfirmCancelBooking() {
    if (!booking || canceling) {
      return;
    }

    setCanceling(true);
    setError('');

    try {
      await cancelBooking(booking.id);
      setCancelDialogVisible(false);
      router.replace({
        pathname: '/seats/[showtimeId]',
        params: { showtimeId: booking.showtimeId },
      });
    } catch (cancelError) {
      console.error(cancelError);
      setCancelDialogVisible(false);
      setError(getCancelErrorMessage(cancelError));
    } finally {
      setCanceling(false);
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
  const fulfillmentConflict = payment?.fulfillmentStatus === 'Conflict';
  const paid = !fulfillmentConflict && (payment?.status === 'Succeeded' || status === 'confirmed');
  const hasPaymentLink = payment?.status === 'Pending' && !!payment.checkoutUrl;
  const canPay = status === 'pending' && !paid && !hasPaymentLink && !fulfillmentConflict;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topActions}>
        <AnimatedPressable
          contentStyle={styles.backLink}
          disabled={canceling}
          onPress={handleGoBack}>
          <Text style={styles.backLinkText}>Go back</Text>
        </AnimatedPressable>

        <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.replace('/bookings')}>
          <Text style={styles.backLinkText}>My bookings</Text>
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
              <Text style={styles.stateText}>{getCheckoutStateText(status, paid, fulfillmentConflict)}</Text>
            </View>
            <View style={[styles.statusPill, getStatusPillStyle(status, paid, fulfillmentConflict)]}>
              <Text style={[styles.statusPillText, getStatusPillTextStyle(status, paid, fulfillmentConflict)]}>
                {fulfillmentConflict ? 'Support' : paid ? 'Paid' : getStatusLabel(status)}
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
      {fulfillmentConflict ? (
        <Text style={styles.error}>
          Payment received, but these seats could not be confirmed. Please contact staff for support.
        </Text>
      ) : null}

      <AnimatedPressable
        disabled={paying || !canPay}
        onPress={handlePay}
        contentStyle={[styles.button, (paying || !canPay) && styles.buttonDisabled]}>
        {paying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText(status, paid, fulfillmentConflict)}</Text>
        )}
      </AnimatedPressable>
      </ScrollView>

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Stay"
        confirmLabel="Cancel booking"
        destructive
        loading={canceling}
        message="Leaving checkout before payment will cancel this booking and release the selected seats."
        onCancel={() => {
          if (!canceling) {
            setCancelDialogVisible(false);
          }
        }}
        onConfirm={handleConfirmCancelBooking}
        title="Cancel this booking?"
        visible={cancelDialogVisible}
      />
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

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCheckoutStateText(status: string, paid: boolean, fulfillmentConflict: boolean) {
  if (fulfillmentConflict) {
    return 'Payment needs support';
  }

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

function getButtonText(status: string, paid: boolean, fulfillmentConflict: boolean) {
  if (fulfillmentConflict) {
    return 'Contact support';
  }

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

function getStatusPillStyle(status: string, paid: boolean, fulfillmentConflict: boolean) {
  if (fulfillmentConflict) {
    return styles.statusPillDanger;
  }

  if (paid || status === 'confirmed') {
    return styles.statusPillSuccess;
  }

  if (status === 'expired' || status === 'cancelled') {
    return styles.statusPillDanger;
  }

  return styles.statusPillPending;
}

function getStatusPillTextStyle(status: string, paid: boolean, fulfillmentConflict: boolean) {
  if (fulfillmentConflict) {
    return styles.statusPillTextDanger;
  }

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

function getCancelErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'Booking can no longer be cancelled.'
      : error.message;
  }

  return 'Cannot cancel booking';
}

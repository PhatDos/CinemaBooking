import {
  router,
} from 'expo-router';
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
import { getPayment, getPaymentByBooking } from '@/src/api/payments';
import { getSeatAvailability } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { formatDateTime, formatVenueName, getSeatLabel } from '@/src/display';
import type { Booking, Payment } from '@/src/types';
import { styles } from '@/src/features/checkout/styles';

import { InfoRow } from './components/InfoRow';
import { SeatRow } from './components/SeatRow';
import {
  formatCurrency,
  formatDate,
  getButtonText,
  getCancelErrorMessage,
  getCheckoutStateText,
  getStatusLabel,
  normalizeStatus,
  sleep,
  type CheckoutContext,
} from './utils';

type BookingCheckoutScreenProps = {
  bookingId: string;
};

export default function CheckoutScreen({ bookingId }: BookingCheckoutScreenProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext | null>(null);

  const loadCheckoutContext = useCallback(async (showtimeId: string, seatIds: string[]) => {
    try {
      const showtime = await getShowtimeById(showtimeId);
      const [movie, room, seats] = await Promise.all([
        getMovieById(showtime.movieId),
        getRoom(showtime.roomId),
        getSeatAvailability(showtimeId),
      ]);
      const cinema = await getCinema(room.cinemaId);
      const seatLabelsById = new Map(
        seats.map((seat) => [seat.seatId, getSeatLabel(seat)]),
      );

      setCheckoutContext({
        cinemaName: cinema.name,
        movieTitle: movie.title,
        roomName: room.name,
        seatLabels: seatIds
          .map((seatId) => seatLabelsById.get(seatId))
          .filter((label): label is string => Boolean(label)),
        startTime: showtime.startTime,
      });
    } catch (contextError) {
      console.error(contextError);
      setCheckoutContext(null);
    }
  }, []);

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      setError('');
      setPayment(null);

      try {
        const result = await getBooking(bookingId);
        setBooking(result);
        void loadCheckoutContext(result.showtimeId, result.seatIds);

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
  }, [bookingId, loadCheckoutContext]);

  useEffect(() => {
    if (!payment?.id || payment.status !== 'Pending') {
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
            void loadCheckoutContext(refreshedBooking.showtimeId, refreshedBooking.seatIds);
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
  }, [payment?.id, payment?.status, loadCheckoutContext]);

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

  if (loading) {
    return <CenteredLoader />;
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
  const canCancel = status === 'pending' && !hasPaymentLink && !paid && !fulfillmentConflict;

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

          <SeatRow labels={checkoutContext?.seatLabels ?? []} fallbackCount={booking.seatIds.length} />
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
        disabled={!canCancel}
        onPress={() => setCancelDialogVisible(true)}
        contentStyle={[styles.button, !canCancel && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>
          {getButtonText(status, paid, fulfillmentConflict, hasPaymentLink)}
        </Text>
      </AnimatedPressable>
      </ScrollView>

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Stay"
        confirmLabel="Cancel booking"
        destructive
        loading={canceling}
        message="This will cancel this booking and return you to seat selection."
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


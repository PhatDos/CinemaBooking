import {
  router,
} from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getCinema, getRoom } from '@/src/api/cinemas';
import { cancelCheckout } from '@/src/api/checkouts';
import { ApiError } from '@/src/api/client';
import { getMovieById } from '@/src/api/movies';
import { getPayment, getPaymentByHold, payHold } from '@/src/api/payments';
import { getShowtimeById } from '@/src/api/showtimes';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { formatDateTime, formatVenueName } from '@/src/display';
import { styles } from '@/src/features/checkout/styles';
import type { Payment } from '@/src/types';

import { InfoRow } from './components/InfoRow';
import {
  formatCountdown,
  formatCurrency,
  getCancelHoldErrorMessage,
  getPaymentErrorMessage,
  sleep,
  type CheckoutContext,
} from './utils';

type HoldCheckoutScreenProps = {
  params: {
    amount?: string;
    expiresAt?: string;
    holdId: string;
    seatCount?: string;
    showtimeId?: string;
  };
};

export default function HoldCheckoutScreen({ params }: HoldCheckoutScreenProps) {
  const { showNotification } = useAppNotification();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelingHold, setCancelingHold] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext | null>(null);

  const amount = Number(params.amount ?? 0);
  const seatCount = Number(params.seatCount ?? 0);
  const holdExpiresAt = params.expiresAt ? new Date(params.expiresAt).getTime() : null;
  const secondsLeft = useMemo(() => {
    if (!holdExpiresAt) {
      return null;
    }

    return Math.max(0, Math.ceil((holdExpiresAt - now) / 1000));
  }, [holdExpiresAt, now]);

  const hasActivePayment =
    payment?.status === 'Pending' ||
    payment?.status === 'Succeeded';

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
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (params.showtimeId) {
      const timeoutId = setTimeout(() => {
        void loadCheckoutContext(params.showtimeId!);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [loadCheckoutContext, params.showtimeId]);

  useEffect(() => {
    if (!params.holdId) {
      return;
    }

    let cancelled = false;

    async function loadExistingPayment() {
      try {
        const existingPayment = await getPaymentByHold(params.holdId);

        if (!cancelled) {
          setPayment(existingPayment);
        }
      } catch (paymentError) {
        if (paymentError instanceof ApiError && paymentError.status === 404) {
          return;
        }

        console.error(paymentError);
      }
    }

    void loadExistingPayment();

    return () => {
      cancelled = true;
    };
  }, [params.holdId]);

  useEffect(() => {
    if (!payment?.id) {
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

          if (
            refreshedPayment.status === 'Succeeded' &&
            refreshedPayment.bookingId &&
            refreshedPayment.fulfillmentStatus === 'Fulfilled'
          ) {
            router.replace({
              pathname: '/checkout/[bookingId]',
              params: { bookingId: refreshedPayment.bookingId },
            });
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
  }, [payment?.id]);

  async function handlePay() {
    if (!params.holdId || paying || hasActivePayment) {
      return;
    }

    setPaying(true);
    setError('');

    try {
      const result = await payHold(params.holdId);
      setPayment(result);
      showNotification('Payment session created. Complete PayOS payment to receive tickets.', {
        tone: 'success',
      });

      if (result.checkoutUrl) {
        await Linking.openURL(result.checkoutUrl);
      }
    } catch (payError) {
      console.error(payError);
      const message = getPaymentErrorMessage(payError);
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setPaying(false);
    }
  }

  function handleGoBack() {
    setCancelDialogVisible(true);
  }

  async function handleCancelHold() {
    if (!params.holdId || cancelingHold) {
      return;
    }

    setCancelingHold(true);
    setError('');

    try {
      await cancelCheckout(params.holdId);
      setCancelDialogVisible(false);
      showNotification('Checkout cancelled.', { tone: 'success' });
      goToSeatMap(params.showtimeId);
    } catch (cancelError) {
      console.error(cancelError);
      setCancelDialogVisible(false);
      const message = getCancelHoldErrorMessage(cancelError);
      setError(message);
      showNotification(message, { tone: 'error' });

      if (cancelError instanceof ApiError && cancelError.status === 409) {
        router.replace('/bookings');
      }
    } finally {
      setCancelingHold(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topActions}>
          <AnimatedPressable
            contentStyle={styles.backLink}
            disabled={cancelingHold}
            onPress={handleGoBack}>
            <Text style={styles.backLinkText}>Go back</Text>
          </AnimatedPressable>

          {payment?.checkoutUrl ? (
            <AnimatedPressable
              contentStyle={styles.backLink}
              onPress={() => void Linking.openURL(payment.checkoutUrl!)}>
              <Text style={styles.backLinkText}>Open PayOS</Text>
            </AnimatedPressable>
          ) : null}
        </View>

        <FadeInView>
          <Text style={styles.kicker}>Reserved seats</Text>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.text}>
            {checkoutContext
              ? `${checkoutContext.movieTitle} | ${formatDateTime(checkoutContext.startTime)}`
              : 'Your selected seats are held briefly.'}
          </Text>
        </FadeInView>

        <FadeInView delay={70}>
          <View style={styles.panel}>
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusLabel}>Current status</Text>
                <Text style={styles.stateText}>
                  {payment?.status === 'Succeeded' ? 'Payment received' : 'Waiting for payment'}
                </Text>
              </View>
              <View style={[styles.statusPill, styles.statusPillPending]}>
                <Text style={[styles.statusPillText, styles.statusPillTextPending]}>
                  {payment?.status === 'Succeeded' ? 'Processing' : 'Held'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <InfoRow label="Seats" value={Number.isFinite(seatCount) ? seatCount.toString() : '-'} />
            <InfoRow label="Total" value={formatCurrency(Number.isFinite(amount) ? amount : 0)} highlight />
            {checkoutContext ? (
              <InfoRow label="Cinema" value={formatVenueName(checkoutContext.cinemaName, checkoutContext.roomName)} />
            ) : null}
            <InfoRow label="Hold expires" value={secondsLeft === null ? '-' : formatCountdown(secondsLeft)} />
          </View>
        </FadeInView>

        {payment?.checkoutUrl ? (
          <AnimatedPressable
            contentStyle={styles.paymentLinkButton}
            onPress={() => void Linking.openURL(payment.checkoutUrl!)}
            pressedScale={0.97}>
            <Text style={styles.paymentLinkText}>Open PayOS checkout</Text>
          </AnimatedPressable>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AnimatedPressable
          disabled={paying || hasActivePayment || secondsLeft === 0}
          onPress={handlePay}
          contentStyle={[
            styles.button,
            (paying || hasActivePayment || secondsLeft === 0) && styles.buttonDisabled,
          ]}>
          {paying ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {hasActivePayment ? 'Waiting for confirmation' : 'Pay now'}
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Stay"
        confirmLabel="Cancel checkout"
        destructive
        loading={cancelingHold}
        message={hasActivePayment
          ? 'This will cancel the PayOS payment link first. Seats are released only if payment cancellation succeeds.'
          : 'This will cancel the current checkout and return you to seat selection.'}
        onCancel={() => {
          if (!cancelingHold) {
            setCancelDialogVisible(false);
          }
        }}
        onConfirm={handleCancelHold}
        title="Cancel this checkout?"
        visible={cancelDialogVisible}
      />
    </View>
  );
}

function goToSeatMap(showtimeId?: string) {
  if (!showtimeId) {
    router.replace('/movies');
    return;
  }

  router.replace({
    pathname: '/seats/[showtimeId]',
    params: { showtimeId },
  });
}

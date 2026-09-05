import {
  Redirect,
  router,
  useLocalSearchParams,
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
import { ApiError } from '@/src/api/client';
import { getMovieById } from '@/src/api/movies';
import { getPayment, getPaymentByHold, payHold } from '@/src/api/payments';
import { releaseHold } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { formatDateTime, formatVenueName } from '@/src/display';
import { styles } from '@/src/styles/screens/checkout.styles';
import type { Payment } from '@/src/types';

type CheckoutContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  startTime: string;
};

export default function HoldCheckoutScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    expiresAt?: string;
    holdId: string;
    seatCount?: string;
    showtimeId?: string;
  }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { showNotification } = useAppNotification();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [releaseDialogVisible, setReleaseDialogVisible] = useState(false);
  const [releasing, setReleasing] = useState(false);
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
    if (params.showtimeId && isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadCheckoutContext(params.showtimeId!);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loadCheckoutContext, params.showtimeId]);

  useEffect(() => {
    if (!params.holdId || !isAuthenticated) {
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
  }, [isAuthenticated, params.holdId]);

  useEffect(() => {
    if (!payment?.id || !isAuthenticated) {
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
  }, [isAuthenticated, payment?.id]);

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
    if (hasActivePayment) {
      router.replace('/bookings');
      return;
    }

    setReleaseDialogVisible(true);
  }

  async function handleReleaseHold() {
    if (!params.holdId || releasing) {
      return;
    }

    setReleasing(true);
    setError('');

    try {
      await releaseHold(params.holdId);
      setReleaseDialogVisible(false);
      showNotification('Seats released.', { tone: 'success' });
      goToSeatMap(params.showtimeId);
    } catch (releaseError) {
      console.error(releaseError);
      setReleaseDialogVisible(false);
      const message = getReleaseErrorMessage(releaseError);
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setReleasing(false);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topActions}>
          <AnimatedPressable
            contentStyle={styles.backLink}
            disabled={releasing}
            onPress={handleGoBack}>
            <Text style={styles.backLinkText}>Go back</Text>
          </AnimatedPressable>

          <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.replace('/bookings')}>
            <Text style={styles.backLinkText}>My bookings</Text>
          </AnimatedPressable>
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
        confirmLabel="Release seats"
        destructive
        loading={releasing}
        message="Leaving checkout before payment will release these seats for other customers."
        onCancel={() => {
          if (!releasing) {
            setReleaseDialogVisible(false);
          }
        }}
        onConfirm={handleReleaseHold}
        title="Release selected seats?"
        visible={releaseDialogVisible}
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'Seats are no longer available.' : error.message;
  }

  return 'Cannot start payment';
}

function getReleaseErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Cannot release seats';
}

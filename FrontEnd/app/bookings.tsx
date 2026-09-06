import {
  Redirect,
  router,
} from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { cancelBooking, getBookings } from '@/src/api/bookings';
import { cancelCheckout, getCheckouts } from '@/src/api/checkouts';
import { ApiError } from '@/src/api/client';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { payHold } from '@/src/api/payments';
import { getSeatAvailability } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import { useAppNotification } from '@/src/components/AppNotification';
import { formatVenueName, getSeatLabel } from '@/src/display';
import { styles } from '@/src/styles/screens/bookings.styles';
import type { Booking, BookingStatus, Checkout } from '@/src/types';

type ReservationDisplay = {
  seatLabels: string[];
  showtimeLabel: string;
};

type BookingListItem =
  | {
      booking: Booking;
      id: string;
      sortDate: string;
      type: 'booking';
    }
  | {
      checkout: Checkout;
      id: string;
      sortDate: string;
      type: 'checkout';
    };

export default function BookingsScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [reservationDisplays, setReservationDisplays] = useState<Record<string, ReservationDisplay>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [checkoutToCancel, setCheckoutToCancel] = useState<Checkout | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellingHoldId, setCancellingHoldId] = useState<string | null>(null);
  const [payingHoldId, setPayingHoldId] = useState<string | null>(null);

  const listItems = useMemo<BookingListItem[]>(
    () => [
      ...checkouts.map((checkout) => ({
        checkout,
        id: getCheckoutDisplayKey(checkout),
        sortDate: checkout.payment?.createdAt ?? checkout.expiresAt,
        type: 'checkout' as const,
      })),
      ...bookings.map((booking) => ({
        booking,
        id: getBookingDisplayKey(booking),
        sortDate: booking.createdAt,
        type: 'booking' as const,
      })),
    ].sort((left, right) =>
      new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime()),
    [bookings, checkouts],
  );

  const loadReservationDisplays = useCallback(async (
    items: { id: string; showtimeId: string; seatIds: string[] }[],
  ) => {
    const uniqueShowtimeIds = Array.from(new Set(items.map((item) => item.showtimeId)));
    const entries = await Promise.all(
      uniqueShowtimeIds.map(async (showtimeId) => {
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

          return [
            showtimeId,
            {
              seatLabelsById,
              showtimeLabel: `${movie.title} | ${formatDateTime(showtime.startTime)} | ${formatVenueName(cinema.name, room.name)}`,
            },
          ] as const;
        } catch (labelError) {
          console.error(labelError);
          return [
            showtimeId,
            {
              seatLabelsById: new Map<string, string>(),
              showtimeLabel: 'Showtime details unavailable',
            },
          ] as const;
        }
      }),
    );

    const displayByReservationId = Object.fromEntries(
      items.map((item) => {
        const showtimeDisplay = entries.find(([showtimeId]) => showtimeId === item.showtimeId)?.[1];
        const seatLabels = item.seatIds
          .map((seatId) => showtimeDisplay?.seatLabelsById.get(seatId))
          .filter((label): label is string => Boolean(label));

        return [
          item.id,
          {
            seatLabels,
            showtimeLabel: showtimeDisplay?.showtimeLabel ?? 'Loading details...',
          },
        ] as const;
      }),
    );

    setReservationDisplays(displayByReservationId);
  }, []);

  const loadBookings = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const [bookingResult, checkoutResult] = await Promise.all([
        getBookings(),
        getCheckouts(),
      ]);
      setBookings(bookingResult);
      setCheckouts(checkoutResult);
      void loadReservationDisplays([
        ...checkoutResult.map((checkout) => ({
          id: getCheckoutDisplayKey(checkout),
          seatIds: checkout.seatIds,
          showtimeId: checkout.showtimeId,
        })),
        ...bookingResult.map((booking) => ({
          id: getBookingDisplayKey(booking),
          seatIds: booking.seatIds,
          showtimeId: booking.showtimeId,
        })),
      ]);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadReservationDisplays]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadBookings();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loadBookings]);

  async function handleCancelBooking() {
    if (!bookingToCancel || cancellingBookingId) {
      return;
    }

    setCancellingBookingId(bookingToCancel.id);
    setError('');

    try {
      await cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
      showNotification('Booking cancelled. Seats are available again.', {
        tone: 'success',
      });
      await loadBookings(false);
    } catch (cancelError) {
      console.error(cancelError);
      showNotification('Cannot cancel this booking right now.', {
        tone: 'error',
      });
    } finally {
      setCancellingBookingId(null);
    }
  }

  async function handleCancelCheckout() {
    if (!checkoutToCancel || cancellingHoldId) {
      return;
    }

    setCancellingHoldId(checkoutToCancel.holdId);
    setError('');

    try {
      await cancelCheckout(checkoutToCancel.holdId);
      setCheckoutToCancel(null);
      showNotification('Checkout cancelled. Seats are available again.', {
        tone: 'success',
      });
      await loadBookings(false);
    } catch (cancelError) {
      console.error(cancelError);
      const message = getCheckoutCancelErrorMessage(cancelError);
      showNotification(message, { tone: 'error' });
      await loadBookings(false);
    } finally {
      setCancellingHoldId(null);
    }
  }

  async function handlePayCheckout(checkout: Checkout) {
    if (payingHoldId) {
      return;
    }

    setPayingHoldId(checkout.holdId);
    setError('');

    try {
      const payment = await payHold(checkout.holdId);

      showNotification('Payment session created. Complete PayOS payment to receive tickets.', {
        tone: 'success',
      });

      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
      }

      await loadBookings(false);
    } catch (payError) {
      console.error(payError);
      showNotification(getPaymentErrorMessage(payError), { tone: 'error' });
      await loadBookings(false);
    } finally {
      setPayingHoldId(null);
    }
  }

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
          contentContainerStyle={listItems.length === 0 ? styles.emptyList : styles.list}
          data={listItems}
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
              {item.type === 'booking' ? (
                <BookingCard
                  booking={item.booking}
                  cancelling={cancellingBookingId === item.booking.id}
                  display={reservationDisplays[item.id]}
                  onCancel={() => setBookingToCancel(item.booking)}
                />
              ) : (
                <CheckoutCard
                  cancelling={cancellingHoldId === item.checkout.holdId}
                  checkout={item.checkout}
                  display={reservationDisplays[item.id]}
                  onCancel={() => setCheckoutToCancel(item.checkout)}
                  onPay={() => void handlePayCheckout(item.checkout)}
                  paying={payingHoldId === item.checkout.holdId}
                />
              )}
            </FadeInView>
          )}
        />
      )}

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Keep booking"
        confirmLabel="Cancel booking"
        destructive
        loading={cancellingBookingId !== null}
        message="This will release the selected seats for other customers."
        onCancel={() => {
          if (!cancellingBookingId) {
            setBookingToCancel(null);
          }
        }}
        onConfirm={handleCancelBooking}
        title="Cancel pending booking?"
        visible={bookingToCancel !== null}
      />
      <ConfirmDialog
        cancelLabel="Keep checkout"
        confirmLabel="Cancel checkout"
        destructive
        loading={cancellingHoldId !== null}
        message={checkoutToCancel?.payment?.status === 'Pending'
          ? 'This will cancel the PayOS payment link first. Seats are released only if payment cancellation succeeds.'
          : 'This will cancel this checkout and release the selected seats.'}
        onCancel={() => {
          if (!cancellingHoldId) {
            setCheckoutToCancel(null);
          }
        }}
        onConfirm={handleCancelCheckout}
        title="Cancel checkout?"
        visible={checkoutToCancel !== null}
      />
    </View>
  );
}

function BookingCard({
  booking,
  cancelling,
  display,
  onCancel,
}: {
  booking: Booking;
  cancelling: boolean;
  display?: ReservationDisplay;
  onCancel: () => void;
}) {
  const seatLabels = display?.seatLabels ?? [];

  return (
    <AnimatedPressable
      contentStyle={styles.card}
      onPress={() =>
        router.push({
          pathname: '/checkout/[bookingId]',
          params: { bookingId: booking.id },
        })
      }>
                <View style={styles.cardHeader}>
                  <View style={styles.bookingTitleBlock}>
                    <Text style={styles.bookingId}>Booking</Text>
                    <Text style={styles.date}>Created: {formatDate(booking.createdAt)}</Text>
                  </View>
                  <View style={[styles.badge, getStatusBadgeStyle(booking.status)]}>
                    <Text style={[styles.badgeText, getStatusBadgeTextStyle(booking.status)]}>
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingMetaGrid}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Seats</Text>
                    {seatLabels.length > 0 ? (
                      <View style={styles.seatPills}>
                        {seatLabels.map((seatLabel) => (
                          <View key={seatLabel} style={styles.seatPill}>
                            <Text style={styles.seatPillText}>{seatLabel}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.metaValue}>{formatSeatFallback(booking.seatIds.length)}</Text>
                    )}
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Showtime</Text>
                    <Text numberOfLines={3} style={styles.metaValue}>
                      {display?.showtimeLabel ?? 'Loading details...'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.total}>{formatCurrency(booking.totalAmount)}</Text>

                {isPendingStatus(booking.status) ? (
                  <View style={styles.cardActions}>
                    <AnimatedPressable
                      contentStyle={styles.cancelBookingButton}
                      disabled={cancelling}
                      onPress={(event) => {
                        event.stopPropagation();
                        onCancel();
                      }}>
                      {cancelling ? (
                        <ActivityIndicator color="#dc2626" />
                      ) : (
                        <Text style={styles.cancelBookingText}>Cancel booking</Text>
                      )}
                    </AnimatedPressable>
                  </View>
                ) : null}
    </AnimatedPressable>
  );
}

function CheckoutCard({
  cancelling,
  checkout,
  display,
  onCancel,
  onPay,
  paying,
}: {
  cancelling: boolean;
  checkout: Checkout;
  display?: ReservationDisplay;
  onCancel: () => void;
  onPay: () => void;
  paying: boolean;
}) {
  const seatLabels = display?.seatLabels ?? [];
  const canPay = checkout.status === 'Held';
  const canOpenPayOS =
    checkout.status === 'PaymentPending' &&
    Boolean(checkout.checkoutUrl);
  const canCancel =
    checkout.status === 'Held' ||
    checkout.status === 'PaymentPending';

  return (
    <AnimatedPressable
      contentStyle={styles.card}
      onPress={() =>
        router.push({
          pathname: '/checkout/hold/[holdId]',
          params: {
            amount: checkout.amount.toString(),
            expiresAt: checkout.expiresAt,
            holdId: checkout.holdId,
            seatCount: checkout.seatIds.length.toString(),
            showtimeId: checkout.showtimeId,
          },
        })
      }>
      <View style={styles.cardHeader}>
        <View style={styles.bookingTitleBlock}>
          <Text style={styles.bookingId}>Checkout</Text>
          <Text style={styles.date}>Expires: {formatDate(checkout.expiresAt)}</Text>
        </View>
        <View style={[styles.badge, getCheckoutBadgeStyle(checkout.status)]}>
          <Text style={[styles.badgeText, getCheckoutBadgeTextStyle(checkout.status)]}>
            {getCheckoutStatusLabel(checkout.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingMetaGrid}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Seats</Text>
          {seatLabels.length > 0 ? (
            <View style={styles.seatPills}>
              {seatLabels.map((seatLabel) => (
                <View key={seatLabel} style={styles.seatPill}>
                  <Text style={styles.seatPillText}>{seatLabel}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.metaValue}>{formatSeatFallback(checkout.seatIds.length)}</Text>
          )}
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Showtime</Text>
          <Text numberOfLines={3} style={styles.metaValue}>
            {display?.showtimeLabel ?? 'Loading details...'}
          </Text>
        </View>
      </View>

      <Text style={styles.total}>{formatCurrency(checkout.amount)}</Text>

      <View style={styles.cardActions}>
        {canPay ? (
          <AnimatedPressable
            contentStyle={styles.payButton}
            disabled={paying}
            onPress={(event) => {
              event.stopPropagation();
              onPay();
            }}>
            {paying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.payButtonText}>Pay now</Text>
            )}
          </AnimatedPressable>
        ) : null}

        {canOpenPayOS ? (
          <AnimatedPressable
            contentStyle={styles.openPaymentButton}
            onPress={(event) => {
              event.stopPropagation();
              void Linking.openURL(checkout.checkoutUrl!);
            }}>
            <Text style={styles.openPaymentText}>Open PayOS</Text>
          </AnimatedPressable>
        ) : null}

        {checkout.status === 'PaymentProcessing' ? (
          <Text style={styles.processingText}>Processing tickets</Text>
        ) : null}

        {canCancel ? (
          <AnimatedPressable
            contentStyle={styles.cancelBookingButton}
            disabled={cancelling}
            onPress={(event) => {
              event.stopPropagation();
              onCancel();
            }}>
            {cancelling ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text style={styles.cancelBookingText}>Cancel checkout</Text>
            )}
          </AnimatedPressable>
        ) : null}
      </View>
    </AnimatedPressable>
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

function getCheckoutStatusLabel(status: Checkout['status']) {
  switch (status) {
    case 'Held':
      return 'Held';
    case 'PaymentPending':
      return 'Payment';
    case 'PaymentProcessing':
      return 'Processing';
    case 'PaymentConflict':
      return 'Support';
    case 'PaymentFailed':
      return 'Failed';
    case 'Cancelled':
      return 'Cancelled';
  }
}

function getCheckoutBadgeStyle(status: Checkout['status']) {
  switch (status) {
    case 'PaymentProcessing':
      return styles.badgeConfirmed;
    case 'PaymentConflict':
    case 'PaymentFailed':
      return styles.badgeExpired;
    case 'Cancelled':
      return styles.badgeCancelled;
    default:
      return styles.badgePending;
  }
}

function getCheckoutBadgeTextStyle(status: Checkout['status']) {
  switch (status) {
    case 'PaymentProcessing':
      return styles.badgeTextConfirmed;
    case 'PaymentConflict':
    case 'PaymentFailed':
      return styles.badgeTextExpired;
    case 'Cancelled':
      return styles.badgeTextCancelled;
    default:
      return styles.badgeTextPending;
  }
}

function isPendingStatus(status: BookingStatus) {
  return normalizeStatus(status) === 'pending';
}

function formatSeatFallback(count: number) {
  if (count <= 0) {
    return 'No seats';
  }

  return `${count} seat${count > 1 ? 's' : ''}`;
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

function getBookingDisplayKey(booking: Booking) {
  return `booking:${booking.id}`;
}

function getCheckoutDisplayKey(checkout: Checkout) {
  return `checkout:${checkout.holdId}`;
}

function getCheckoutCancelErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'This payment is still active or already paid. Seats were not released.'
      : error.message;
  }

  return 'Cannot cancel checkout right now.';
}

function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'Seats are no longer available.'
      : error.message;
  }

  return 'Cannot start payment.';
}

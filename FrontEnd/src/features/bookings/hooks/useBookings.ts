import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { cancelBooking, getBookings } from '@/src/api/bookings';
import { cancelCheckout, getCheckouts } from '@/src/api/checkouts';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { payHold } from '@/src/api/payments';
import { getSeatAvailability } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAppNotification } from '@/src/components/AppNotification';
import type { Booking, Checkout } from '@/src/types';

import {
  buildBookingListItems,
  buildReservationRequestItems,
  buildShowtimeLabel,
  getCheckoutCancelErrorMessage,
  getPaymentErrorMessage,
  mapSeatLabelsById,
  type ReservationDisplay,
} from '../utils';

export function useBookings() {
  const { showNotification } = useAppNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [reservationDisplays, setReservationDisplays] = useState<
    Record<string, ReservationDisplay>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [checkoutToCancel, setCheckoutToCancel] = useState<Checkout | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellingHoldId, setCancellingHoldId] = useState<string | null>(null);
  const [payingHoldId, setPayingHoldId] = useState<string | null>(null);

  const listItems = useMemo(
    () => buildBookingListItems(bookings, checkouts),
    [bookings, checkouts],
  );

  const loadReservationDisplays = useCallback(async (
    items: { id: string; showtimeId: string; seatIds: string[] }[],
  ) => {
    const uniqueShowtimeIds = Array.from(
      new Set(items.map((item) => item.showtimeId)),
    );
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

          return [
            showtimeId,
            {
              seatLabelsById: mapSeatLabelsById(seats),
              showtimeLabel: buildShowtimeLabel(
                showtime,
                movie.title,
                cinema.name,
                room.name,
              ),
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
        const showtimeDisplay = entries.find(
          ([showtimeId]) => showtimeId === item.showtimeId,
        )?.[1];
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
      void loadReservationDisplays(
        buildReservationRequestItems(bookingResult, checkoutResult),
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadReservationDisplays]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadBookings]);

  async function refreshBookings() {
    setRefreshing(true);
    await loadBookings(false);
  }

  async function cancelSelectedBooking() {
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

  async function cancelSelectedCheckout() {
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
      showNotification(getCheckoutCancelErrorMessage(cancelError), { tone: 'error' });
      await loadBookings(false);
    } finally {
      setCancellingHoldId(null);
    }
  }

  async function payCheckout(checkout: Checkout) {
    if (payingHoldId) {
      return;
    }

    setPayingHoldId(checkout.holdId);
    setError('');

    try {
      const payment = await payHold(checkout.holdId);

      showNotification(
        'Payment session created. Complete PayOS payment to receive tickets.',
        { tone: 'success' },
      );

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

  return {
    bookingToCancel,
    cancellingBookingId,
    cancellingHoldId,
    cancelSelectedBooking,
    cancelSelectedCheckout,
    checkoutToCancel,
    error,
    listItems,
    loadBookings,
    loading,
    payingHoldId,
    payCheckout,
    refreshing,
    refreshBookings,
    reservationDisplays,
    setBookingToCancel,
    setCheckoutToCancel,
  };
}

import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { createBooking } from '@/src/api/bookings';
import { getCinema, getRoom } from '@/src/api/cinemas';
import { ApiError } from '@/src/api/client';
import { getMovieById } from '@/src/api/movies';
import { getSeatAvailability, holdSeats, releaseHold } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import {
  formatCinemaName,
  formatCurrency,
  formatDateTime,
  formatRoomName,
} from '@/src/display';
import { seatGap, styles } from '@/src/styles/screens/seats.styles';
import { colors } from '@/src/theme';
import type { SeatAvailability } from '@/src/types';

type ShowtimeContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  startTime: string;
};

export default function SeatsScreen() {
  const { showtimeId } = useLocalSearchParams<{ showtimeId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [continuing, setContinuing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showtimeContext, setShowtimeContext] = useState<ShowtimeContext | null>(null);

  const loadSeats = useCallback(
    async (showLoader = true) => {
      if (!showtimeId || !isAuthenticated) {
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setError('');

      try {
        const result = await getSeatAvailability(showtimeId);
        setSeats(result);
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load seats');
      } finally {
        setLoading(false);
      }
    },
    [showtimeId, isAuthenticated],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSeats();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadSeats]);

  useEffect(() => {
    async function loadShowtimeContext() {
      if (!showtimeId || !isAuthenticated) {
        return;
      }

      try {
        const showtime = await getShowtimeById(showtimeId);
        const [movie, room] = await Promise.all([
          getMovieById(showtime.movieId),
          getRoom(showtime.roomId),
        ]);
        const cinema = await getCinema(room.cinemaId);

        setShowtimeContext({
          cinemaName: cinema.name,
          movieTitle: movie.title,
          roomName: room.name,
          startTime: showtime.startTime,
        });
      } catch (contextError) {
        console.error(contextError);
        setShowtimeContext(null);
      }
    }

    void loadShowtimeContext();
  }, [showtimeId, isAuthenticated]);

  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);
  const maxSeatSlotsPerRow = Math.max(1, ...rows.map(([, rowSeats]) => getRowSlotCount(rowSeats)));
  const seatSize = calculateSeatSize(width, maxSeatSlotsPerRow);
  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.has(seat.seatId)),
    [seats, selectedSeatIds],
  );
  const hasInvalidSelectedPrice = useMemo(
    () =>
      selectedSeats.some(
        (seat) => getSeatPrice(seat) === null,
      ),
    [selectedSeats],
  );
  const selectedTotal = useMemo(
    () => {
      if (hasInvalidSelectedPrice) {
        return null;
      }

      return selectedSeats.reduce(
        (total, seat) => total + (getSeatPrice(seat) ?? 0),
        0,
      );
    },
    [hasInvalidSelectedPrice, selectedSeats],
  );
  const priceByType = useMemo(
    () => getPriceByType(seats),
    [seats],
  );
  const minimumSeatPrice = useMemo(() => {
    const prices = seats
      .map((seat) => getSeatPrice(seat))
      .filter((price): price is number => price !== null);

    return prices.length === 0
      ? null
      : Math.min(...prices);
  }, [seats]);

  function toggleSeat(seat: SeatAvailability) {
    if (continuing || seat.status !== 'available') {
      return;
    }

    void Haptics.selectionAsync();

    setSelectedSeatIds((current) => {
      const next = new Set(current);

      if (next.has(seat.seatId)) {
        next.delete(seat.seatId);
      } else {
        next.add(seat.seatId);
      }

      return next;
    });
  }

  async function handleContinue() {
    if (
      !showtimeId ||
      selectedSeatIds.size === 0 ||
      hasInvalidSelectedPrice ||
      continuing
    ) {
      return;
    }

    setContinuing(true);
    setActionError('');

    let holdId: string | null = null;

    try {
      const hold = await holdSeats(showtimeId, {
        seatIds: Array.from(selectedSeatIds),
      });

      holdId = hold.holdId;

      const booking = await createBooking({
        holdId,
      });

      setSelectedSeatIds(new Set());

      router.push({
        pathname: '/checkout/[bookingId]',
        params: { bookingId: booking.bookingId },
      });
    } catch (continueError) {
      console.error(continueError);

      if (holdId) {
        await releaseHold(holdId).catch((releaseError) => {
          console.error(releaseError);
        });
      }

      setSelectedSeatIds(new Set());
      setActionError(getContinueErrorMessage(continueError));
    } finally {
      setContinuing(false);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Back</Text>
      </AnimatedPressable>

      <FadeInView>
        <Text style={styles.kicker}>Seat map</Text>
        <Text style={styles.title}>Select Seats</Text>
      </FadeInView>
      <Text style={styles.text}>
        {showtimeContext
          ? `${showtimeContext.movieTitle} | ${formatDateTime(showtimeContext.startTime)}`
          : 'Loading showtime...'}
      </Text>

      {showtimeContext ? (
        <FadeInView delay={45} style={styles.contextPanel}>
          <Text style={styles.contextTitle}>{formatCinemaName(showtimeContext.cinemaName)}</Text>
          <Text style={styles.contextText}>{formatRoomName(showtimeContext.roomName)}</Text>
          <Text style={styles.contextPrice}>
            {minimumSeatPrice === null
              ? 'Seat prices unavailable'
              : `From ${formatCurrency(minimumSeatPrice)}`}
          </Text>
        </FadeInView>
      ) : null}

      <View style={styles.screen}>
        <Text style={styles.screenText}>Screen</Text>
      </View>

      <FadeInView delay={70} style={styles.map}>
        {rows.map(([row, rowSeats]) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowLabel}>{row}</Text>

            <View style={styles.seats}>
              {rowSeats.map((seat) => {
                const selected = selectedSeatIds.has(seat.seatId);
                const held = seat.status === 'held';

                return (
                  <AnimatedPressable
                    accessibilityRole="button"
                    contentStyle={[
                      styles.seat,
                      { height: seatSize, width: getSeatWidth(seat, seatSize) },
                      seat.type === 'VIP' && styles.seatVip,
                      seat.type === 'Couple' && styles.seatCouple,
                      held && styles.seatHeld,
                      seat.status === 'reserved' && styles.seatReserved,
                      seat.status === 'booked' && styles.seatBooked,
                      selected && styles.seatSelected,
                    ]}
                    disabled={continuing || seat.status !== 'available'}
                    haptic={false}
                    key={seat.seatId}
                    onPress={() => toggleSeat(seat)}
                    pressedScale={0.9}>
                    <Text
                      style={[
                        styles.seatText,
                        seat.type === 'VIP' && styles.seatTextVip,
                        seat.type === 'Couple' && styles.seatTextCouple,
                        held && styles.seatTextHeld,
                        seat.status === 'reserved' && styles.seatTextReserved,
                        seat.status === 'booked' && styles.seatTextBooked,
                        selected && styles.seatTextSelected,
                        seatSize <= 28 && styles.seatTextCompact,
                      ]}>
                      {seat.number}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        ))}
      </FadeInView>

      <View style={styles.legend}>
        <LegendItem color="#ffffff" label="Available" />
        <LegendItem color="#ffffff" label={formatSeatTypeLegend('Standard', priceByType)} />
        <LegendItem color="#ede9fe" label={formatSeatTypeLegend('VIP', priceByType)} />
        <LegendItem color="#ffe4e6" label={formatSeatTypeLegend('Couple', priceByType)} />
        <LegendItem color={colors.primary} label="Selected" />
        <LegendItem color="#fde68a" label="Holding" />
        <LegendItem color="#344054" label="Unavailable" />
      </View>

      <Text style={styles.note}>Selected: {selectedSeatIds.size}</Text>
      {selectedSeatIds.size > 0 ? (
        <Text style={styles.selectedTotal}>
          {selectedTotal === null
            ? 'Price unavailable'
            : `Total: ${formatCurrency(selectedTotal)}`}
        </Text>
      ) : null}
      {hasInvalidSelectedPrice ? (
        <Text style={styles.priceWarning}>Seat prices are missing. Please try again later.</Text>
      ) : null}

      {actionError ? <Text style={styles.holdError}>{actionError}</Text> : null}

      <AnimatedPressable
        disabled={selectedSeatIds.size === 0 || hasInvalidSelectedPrice || continuing}
        onPress={handleContinue}
        contentStyle={[
          styles.button,
          (selectedSeatIds.size === 0 || hasInvalidSelectedPrice || continuing) && styles.buttonDisabled,
        ]}>
        {continuing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Continue
            {selectedTotal !== null && selectedSeatIds.size > 0
              ? ` | ${formatCurrency(selectedTotal)}`
              : ''}
          </Text>
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function getPriceByType(seats: SeatAvailability[]) {
  const prices = new Map<SeatAvailability['type'], number>();

  seats.forEach((seat) => {
    const price = getSeatPrice(seat);

    if (!prices.has(seat.type)) {
      if (price !== null) {
        prices.set(seat.type, price);
      }
    }
  });

  return prices;
}

function formatSeatTypeLegend(
  type: SeatAvailability['type'],
  prices: Map<SeatAvailability['type'], number>,
) {
  const price = prices.get(type);

  return price === undefined ? type : `${type} ${formatCurrency(price)}`;
}

function groupSeatsByRow(seats: SeatAvailability[]) {
  const rows = new Map<string, SeatAvailability[]>();

  seats.forEach((seat) => {
    const rowSeats = rows.get(seat.row) ?? [];
    rowSeats.push(seat);
    rows.set(seat.row, rowSeats);
  });

  return Array.from(rows.entries()).map(([row, rowSeats]) => [
    row,
    rowSeats.sort((left, right) => left.number - right.number),
  ] as const);
}

function getRowSlotCount(seats: SeatAvailability[]) {
  return seats.reduce(
    (total, seat) => total + getSeatSlotSpan(seat),
    0,
  );
}

function getSeatSlotSpan(seat: Pick<SeatAvailability, 'type'>) {
  return seat.type === 'Couple' ? 2 : 1;
}

function getSeatWidth(
  seat: Pick<SeatAvailability, 'type'>,
  seatSize: number,
) {
  return seat.type === 'Couple'
    ? seatSize * 2 + seatGap
    : seatSize;
}

function getContinueErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'One or more seats were just taken. Please choose again.' : error.message;
  }

  return 'Cannot continue checkout';
}

function getSeatPrice(
  seat: { price?: number | null },
) {
  const apiPrice = Number(seat.price);

  if (Number.isFinite(apiPrice)) {
    return apiPrice;
  }

  return null;
}

function calculateSeatSize(screenWidth: number, seatsPerRow: number) {
  const horizontalContentPadding = 40;
  const mapHorizontalPaddingAndBorder = 18;
  const rowLabelWidth = 18;
  const rowGap = 6;
  const availableWidth =
    screenWidth -
    horizontalContentPadding -
    mapHorizontalPaddingAndBorder -
    rowLabelWidth -
    rowGap -
    seatGap * (seatsPerRow - 1);

  return Math.max(24, Math.min(34, Math.floor(availableWidth / seatsPerRow)));
}

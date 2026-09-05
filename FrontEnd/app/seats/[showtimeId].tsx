import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { BottomNav, bottomNavHeight } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import {
  formatCinemaName,
  formatCurrency,
  formatDateTime,
  formatRoomName,
} from '@/src/display';
import { colors, radius, shadow } from '@/src/theme';
import type { SeatAvailability } from '@/src/types';

type ShowtimeContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  startTime: string;
  basePrice: number;
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
          basePrice: showtime.basePrice,
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
  const maxSeatsPerRow = Math.max(1, ...rows.map(([, rowSeats]) => rowSeats.length));
  const seatSize = calculateSeatSize(width, maxSeatsPerRow);
  const selectedTotal = useMemo(
    () =>
      seats
        .filter((seat) => selectedSeatIds.has(seat.seatId))
        .reduce(
          (total, seat) =>
            total + getSeatPrice(seat, showtimeContext?.basePrice),
          0,
        ),
    [seats, selectedSeatIds, showtimeContext?.basePrice],
  );
  const priceByType = useMemo(
    () => getPriceByType(seats, showtimeContext?.basePrice),
    [seats, showtimeContext?.basePrice],
  );

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
    if (!showtimeId || selectedSeatIds.size === 0 || continuing) {
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
      await loadSeats(false);
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
          <Text style={styles.contextPrice}>{formatCurrency(showtimeContext.basePrice)} / seat</Text>
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
                      { height: seatSize, width: seatSize },
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
        <Text style={styles.selectedTotal}>Total: {formatCurrency(selectedTotal)}</Text>
      ) : null}

      {actionError ? <Text style={styles.holdError}>{actionError}</Text> : null}

      <AnimatedPressable
        disabled={selectedSeatIds.size === 0 || continuing}
        onPress={handleContinue}
        contentStyle={[
          styles.button,
          (selectedSeatIds.size === 0 || continuing) && styles.buttonDisabled,
        ]}>
        {continuing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Continue
            {selectedSeatIds.size > 0 ? ` | ${formatCurrency(selectedTotal)}` : ''}
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

function getPriceByType(
  seats: SeatAvailability[],
  basePrice: number | undefined,
) {
  const prices = new Map<SeatAvailability['type'], number>();

  seats.forEach((seat) => {
    if (!prices.has(seat.type)) {
      prices.set(seat.type, getSeatPrice(seat, basePrice));
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

function getContinueErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'One or more seats were just taken. Please choose again.' : error.message;
  }

  return 'Cannot continue checkout';
}

function getSeatPrice(
  seat: Pick<SeatAvailability, 'type'> & { price?: number | null },
  basePrice: number | undefined,
) {
  const apiPrice = Number(seat.price);

  if (Number.isFinite(apiPrice)) {
    return apiPrice;
  }

  const base = Number(basePrice);

  if (!Number.isFinite(base)) {
    return 0;
  }

  switch (seat.type) {
    case 'VIP':
      return base + 30000;
    case 'Couple':
      return base + 90000;
    default:
      return base;
  }
}

function calculateSeatSize(screenWidth: number, seatsPerRow: number) {
  const horizontalContentPadding = 40;
  const mapHorizontalPaddingAndBorder = 18;
  const rowLabelWidth = 18;
  const rowGap = 6;
  const seatGap = 4;
  const availableWidth =
    screenWidth -
    horizontalContentPadding -
    mapHorizontalPaddingAndBorder -
    rowLabelWidth -
    rowGap -
    seatGap * (seatsPerRow - 1);

  return Math.max(24, Math.min(34, Math.floor(availableWidth / seatsPerRow)));
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
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
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
    fontSize: 15,
    fontWeight: '600',
  },
  contextPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.soft,
  },
  contextTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  contextText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  contextPrice: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  screen: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingVertical: 10,
    ...shadow.soft,
  },
  screenText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  map: {
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: 9,
    padding: 8,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    width: 18,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  seats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
  },
  seat: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  seatHeld: {
    borderColor: '#facc15',
    backgroundColor: '#fde68a',
  },
  seatVip: {
    borderColor: '#a78bfa',
    backgroundColor: '#ede9fe',
  },
  seatCouple: {
    borderColor: '#fb7185',
    backgroundColor: '#ffe4e6',
  },
  seatReserved: {
    borderColor: '#344054',
    backgroundColor: '#344054',
  },
  seatBooked: {
    borderColor: '#344054',
    backgroundColor: '#344054',
  },
  seatSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  seatText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  seatTextCompact: {
    fontSize: 11,
  },
  seatTextSelected: {
    color: colors.surface,
  },
  seatTextHeld: {
    color: '#854d0e',
  },
  seatTextVip: {
    color: '#5b21b6',
  },
  seatTextCouple: {
    color: '#9f1239',
  },
  seatTextReserved: {
    color: colors.surface,
  },
  seatTextBooked: {
    color: colors.surface,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 26,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  legendText: {
    color: colors.muted,
    fontSize: 13,
  },
  note: {
    marginTop: 20,
    color: colors.muted,
    fontSize: 14,
  },
  selectedTotal: {
    marginTop: 8,
    color: colors.ink,
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
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  holdPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: radius.md,
    backgroundColor: '#ecfdf5',
    padding: 14,
    ...shadow.soft,
  },
  holdTitle: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  holdText: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  holdDetail: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
  },
  holdError: {
    marginTop: 18,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 14,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
});

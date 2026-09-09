import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { getSeatAvailability, holdSeats } from '@/src/api/seats';
import { getShowtimeById } from '@/src/api/showtimes';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import {
  formatCinemaName,
  formatCurrency,
  formatDateTime,
  formatRoomName,
} from '@/src/display';
import { styles } from '@/src/features/seats/styles';
import { colors, useThemeMode } from '@/src/theme';
import type { SeatAvailability } from '@/src/types';

import { LegendItem } from './components/LegendItem';
import {
  calculateSeatSize,
  formatSeatTypeLegend,
  getContinueErrorMessage,
  getPriceByType,
  getRowSlotCount,
  getSeatPrice,
  getSeatWidth,
  groupSeatsByRow,
} from './utils';

type ShowtimeContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  startTime: string;
};

type SeatsScreenProps = {
  showtimeId: string;
};

export default function SeatsScreen({ showtimeId }: SeatsScreenProps) {
  const { showNotification } = useAppNotification();
  const dark = useThemeMode() === 'dark';
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
      if (!showtimeId) {
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
    [showtimeId],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSeats();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadSeats]);

  useEffect(() => {
    async function loadShowtimeContext() {
      if (!showtimeId) {
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
  }, [showtimeId]);

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

    try {
      const hold = await holdSeats(showtimeId, {
        seatIds: Array.from(selectedSeatIds),
      });

      setSelectedSeatIds(new Set());

      router.push({
        pathname: '/checkout/hold/[holdId]',
        params: {
          amount: selectedTotal?.toString() ?? '0',
          expiresAt: hold.expiresAt,
          holdId: hold.holdId,
          seatCount: hold.seatIds.length.toString(),
          showtimeId: hold.showtimeId,
        },
      } as never);
    } catch (continueError) {
      console.error(continueError);

      setSelectedSeatIds(new Set());
      const message = getContinueErrorMessage(continueError);
      setActionError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setContinuing(false);
    }
  }

  if (loading) {
    return <CenteredLoader />;
  }

  if (error) {
    return (
      <View style={[styles.center, dark && styles.centerDark]}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
      <AnimatedPressable
        contentStyle={[styles.backLink, dark && styles.backLinkDark]}
        onPress={() => router.back()}>
        <Text style={[styles.backLinkText, dark && styles.textDark]}>Back</Text>
      </AnimatedPressable>

      <FadeInView>
        <Text style={[styles.kicker, dark && styles.kickerDark]}>Seat map</Text>
        <Text style={[styles.title, dark && styles.textDark]}>Select Seats</Text>
      </FadeInView>
      <Text style={[styles.text, dark && styles.mutedTextDark]}>
        {showtimeContext
          ? `${showtimeContext.movieTitle} | ${formatDateTime(showtimeContext.startTime)}`
          : 'Loading showtime...'}
      </Text>

      {showtimeContext ? (
        <FadeInView delay={45} style={[styles.contextPanel, dark && styles.panelDark]}>
          <Text style={[styles.contextTitle, dark && styles.textDark]}>
            {formatCinemaName(showtimeContext.cinemaName)}
          </Text>
          <Text style={[styles.contextText, dark && styles.mutedTextDark]}>
            {formatRoomName(showtimeContext.roomName)}
          </Text>
          <Text style={[styles.contextPrice, dark && styles.textDark]}>
            {minimumSeatPrice === null
              ? 'Seat prices unavailable'
              : `From ${formatCurrency(minimumSeatPrice)}`}
          </Text>
        </FadeInView>
      ) : null}

      <View style={[styles.screen, dark && styles.screenDark]}>
        <Text style={styles.screenText}>Screen</Text>
      </View>

      <FadeInView delay={70} style={[styles.map, dark && styles.mapDark]}>
        {rows.map(([row, rowSeats]) => (
          <View key={row} style={styles.row}>
            <Text style={[styles.rowLabel, dark && styles.textDark]}>{row}</Text>

            <View style={styles.seats}>
              {rowSeats.map((seat) => {
                const selected = selectedSeatIds.has(seat.seatId);
                const held = seat.status === 'held';

                return (
                  <AnimatedPressable
                    accessibilityRole="button"
                    contentStyle={[
                      styles.seat,
                      dark && styles.seatDark,
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
                        dark && styles.seatTextDark,
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
        <LegendItem color="#344054" label="Unavailable" />
        <LegendItem color={colors.primary} label="Selected" />
        <LegendItem color="#fde68a" label="Holding" />
        <LegendItem color="#ffffff" label={formatSeatTypeLegend('Standard', priceByType)} />
        <LegendItem color="#ede9fe" label={formatSeatTypeLegend('VIP', priceByType)} />
        <LegendItem color="#ffe4e6" label={formatSeatTypeLegend('Couple', priceByType)} />
      </View>

      <Text style={[styles.note, dark && styles.mutedTextDark]}>Selected: {selectedSeatIds.size}</Text>
      {selectedSeatIds.size > 0 ? (
        <Text style={[styles.selectedTotal, dark && styles.textDark]}>
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
    </View>
  );
}

function CenteredLoader() {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.centerDark]}>
      <ActivityIndicator color={dark ? '#ffffff' : undefined} size="large" />
    </View>
  );
}

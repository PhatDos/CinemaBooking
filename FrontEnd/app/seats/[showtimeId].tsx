import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createBooking } from '@/src/api/bookings';
import { ApiError } from '@/src/api/client';
import { getSeatAvailability, holdSeats } from '@/src/api/seats';
import { useAuth } from '@/src/auth/AuthContext';
import type { HoldSeatsResponse, SeatAvailability } from '@/src/types';

export default function SeatsScreen() {
  const { showtimeId } = useLocalSearchParams<{ showtimeId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [hold, setHold] = useState<HoldSeatsResponse | null>(null);
  const [holdError, setHoldError] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const handledExpiryRef = useRef(false);

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
    if (!hold) {
      handledExpiryRef.current = false;
      return;
    }

    const expiresAt = new Date(hold.expiresAt).getTime();

    function syncCountdown() {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

      setRemainingSeconds(seconds);

      if (seconds === 0) {
        if (handledExpiryRef.current) {
          return;
        }

        handledExpiryRef.current = true;
        setHold(null);
        setSelectedSeatIds(new Set());
        setHoldError('Seat hold has expired. Please select seats again.');
        void loadSeats(false);

        if (showtimeId) {
          router.replace({
            pathname: '/seats/[showtimeId]',
            params: { showtimeId },
          });
        }
      }
    }

    const timer = setInterval(syncCountdown, 1000);

    return () => clearInterval(timer);
  }, [hold, loadSeats, showtimeId]);

  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);

  function toggleSeat(seat: SeatAvailability) {
    if (hold || seat.status !== 'available') {
      return;
    }

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

  async function handleHoldSeats() {
    if (!showtimeId || selectedSeatIds.size === 0 || holding) {
      return;
    }

    setHolding(true);
    setHoldError('');

    try {
      const response = await holdSeats(showtimeId, {
        seatIds: Array.from(selectedSeatIds),
      });

      setHold(response);
      setRemainingSeconds(calculateRemainingSeconds(response.expiresAt));
      setBookingError('');
      setSelectedSeatIds(new Set());
      await loadSeats(false);
    } catch (holdSeatsError) {
      console.error(holdSeatsError);
      setHold(null);
      setSelectedSeatIds(new Set());
      setHoldError(getHoldErrorMessage(holdSeatsError));
      await loadSeats(false);
    } finally {
      setHolding(false);
    }
  }

  async function handleCreateBooking() {
    if (!hold || booking || remainingSeconds === 0) {
      return;
    }

    setBooking(true);
    setBookingError('');

    try {
      const response = await createBooking({
        holdId: hold.holdId,
      });

      router.push({
        pathname: '/checkout/[bookingId]',
        params: { bookingId: response.bookingId },
      });
    } catch (createBookingError) {
      console.error(createBookingError);
      setBookingError(getBookingErrorMessage(createBookingError));
      await loadSeats(false);
    } finally {
      setBooking(false);
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
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Select Seats</Text>
      <Text style={styles.text}>Showtime: {showtimeId}</Text>

      <View style={styles.screen}>
        <Text style={styles.screenText}>Screen</Text>
      </View>

      <View style={styles.map}>
        {rows.map(([row, rowSeats]) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowLabel}>{row}</Text>

            <View style={styles.seats}>
              {rowSeats.map((seat) => {
                const selected = selectedSeatIds.has(seat.seatId);

                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={seat.status !== 'available'}
                    key={seat.seatId}
                    onPress={() => toggleSeat(seat)}
                    style={[
                      styles.seat,
                      seat.status !== 'available' && styles.seatUnavailable,
                      selected && styles.seatSelected,
                    ]}>
                    <Text
                      style={[
                        styles.seatText,
                        seat.status !== 'available' && styles.seatTextUnavailable,
                        selected && styles.seatTextSelected,
                      ]}>
                      {seat.number}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color="#ffffff" label="Available" />
        <LegendItem color="#2563eb" label="Selected" />
        <LegendItem color="#d1d5db" label="Unavailable" />
      </View>

      <Text style={styles.note}>Selected: {selectedSeatIds.size}</Text>

      {hold ? (
        <View style={styles.holdPanel}>
          <Text style={styles.holdTitle}>Seats held</Text>
          <Text style={styles.holdText}>
            Seats held for{' '}
            {formatCountdown(remainingSeconds)}
          </Text>
          <Text style={styles.holdId}>Hold ID: {hold.holdId}</Text>
          {bookingError ? <Text style={styles.holdError}>{bookingError}</Text> : null}
          <Pressable
            disabled={booking || remainingSeconds === 0}
            onPress={handleCreateBooking}
            style={[
              styles.secondaryButton,
              (booking || remainingSeconds === 0) && styles.buttonDisabled,
            ]}>
            {booking ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create booking</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {holdError ? <Text style={styles.holdError}>{holdError}</Text> : null}

      <Pressable
        disabled={selectedSeatIds.size === 0 || holding || Boolean(hold)}
        onPress={handleHoldSeats}
        style={[
          styles.button,
          (selectedSeatIds.size === 0 || holding || Boolean(hold)) && styles.buttonDisabled,
        ]}>
        {holding ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Hold {selectedSeatIds.size} seat{selectedSeatIds.size === 1 ? '' : 's'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
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

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function calculateRemainingSeconds(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function getHoldErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'One or more seats were just taken.' : error.message;
  }

  return 'Cannot hold seats';
}

function getBookingErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'Seat hold is no longer valid.' : error.message;
  }

  return 'Cannot create booking';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLinkText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
  },
  text: {
    marginTop: 12,
    color: '#374151',
    fontSize: 15,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingVertical: 10,
  },
  screenText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  map: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    width: 20,
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  seats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seat: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  seatSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  seatUnavailable: {
    borderColor: '#d1d5db',
    backgroundColor: '#d1d5db',
  },
  seatText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  seatTextSelected: {
    color: '#ffffff',
  },
  seatTextUnavailable: {
    color: '#6b7280',
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
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  legendText: {
    color: '#374151',
    fontSize: 13,
  },
  note: {
    marginTop: 20,
    color: '#6b7280',
    fontSize: 14,
  },
  button: {
    marginTop: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  holdPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    padding: 14,
  },
  holdTitle: {
    color: '#1e3a8a',
    fontSize: 15,
    fontWeight: '700',
  },
  holdText: {
    marginTop: 6,
    color: '#1f2937',
    fontSize: 14,
  },
  holdId: {
    marginTop: 6,
    color: '#4b5563',
    fontSize: 12,
  },
  holdError: {
    marginTop: 18,
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 14,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  error: {
    color: '#b91c1c',
    fontSize: 16,
  },
});

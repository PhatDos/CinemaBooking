import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '@/src/api/client';
import { getCinemaShowtimes, getCinemas, getRoomsByCinema } from '@/src/api/cinemas';
import { getMovies } from '@/src/api/movies';
import { getMyStaffCinemas } from '@/src/api/staff';
import { bulkCreateShowtimes, createShowtime } from '@/src/api/showtimes';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useAppNotification } from '@/src/components/AppNotification';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import {
  formatCinemaName,
  formatCurrency,
  formatDateTime,
  formatRoomName,
} from '@/src/display';
import { styles } from '@/src/styles/screens/staff-showtimes.styles';
import { colors } from '@/src/theme';
import type { Cinema, CinemaShowtime, Movie, Room } from '@/src/types';

const defaultPrice = '90000';
const defaultBulkTimes = '10:00, 13:00, 16:00, 19:00';

export default function StaffShowtimesScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<CinemaShowtime[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [movieQuery, setMovieQuery] = useState('');
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [time, setTime] = useState('10:00');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTimes, setBulkTimes] = useState(defaultBulkTimes);
  const [basePrice, setBasePrice] = useState(defaultPrice);
  const [loading, setLoading] = useState(true);
  const [loadingCinema, setLoadingCinema] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isStaff = roles.includes('Staff');
  const canManage = isAdmin || isStaff;

  const selectedCinema = useMemo(
    () => cinemas.find((cinema) => cinema.id === selectedCinemaId) ?? null,
    [cinemas, selectedCinemaId],
  );
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );
  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) ?? null,
    [movies, selectedMovieId],
  );
  const filteredMovies = useMemo(() => {
    const normalizedQuery = movieQuery.trim().toLowerCase();

    return movies
      .filter((movie) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          movie.title.toLowerCase().includes(normalizedQuery) ||
          (movie.genre?.toLowerCase().includes(normalizedQuery) ?? false) ||
          movie.genres.some((genre) =>
            genre.name.toLowerCase().includes(normalizedQuery),
          )
        );
      })
      .slice(0, 16);
  }, [movieQuery, movies]);

  const upcomingShowtimes = useMemo(
    () =>
      [...showtimes]
        .sort(
          (left, right) =>
            new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
        )
        .slice(0, 12),
    [showtimes],
  );

  const loadCinemaContext = useCallback(async (cinemaId: string, showSpinner = true) => {
    if (showSpinner) {
      setLoadingCinema(true);
    }

    setError('');

    try {
      const [roomResult, showtimeResult] = await Promise.all([
        getRoomsByCinema(cinemaId),
        getCinemaShowtimes(cinemaId),
      ]);
      const activeRooms = roomResult.filter((room) => room.isActive);

      setRooms(activeRooms);
      setShowtimes(showtimeResult);
      setSelectedRoomId((current) =>
        current && activeRooms.some((room) => room.id === current)
          ? current
          : activeRooms[0]?.id ?? null,
      );
    } catch (loadError) {
      console.error(loadError);
      const message = getFriendlyShowtimeError(
        loadError,
        'Cannot load rooms or showtimes.',
      );
      setError(message);
    } finally {
      setLoadingCinema(false);
    }
  }, []);

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const [cinemaResult, movieResult] = await Promise.all([
        isAdmin ? getCinemas() : getMyStaffCinemas(),
        getMovies(),
      ]);
      const activeCinemas = cinemaResult.filter((cinema) => cinema.isActive);
      const activeMovies = movieResult.filter((movie) => movie.isActive);

      setCinemas(activeCinemas);
      setMovies(activeMovies);
      setSelectedCinemaId((current) =>
        current && activeCinemas.some((cinema) => cinema.id === current)
          ? current
          : activeCinemas[0]?.id ?? null,
      );
      setSelectedMovieId((current) =>
        current && activeMovies.some((movie) => movie.id === current)
          ? current
          : activeMovies[0]?.id ?? null,
      );
    } catch (loadError) {
      console.error(loadError);
      const message = getFriendlyShowtimeError(loadError, 'Cannot load showtime data.');
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthenticated && canManage) {
      void Promise.resolve().then(() => loadData());
    }
  }, [canManage, isAuthenticated, loadData]);

  useEffect(() => {
    if (!selectedCinemaId) {
      void Promise.resolve().then(() => {
        setRooms([]);
        setShowtimes([]);
        setSelectedRoomId(null);
      });
      return;
    }

    void Promise.resolve().then(() => loadCinemaContext(selectedCinemaId));
  }, [loadCinemaContext, selectedCinemaId]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(false);

    if (selectedCinemaId) {
      await loadCinemaContext(selectedCinemaId, false);
    }
  }

  async function handleCreateShowtime() {
    if (saving) {
      return;
    }

    const price = Number(basePrice.trim());
    const validationError = validateForm({
      bulkMode,
      bulkTimes,
      date,
      price,
      roomId: selectedRoomId,
      movieId: selectedMovieId,
      time,
    });

    if (validationError) {
      setError(validationError);
      showNotification(validationError, { tone: 'error' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (bulkMode) {
        const startTimes = parseBulkTimes(bulkTimes).map((item) =>
          buildLocalIsoDateTime(date, item),
        );
        const result = await bulkCreateShowtimes({
          basePrice: price,
          movieId: selectedMovieId!,
          roomId: selectedRoomId!,
          startTimes,
        });

        showNotification(`${result.createdCount} showtimes created.`, {
          tone: 'success',
        });
      } else {
        await createShowtime({
          basePrice: price,
          movieId: selectedMovieId!,
          roomId: selectedRoomId!,
          startTime: buildLocalIsoDateTime(date, time),
        });
        showNotification('Showtime created.', { tone: 'success' });
      }

      if (selectedCinemaId) {
        await loadCinemaContext(selectedCinemaId, false);
      }
    } catch (saveError) {
      console.error(saveError);
      const message = getFriendlyShowtimeError(saveError, 'Cannot create showtime.');
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!canManage) {
    return <Redirect href="/movies" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void handleRefresh()}
            refreshing={refreshing}
          />
        }>
        <AnimatedPressable contentStyle={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <FadeInView>
          <Text style={styles.kicker}>{isAdmin ? 'Admin' : 'Staff'}</Text>
          <Text style={styles.title}>Manage Showtimes</Text>
          <Text style={styles.subtitle}>
            Create showtimes from active movies for available cinema rooms.
          </Text>
        </FadeInView>

        <View style={styles.group}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cinema</Text>
            <Text style={styles.sectionCount}>{cinemas.length}</Text>
          </View>
          {cinemas.length === 0 ? (
            <EmptyPanel
              body={
                isStaff
                  ? 'No cinema has been assigned to this staff account.'
                  : 'No active cinemas available.'
              }
              title="No cinemas"
            />
          ) : (
            <View style={styles.optionList}>
              {cinemas.map((cinema) => {
                const selected = cinema.id === selectedCinemaId;

                return (
                  <Pressable
                    disabled={saving}
                    key={cinema.id}
                    onPress={() => setSelectedCinemaId(cinema.id)}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}>
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.optionText}>
                      <Text numberOfLines={1} style={styles.optionTitle}>
                        {formatCinemaName(cinema.name)}
                      </Text>
                      <Text numberOfLines={1} style={styles.optionMeta}>
                        {getCinemaCity(cinema)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.group}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Room</Text>
            {loadingCinema ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
          {rooms.length === 0 ? (
            <EmptyPanel
              body={
                selectedCinema
                  ? 'This cinema has no active rooms.'
                  : 'Select a cinema first.'
              }
              title="No rooms"
            />
          ) : (
            <View style={styles.chipGrid}>
              {rooms.map((room) => {
                const selected = room.id === selectedRoomId;

                return (
                  <Pressable
                    disabled={saving}
                    key={room.id}
                    onPress={() => setSelectedRoomId(room.id)}
                    style={[styles.roomChip, selected && styles.roomChipSelected]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.roomChipText,
                        selected && styles.roomChipTextSelected,
                      ]}>
                      {formatRoomName(room.name)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.group}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movie</Text>
            <Text style={styles.sectionCount}>{movies.length}</Text>
          </View>
          <TextInput
            autoCapitalize="none"
            onChangeText={setMovieQuery}
            placeholder="Search active movies"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={movieQuery}
          />
          {filteredMovies.length === 0 ? (
            <EmptyPanel body="No active movie matches this search." title="No movies" />
          ) : (
            <View style={styles.movieList}>
              {filteredMovies.map((movie) => {
                const selected = movie.id === selectedMovieId;

                return (
                  <Pressable
                    disabled={saving}
                    key={movie.id}
                    onPress={() => setSelectedMovieId(movie.id)}
                    style={[styles.movieRow, selected && styles.movieRowSelected]}>
                    <View style={styles.movieText}>
                      <Text numberOfLines={1} style={styles.movieTitle}>
                        {movie.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.movieMeta}>
                        {getMovieMeta(movie)}
                      </Text>
                    </View>
                    {selected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.group}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Schedule</Text>
              {selectedMovie && selectedRoom ? (
                <Text numberOfLines={1} style={styles.selectedSummary}>
                  {selectedMovie.title} | {formatRoomName(selectedRoom.name)}
                </Text>
              ) : null}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Bulk</Text>
              <Switch
                disabled={saving}
                onValueChange={setBulkMode}
                thumbColor={bulkMode ? colors.primary : colors.surface}
                trackColor={{ false: colors.border, true: '#fecaca' }}
                value={bulkMode}
              />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                editable={!saving}
                keyboardType="numbers-and-punctuation"
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#98a2b3"
                style={styles.input}
                value={date}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Base price</Text>
              <TextInput
                editable={!saving}
                keyboardType="numeric"
                onChangeText={setBasePrice}
                placeholder={defaultPrice}
                placeholderTextColor="#98a2b3"
                style={styles.input}
                value={basePrice}
              />
            </View>
          </View>

          {bulkMode ? (
            <View style={styles.field}>
              <Text style={styles.label}>Times</Text>
              <TextInput
                editable={!saving}
                multiline
                onChangeText={setBulkTimes}
                placeholder={defaultBulkTimes}
                placeholderTextColor="#98a2b3"
                style={[styles.input, styles.multilineInput]}
                value={bulkTimes}
              />
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Time</Text>
              <TextInput
                editable={!saving}
                keyboardType="numbers-and-punctuation"
                onChangeText={setTime}
                placeholder="HH:mm"
                placeholderTextColor="#98a2b3"
                style={styles.input}
                value={time}
              />
            </View>
          )}

          <AnimatedPressable
            contentStyle={[styles.primaryButton, saving && styles.buttonDisabled]}
            disabled={saving}
            onPress={() => void handleCreateShowtime()}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {bulkMode ? 'Create Showtimes' : 'Create Showtime'}
              </Text>
            )}
          </AnimatedPressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Upcoming</Text>
          <Text style={styles.listCount}>{upcomingShowtimes.length}</Text>
        </View>

        {upcomingShowtimes.length === 0 ? (
          <EmptyPanel
            body={
              selectedCinema
                ? 'No upcoming showtimes for this cinema.'
                : 'Select a cinema to view showtimes.'
            }
            title="No showtimes"
          />
        ) : (
          <View style={styles.showtimeList}>
            {upcomingShowtimes.map((showtime) => (
              <View key={showtime.showtimeId} style={styles.showtimeCard}>
                <View style={styles.showtimeInfo}>
                  <Text numberOfLines={1} style={styles.showtimeMovie}>
                    {showtime.movieTitle}
                  </Text>
                  <Text numberOfLines={1} style={styles.showtimeMeta}>
                    {formatRoomName(showtime.roomName)} |{' '}
                    {formatDateTime(showtime.startTime)}
                  </Text>
                </View>
                <Text style={styles.price}>{formatCurrency(showtime.basePrice)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function EmptyPanel({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{body}</Text>
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

function validateForm({
  bulkMode,
  bulkTimes,
  date,
  movieId,
  price,
  roomId,
  time,
}: {
  bulkMode: boolean;
  bulkTimes: string;
  date: string;
  movieId: string | null;
  price: number;
  roomId: string | null;
  time: string;
}) {
  if (!movieId) {
    return 'Select an active movie.';
  }

  if (!roomId) {
    return 'Select an active room.';
  }

  if (!isValidDateInput(date)) {
    return 'Date must use YYYY-MM-DD.';
  }

  if (!Number.isFinite(price) || price <= 0) {
    return 'Base price must be greater than 0.';
  }

  if (bulkMode) {
    const parsedTimes = parseBulkTimes(bulkTimes);

    if (parsedTimes.length === 0) {
      return 'Enter at least one time.';
    }

    if (parsedTimes.some((item) => !isValidTimeInput(item))) {
      return 'Every time must use HH:mm.';
    }

    if (new Set(parsedTimes).size !== parsedTimes.length) {
      return 'Bulk times must be unique.';
    }

    return null;
  }

  if (!isValidTimeInput(time)) {
    return 'Time must use HH:mm.';
  }

  return null;
}

function parseBulkTimes(value: string) {
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const dateValue = new Date(year, month - 1, day);

  return (
    dateValue.getFullYear() === year &&
    dateValue.getMonth() === month - 1 &&
    dateValue.getDate() === day
  );
}

function isValidTimeInput(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hour, minute] = value.split(':').map(Number);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function buildLocalIsoDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function toDateInputValue(value: Date) {
  const nextDay = new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1);
  const year = nextDay.getFullYear();
  const month = `${nextDay.getMonth() + 1}`.padStart(2, '0');
  const day = `${nextDay.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getFriendlyShowtimeError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const message = error.message || fallback;
  const normalized = message.toLowerCase();

  if (error.status === 403 || normalized.includes('cannot manage this cinema')) {
    return 'You can only manage showtimes for your assigned cinema.';
  }

  if (
    error.status === 409 ||
    normalized.includes('overlap') ||
    normalized.includes('conflict')
  ) {
    return 'This room already has an overlapping showtime.';
  }

  if (
    normalized.includes('inactive') ||
    normalized.includes('not active') ||
    normalized.includes('movie')
  ) {
    return 'Choose an active movie, room, and cinema before creating a showtime.';
  }

  return message;
}

function getMovieMeta(movie: Movie) {
  const genres = movie.genres.map((genre) => genre.name).join(', ') || movie.genre;

  return [genres, `${movie.durationMinutes} min`].filter(Boolean).join(' | ');
}

function getCinemaCity(cinema: Cinema) {
  return cinema.provinceName || cinema.city || 'Unknown city';
}

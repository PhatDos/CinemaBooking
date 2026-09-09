import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCinemaShowtimes, getCinemas, getRoomsByCinema } from '@/src/api/cinemas';
import { getMovies } from '@/src/api/movies';
import { getMyStaffCinemas } from '@/src/api/staff';
import { bulkCreateShowtimes, createShowtime } from '@/src/api/showtimes';
import { useAppNotification } from '@/src/components/AppNotification';
import type { Cinema, CinemaShowtime, Movie, Room } from '@/src/types';

import {
  getDateRangeForQuery,
  getTodayDateValue,
} from '@/src/features/showtimes/date-filter';

import {
  buildLocalIsoDateTime,
  defaultBulkTimes,
  defaultCouplePrice,
  defaultStandardPrice,
  defaultVipPrice,
  filterActiveMovies,
  getFriendlyShowtimeError,
  getUpcomingShowtimes,
  parseBulkTimes,
  toDateInputValue,
  validateForm,
} from '../utils';

export function useStaffShowtimes(isAdmin: boolean) {
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
  const [filterDate, setFilterDate] = useState(getTodayDateValue);
  const [includePast, setIncludePast] = useState(false);
  const [time, setTime] = useState('10:00');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTimes, setBulkTimes] = useState(defaultBulkTimes);
  const [standardPrice, setStandardPrice] = useState(defaultStandardPrice);
  const [vipPrice, setVipPrice] = useState(defaultVipPrice);
  const [couplePrice, setCouplePrice] = useState(defaultCouplePrice);
  const [loading, setLoading] = useState(true);
  const [loadingCinema, setLoadingCinema] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
  const filteredMovies = useMemo(
    () => filterActiveMovies(movies, movieQuery),
    [movieQuery, movies],
  );
  const upcomingShowtimes = useMemo(
    () => getUpcomingShowtimes(showtimes),
    [showtimes],
  );

  const loadCinemaContext = useCallback(async (
    cinemaId: string,
    showSpinner = true,
  ) => {
    if (showSpinner) {
      setLoadingCinema(true);
    }

    setError('');

    try {
      const [roomResult, showtimeResult] = await Promise.all([
        getRoomsByCinema(cinemaId),
        getCinemaShowtimes(cinemaId, {
          ...getDateRangeForQuery(filterDate),
          includePast,
        }),
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
      setError(getFriendlyShowtimeError(loadError, 'Cannot load rooms or showtimes.'));
    } finally {
      setLoadingCinema(false);
    }
  }, [filterDate, includePast]);

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
      setError(getFriendlyShowtimeError(loadError, 'Cannot load showtime data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

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

  async function refreshShowtimes() {
    setRefreshing(true);
    await loadData(false);

    if (selectedCinemaId) {
      await loadCinemaContext(selectedCinemaId, false);
    }
  }

  async function createSelectedShowtime() {
    if (saving) {
      return;
    }

    const seatPrices = {
      standard: Number(standardPrice.trim()),
      vip: Number(vipPrice.trim()),
      couple: Number(couplePrice.trim()),
    };
    const validationError = validateForm({
      bulkMode,
      bulkTimes,
      date,
      prices: seatPrices,
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
          basePrice: seatPrices.standard,
          couplePrice: seatPrices.couple,
          movieId: selectedMovieId!,
          roomId: selectedRoomId!,
          standardPrice: seatPrices.standard,
          startTimes,
          vipPrice: seatPrices.vip,
        });

        showNotification(`${result.createdCount} showtimes created for ${date}.`, {
          tone: 'success',
        });
      } else {
        await createShowtime({
          basePrice: seatPrices.standard,
          couplePrice: seatPrices.couple,
          movieId: selectedMovieId!,
          roomId: selectedRoomId!,
          standardPrice: seatPrices.standard,
          startTime: buildLocalIsoDateTime(date, time),
          vipPrice: seatPrices.vip,
        });
        showNotification(`Showtime created for ${date} ${time}.`, { tone: 'success' });
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

  return {
    bulkMode,
    bulkTimes,
    cinemas,
    couplePrice,
    createSelectedShowtime,
    date,
    error,
    filterDate,
    filteredMovies,
    includePast,
    loading,
    loadingCinema,
    movieQuery,
    movies,
    refreshShowtimes,
    refreshing,
    rooms,
    saving,
    selectedCinema,
    selectedCinemaId,
    selectedMovie,
    selectedMovieId,
    selectedRoom,
    selectedRoomId,
    setBulkMode,
    setBulkTimes,
    setCouplePrice,
    setDate,
    setFilterDate,
    setIncludePast,
    setMovieQuery,
    setSelectedCinemaId,
    setSelectedMovieId,
    setSelectedRoomId,
    setStandardPrice,
    setTime,
    setVipPrice,
    standardPrice,
    time,
    upcomingShowtimes,
    vipPrice,
  };
}

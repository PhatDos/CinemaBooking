import { ApiError } from '@/src/api/client';
import { formatCurrency } from '@/src/display';
import type { Cinema, CinemaShowtime, Movie } from '@/src/types';

export const defaultStandardPrice = '90000';
export const defaultVipPrice = '100000';
export const defaultCouplePrice = '200000';
export const defaultBulkTimes = '10:00, 13:00, 16:00, 19:00';

export type SeatPriceInputs = {
  standard: number;
  vip: number;
  couple: number;
};

export function filterActiveMovies(movies: Movie[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

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
}

export function getUpcomingShowtimes(showtimes: CinemaShowtime[]) {
  return [...showtimes]
    .sort(
      (left, right) =>
        new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    )
    .slice(0, 12);
}

export function validateForm({
  bulkMode,
  bulkTimes,
  date,
  movieId,
  prices,
  roomId,
  time,
}: {
  bulkMode: boolean;
  bulkTimes: string;
  date: string;
  movieId: string | null;
  prices: SeatPriceInputs;
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

  if (
    !isValidPrice(prices.standard) ||
    !isValidPrice(prices.vip) ||
    !isValidPrice(prices.couple)
  ) {
    return 'Seat prices must be between 1 and 10000000.';
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

export function parseBulkTimes(value: string) {
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildLocalIsoDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function toDateInputValue(value: Date) {
  const nextDay = new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1);
  const year = nextDay.getFullYear();
  const month = `${nextDay.getMonth() + 1}`.padStart(2, '0');
  const day = `${nextDay.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getFriendlyShowtimeError(error: unknown, fallback: string) {
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

export function getMovieMeta(movie: Movie) {
  const genres = movie.genres.map((genre) => genre.name).join(', ') || movie.genre;

  return [genres, `${movie.durationMinutes} min`].filter(Boolean).join(' | ');
}

export function formatSeatPrices(
  standardPrice: number,
  vipPrice: number,
  couplePrice: number,
) {
  return `STD ${formatCurrency(standardPrice)} | VIP ${formatCurrency(vipPrice)} | Couple ${formatCurrency(couplePrice)}`;
}

export function getCinemaCity(cinema: Cinema) {
  return cinema.provinceName || cinema.city || 'Unknown city';
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

function isValidPrice(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 10000000;
}

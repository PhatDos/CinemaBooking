import { ApiError } from '@/src/api/client';
import { formatVenueName, getSeatLabel } from '@/src/display';
import type { Booking, BookingStatus, Checkout, SeatAvailability, Showtime } from '@/src/types';

export type ReservationDisplay = {
  seatLabels: string[];
  showtimeLabel: string;
};

export type BookingListItem =
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

export function buildBookingListItems(
  bookings: Booking[],
  checkouts: Checkout[],
): BookingListItem[] {
  return [
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
  ].sort(
    (left, right) =>
      new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime(),
  );
}

export function buildReservationRequestItems(
  bookings: Booking[],
  checkouts: Checkout[],
) {
  return [
    ...checkouts.map((checkout) => ({
      id: getCheckoutDisplayKey(checkout),
      seatIds: checkout.seatIds,
      showtimeId: checkout.showtimeId,
    })),
    ...bookings.map((booking) => ({
      id: getBookingDisplayKey(booking),
      seatIds: booking.seatIds,
      showtimeId: booking.showtimeId,
    })),
  ];
}

export function buildShowtimeLabel(
  showtime: Showtime,
  movieTitle: string,
  cinemaName: string,
  roomName: string,
) {
  return `${movieTitle} | ${formatDateTime(showtime.startTime)} | ${formatVenueName(cinemaName, roomName)}`;
}

export function mapSeatLabelsById(seats: SeatAvailability[]) {
  return new Map(seats.map((seat) => [seat.seatId, getSeatLabel(seat)]));
}

export function normalizeStatus(status: BookingStatus) {
  return status.toLowerCase();
}

export function getStatusLabel(status: BookingStatus) {
  const normalized = normalizeStatus(status);

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getCheckoutStatusLabel(status: Checkout['status']) {
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

export function isPendingStatus(status: BookingStatus) {
  return normalizeStatus(status) === 'pending';
}

export function formatSeatFallback(count: number) {
  if (count <= 0) {
    return 'No seats';
  }

  return `${count} seat${count > 1 ? 's' : ''}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getBookingDisplayKey(booking: Booking) {
  return `booking:${booking.id}`;
}

export function getCheckoutDisplayKey(checkout: Checkout) {
  return `checkout:${checkout.holdId}`;
}

export function getCheckoutCancelErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'This payment is still active or already paid. Seats were not released.'
      : error.message;
  }

  return 'Cannot cancel checkout right now.';
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'Seats are no longer available.' : error.message;
  }

  return 'Cannot start payment.';
}

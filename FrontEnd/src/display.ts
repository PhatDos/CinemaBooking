import type { SeatAvailability } from '@/src/types';

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSeatLabel(seat: Pick<SeatAvailability, 'row' | 'number'>) {
  return `${seat.row}${seat.number}`;
}

export function getSeatLabels(
  seatIds: string[],
  seats: SeatAvailability[],
) {
  const labelsById = new Map(
    seats.map((seat) => [seat.seatId, getSeatLabel(seat)]),
  );

  return seatIds
    .map((seatId) => labelsById.get(seatId))
    .filter((label): label is string => Boolean(label));
}

export function formatCinemaName(name: string | null | undefined) {
  return sanitizeGuidText(name, 'Cinema');
}

export function formatRoomName(name: string | null | undefined) {
  return sanitizeGuidText(name, 'Room');
}

export function formatVenueName(
  cinemaName: string | null | undefined,
  roomName: string | null | undefined,
) {
  return `${formatCinemaName(cinemaName)} - ${formatRoomName(roomName)}`;
}

export function sanitizeGuidText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();

  if (!normalized || isGuid(normalized)) {
    return fallback;
  }

  return normalized;
}

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

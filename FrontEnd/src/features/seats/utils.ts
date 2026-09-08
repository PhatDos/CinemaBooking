import { ApiError } from '@/src/api/client';
import { formatCurrency } from '@/src/display';
import type { SeatAvailability } from '@/src/types';

import { seatGap } from './styles';

export function getPriceByType(seats: SeatAvailability[]) {
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

export function formatSeatTypeLegend(
  type: SeatAvailability['type'],
  prices: Map<SeatAvailability['type'], number>,
) {
  const price = prices.get(type);

  return price === undefined ? type : `${type} ${formatCurrency(price)}`;
}

export function groupSeatsByRow(seats: SeatAvailability[]) {
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

export function getRowSlotCount(seats: SeatAvailability[]) {
  return seats.reduce(
    (total, seat) => total + getSeatSlotSpan(seat),
    0,
  );
}

export function getSeatWidth(
  seat: Pick<SeatAvailability, 'type'>,
  seatSize: number,
) {
  return seat.type === 'Couple'
    ? seatSize * 2 + seatGap
    : seatSize;
}

export function getContinueErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'One or more seats were just taken. Please choose again.'
      : error.message;
  }

  return 'Cannot continue checkout';
}

export function getSeatPrice(seat: { price?: number | null }) {
  const apiPrice = Number(seat.price);

  if (Number.isFinite(apiPrice)) {
    return apiPrice;
  }

  return null;
}

export function calculateSeatSize(screenWidth: number, seatsPerRow: number) {
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

function getSeatSlotSpan(seat: Pick<SeatAvailability, 'type'>) {
  return seat.type === 'Couple' ? 2 : 1;
}

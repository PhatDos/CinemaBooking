import { ApiError } from '@/src/api/client';

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export type CheckoutContext = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  seatLabels?: string[];
  startTime: string;
};

export function normalizeStatus(status: string) {
  return status.toLowerCase();
}

export function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getCheckoutStateText(
  status: string,
  paid: boolean,
  fulfillmentConflict: boolean,
) {
  if (fulfillmentConflict) {
    return 'Payment needs support';
  }

  if (paid || status === 'confirmed') {
    return 'Payment completed';
  }

  if (status === 'expired') {
    return 'Booking expired';
  }

  if (status === 'cancelled') {
    return 'Booking cancelled';
  }

  return 'Pending payment';
}

export function getButtonText(
  status: string,
  paid: boolean,
  fulfillmentConflict: boolean,
  hasPaymentLink: boolean,
) {
  if (fulfillmentConflict) {
    return 'Contact support';
  }

  if (paid || status === 'confirmed') {
    return 'Payment completed';
  }

  if (status === 'expired') {
    return 'Booking expired';
  }

  if (status === 'cancelled') {
    return 'Booking cancelled';
  }

  if (hasPaymentLink) {
    return 'Waiting for payment';
  }

  return 'Cancel booking';
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

export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatSeatFallback(count: number) {
  if (count <= 0) {
    return 'No seats';
  }

  return `${count} seat${count > 1 ? 's' : ''}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getCancelErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409
      ? 'Booking can no longer be cancelled.'
      : error.message;
  }

  return 'Cannot cancel booking';
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 409 ? 'Seats are no longer available.' : error.message;
  }

  return 'Cannot start payment';
}

export function getCancelHoldErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Cannot cancel checkout';
}

export function isNonEmptyGuid(value?: string) {
  if (!value || value === EMPTY_GUID) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

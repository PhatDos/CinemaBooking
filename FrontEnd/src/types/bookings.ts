import type { SeatType } from './cinemas';
import type { Payment } from './payments';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'Pending'
  | 'Confirmed'
  | 'Cancelled'
  | 'Expired';

export type SeatStatus = 'available' | 'held' | 'reserved' | 'booked';

export type BookingSeat = {
  seatId: string;
  price: number;
};

export type Booking = {
  id: string;
  userId: string;
  showtimeId: string;
  holdId?: string | null;
  status: BookingStatus;
  totalAmount: number;
  seatIds: string[];
  seats: BookingSeat[];
  createdAt: string;
  expiresAt: string | null;
};

export type SeatAvailability = {
  seatId: string;
  row: string;
  number: number;
  type: SeatType;
  price?: number | null;
  status: SeatStatus;
};

export type HoldSeatsRequest = {
  seatIds: string[];
};

export type HoldSeatsResponse = {
  holdId: string;
  showtimeId: string;
  seatIds: string[];
  expiresAt: string;
};

export type CheckoutStatus =
  | 'Held'
  | 'PaymentPending'
  | 'PaymentProcessing'
  | 'PaymentConflict'
  | 'PaymentFailed'
  | 'Cancelled';

export type Checkout = {
  holdId: string;
  userId: string;
  showtimeId: string;
  seatIds: string[];
  amount: number;
  expiresAt: string;
  status: CheckoutStatus;
  payment: Payment | null;
  checkoutUrl: string | null;
};

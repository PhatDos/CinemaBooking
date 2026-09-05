export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  roles: string[];
};

export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
};

export type Movie = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl: string | null;
  trailerUrl: string | null;
  genre: string | null;
  isActive: boolean;
};

export type MovieDetail = Movie;

export type CreateMovieRequest = {
  title: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  genre?: string | null;
  isActive?: boolean;
};

export type BulkCreateMoviesRequest = {
  movies: CreateMovieRequest[];
};

export type BulkCreateMoviesResult = {
  createdCount: number;
  movieIds: string[];
};

export type Showtime = {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
};

export type CreateShowtimeRequest = {
  movieId: string;
  roomId: string;
  startTime: string;
  basePrice: number;
};

export type BulkCreateShowtimesRequest = {
  movieId: string;
  roomId: string;
  startTimes: string[];
  basePrice: number;
};

export type BulkCreateShowtimesResult = {
  createdCount: number;
  showtimeIds: string[];
};

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

export type SeatType = 'Standard' | 'VIP' | 'Couple';

export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed';

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

export type CreateBookingRequest = {
  holdId: string;
};

export type CreateBookingResult = {
  bookingId: string;
  holdId: string;
  userId: string;
  showtimeId: string;
  status: BookingStatus;
  totalAmount: number;
  seatIds: string[];
  createdAt: string;
  expiresAt: string | null;
};

export type Seat = {
  id: string;
  roomId: string;
  row: string;
  number: number;
  type: SeatType;
};

export type Room = {
  id: string;
  cinemaId: string;
  name: string;
  isActive: boolean;
  seats?: Seat[];
};

export type Cinema = {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string | null;
  isActive: boolean;
  rooms?: Room[];
};

export type Payment = {
  id: string;
  bookingId: string;
  orderCode: number | null;
  amount: number;
  status: PaymentStatus;
  provider: string;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type TicketStatus = 'Valid' | 'Used' | 'Cancelled';

export type Ticket = {
  id: string;
  bookingId: string;
  showtimeId: string;
  seatId: string;
  code: string;
  status: TicketStatus;
};

export type CheckInTicketResponse = {
  ticketId: string;
  bookingId: string;
  showtimeId: string;
  seatId: string;
  status: 'Used';
  usedAt: string;
};

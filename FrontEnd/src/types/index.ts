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

export type AdminUser = {
  id: string;
  email: string;
  userName: string | null;
  createdAt: string;
  roles: string[];
  assignedCinemaIds: string[];
};

export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
};

export type MovieGenreRef = {
  id: string;
  name: string;
  slug: string;
};

export type Movie = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl: string | null;
  posterPublicId: string | null;
  trailerUrl: string | null;
  genreId: string | null;
  genre: string | null;
  genres: MovieGenreRef[];
  isActive: boolean;
};

export type MovieDetail = Movie;

export type Genre = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  createdAt: string;
};

export type CreateGenreRequest = {
  name: string;
  slug?: string | null;
  imageUrl: string;
};

export type UpdateGenreRequest = CreateGenreRequest;

export type CreateMovieRequest = {
  title: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl?: string | null;
  posterPublicId?: string | null;
  trailerUrl?: string | null;
  genreId?: string | null;
  genreIds?: string[] | null;
  isActive?: boolean;
};

export type UpdateMovieRequest = CreateMovieRequest & {
  isActive: boolean;
};

export type BulkCreateMoviesRequest = {
  movies: CreateMovieRequest[];
};

export type BulkCreateMoviesResult = {
  createdCount: number;
  movieIds: string[];
};

export type MovieImportBatchStatus = 'Running' | 'Completed' | 'Failed';

export type MovieImportCandidateStatus =
  | 'Discovered'
  | 'Crawled'
  | 'Failed'
  | 'NeedsReview'
  | 'Approved'
  | 'Rejected';

export type MovieImportBatch = {
  id: string;
  source: string;
  status: MovieImportBatchStatus;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  candidateCount: number;
};

export type MovieImportCandidate = {
  id: string;
  batchId: string;
  source: string;
  sourceUrl: string;
  listingTitle: string | null;
  listingGenres: string[];
  popularity: number | null;
  releaseTimestamp: number | null;
  title: string;
  normalizedTitle: string;
  description: string;
  durationMinutes: number | null;
  releaseDate: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  genreName: string | null;
  genreNames: string[];
  matchMovieId: string | null;
  matchMovie: Movie | null;
  status: MovieImportCandidateStatus;
  warnings: string | null;
  detailError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MovieImportRunRequest = {
  source?: string;
};

export type Showtime = {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  standardPrice: number;
  vipPrice: number;
  couplePrice: number;
};

export type CinemaShowtime = {
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string | null;
  genreId: string | null;
  genre: string | null;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  standardPrice: number;
  vipPrice: number;
  couplePrice: number;
};

export type CreateShowtimeRequest = {
  movieId: string;
  roomId: string;
  startTime: string;
  basePrice: number;
  standardPrice?: number | null;
  vipPrice?: number | null;
  couplePrice?: number | null;
};

export type BulkCreateShowtimesRequest = {
  movieId: string;
  roomId: string;
  startTimes: string[];
  basePrice: number;
  standardPrice?: number | null;
  vipPrice?: number | null;
  couplePrice?: number | null;
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

export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Cancelled';

export type PaymentFulfillmentStatus = 'Pending' | 'Fulfilled' | 'Conflict';

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
  imageUrl?: string | null;
  isActive: boolean;
  rooms?: Room[];
  provinceCode?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  addressLine?: string | null;
};

export type LocationItem = {
  code: string;
  name: string;
};

export type Payment = {
  id: string;
  bookingId: string | null;
  holdId: string | null;
  showtimeId: string | null;
  orderCode: number | null;
  amount: number;
  status: PaymentStatus;
  fulfillmentStatus: PaymentFulfillmentStatus;
  fulfillmentLastError: string | null;
  provider: string;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  fulfilledAt: string | null;
  fulfillmentFailedAt: string | null;
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

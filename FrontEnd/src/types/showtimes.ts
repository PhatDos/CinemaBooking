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

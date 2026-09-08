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

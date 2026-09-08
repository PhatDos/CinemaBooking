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

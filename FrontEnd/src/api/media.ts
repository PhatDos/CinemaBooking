import { apiFetch } from '@/src/api/client';

export type MoviePosterUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
};

export type UploadedMoviePoster = {
  posterUrl: string;
  posterPublicId: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
};

export function signMoviePosterUpload() {
  return apiFetch<MoviePosterUploadSignature>(
    '/api/media/movie-poster/sign-upload',
    {
      method: 'POST',
    },
  );
}

export async function uploadMoviePoster(
  imageUri: string,
  signature: MoviePosterUploadSignature,
): Promise<UploadedMoviePoster> {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: 'movie-poster.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', signature.timestamp.toString());
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json() as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error('Poster upload failed.');
  }

  return {
    posterUrl: toOptimizedCloudinaryUrl(data.secure_url),
    posterPublicId: data.public_id,
  };
}

function toOptimizedCloudinaryUrl(url: string) {
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}

import * as FileSystem from 'expo-file-system/legacy';

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
  mimeType = 'image/jpeg',
): Promise<UploadedMoviePoster> {
  const file = await toCloudinaryFileValue(imageUri, mimeType);
  const formData = new FormData();

  formData.append('file', file);
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

async function toCloudinaryFileValue(imageUri: string, mimeType: string) {
  if (imageUri.startsWith('data:') || imageUri.startsWith('http')) {
    return imageUri;
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:${mimeType};base64,${base64}`;
}

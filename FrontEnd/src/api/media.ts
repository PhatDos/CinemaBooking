import * as FileSystem from 'expo-file-system/legacy';

import { apiPost } from '@/src/api/client';

export type ImageUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
};

export type MoviePosterUploadSignature = ImageUploadSignature;
export type CinemaImageUploadSignature = ImageUploadSignature;

export type UploadedMoviePoster = {
  posterUrl: string;
  posterPublicId: string;
};

export type UploadedCinemaImage = {
  imageUrl: string;
  imagePublicId: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
};

export function signMoviePosterUpload() {
  return apiPost<MoviePosterUploadSignature>('/api/media/movie-poster/sign-upload');
}

export function signCinemaImageUpload() {
  return apiPost<CinemaImageUploadSignature>('/api/media/cinema-image/sign-upload');
}

export async function uploadMoviePoster(
  imageUri: string,
  signature: ImageUploadSignature,
  mimeType = 'image/jpeg',
): Promise<UploadedMoviePoster> {
  const uploaded = await uploadCloudinaryImage(imageUri, signature, mimeType);

  return {
    posterUrl: uploaded.url,
    posterPublicId: uploaded.publicId,
  };
}

export async function uploadCinemaImage(
  imageUri: string,
  signature: ImageUploadSignature,
  mimeType = 'image/jpeg',
): Promise<UploadedCinemaImage> {
  const uploaded = await uploadCloudinaryImage(imageUri, signature, mimeType);

  return {
    imageUrl: uploaded.url,
    imagePublicId: uploaded.publicId,
  };
}

async function uploadCloudinaryImage(
  imageUri: string,
  signature: ImageUploadSignature,
  mimeType: string,
) {
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
    throw new Error('Image upload failed.');
  }

  return {
    url: toOptimizedCloudinaryUrl(data.secure_url),
    publicId: data.public_id,
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

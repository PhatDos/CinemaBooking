import { apiRequest } from '@/src/api/client';
import type { AuthResponse, CurrentUser, LoginRequest, RefreshTokenRequest } from '@/src/types';

export function login(request: LoginRequest) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: request,
  });
}

export function refreshAuth(request: RefreshTokenRequest) {
  return apiRequest<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    auth: false,
    body: request,
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/api/auth/me');
}

export function logout(refreshToken: string) {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}

import { apiPost, apiRequest } from '@/src/api/client';
import type { AuthResponse, CurrentUser, LoginRequest, RefreshTokenRequest } from '@/src/types';

export function login(request: LoginRequest) {
  return apiPost<AuthResponse>('/api/auth/login', request, { auth: false });
}

export function refreshAuth(request: RefreshTokenRequest) {
  return apiPost<AuthResponse>('/api/auth/refresh', request, { auth: false });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/api/auth/me');
}

export function logout(refreshToken: string) {
  return apiPost<void>('/api/auth/logout', { refreshToken });
}

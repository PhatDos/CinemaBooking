import { apiFetch } from '@/src/api/client';
import type { Cinema } from '@/src/types';

export function getMyStaffCinemas() {
  return apiFetch<Cinema[]>('/api/staff/me/cinemas');
}

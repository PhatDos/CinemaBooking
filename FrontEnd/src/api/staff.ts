import { apiFetch } from '@/src/api/client';
import type { Cinema } from '@/src/types';

export type StaffCinemaAssignmentStatus = {
  cinemaId: string;
  userId: string;
  isAssigned: boolean;
};

export function getMyStaffCinemas() {
  return apiFetch<Cinema[]>('/api/staff/me/cinemas');
}

export function getCurrentStaffCinemaAssignment(cinemaId: string) {
  return apiFetch<StaffCinemaAssignmentStatus>(
    `/api/cinemas/${cinemaId}/staff/me`,
  );
}

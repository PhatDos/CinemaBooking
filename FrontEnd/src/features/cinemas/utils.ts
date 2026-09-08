import type {
  CreateCinemaRequest,
  CreateRoomRequest,
  UpdateCinemaRequest,
  UpdateRoomRequest,
} from '@/src/api/cinemas';
import type { Cinema, Room } from '@/src/types';

export type CinemaFormState = {
  address: string;
  addressLine: string;
  city: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  name: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
};

export type RoomFormState = {
  isActive: boolean;
  name: string;
};

export const defaultCinemaForm: CinemaFormState = {
  address: '',
  addressLine: '',
  city: '',
  description: '',
  imageUrl: '',
  isActive: true,
  name: '',
  provinceCode: '',
  provinceName: '',
  wardCode: '',
  wardName: '',
};

export const defaultRoomForm: RoomFormState = {
  isActive: true,
  name: '',
};

export function toCinemaForm(cinema: Cinema): CinemaFormState {
  return {
    address: cinema.address,
    addressLine: cinema.addressLine ?? '',
    city: cinema.city,
    description: cinema.description ?? '',
    imageUrl: cinema.imageUrl ?? '',
    isActive: cinema.isActive,
    name: cinema.name,
    provinceCode: cinema.provinceCode ?? '',
    provinceName: cinema.provinceName ?? '',
    wardCode: cinema.wardCode ?? '',
    wardName: cinema.wardName ?? '',
  };
}

export function toRoomForm(room: Room): RoomFormState {
  return {
    isActive: room.isActive,
    name: room.name,
  };
}

export function toCreateCinemaRequest(form: CinemaFormState): CreateCinemaRequest {
  const provinceName = form.provinceName.trim();

  return {
    address: form.address.trim(),
    addressLine: toOptionalString(form.addressLine),
    city: provinceName,
    description: toOptionalString(form.description),
    imageUrl: toOptionalString(form.imageUrl),
    name: form.name.trim(),
    provinceCode: toOptionalString(form.provinceCode),
    provinceName: toOptionalString(form.provinceName),
    wardCode: toOptionalString(form.wardCode),
    wardName: toOptionalString(form.wardName),
  };
}

export function toUpdateCinemaRequest(form: CinemaFormState): UpdateCinemaRequest {
  return {
    ...toCreateCinemaRequest(form),
    isActive: form.isActive,
  };
}

export function toCreateRoomRequest(form: RoomFormState): CreateRoomRequest {
  return {
    isActive: form.isActive,
    name: form.name.trim(),
  };
}

export function toUpdateRoomRequest(form: RoomFormState): UpdateRoomRequest {
  return {
    isActive: form.isActive,
    name: form.name.trim(),
  };
}

export function validateCinemaForm(form: CinemaFormState) {
  if (!form.name.trim()) {
    return 'Cinema name is required.';
  }

  if (!form.address.trim()) {
    return 'Address is required.';
  }

  if (!form.provinceCode.trim() || !form.provinceName.trim()) {
    return 'Province / city is required.';
  }

  if (!form.wardCode.trim() || !form.wardName.trim()) {
    return 'Ward is required.';
  }

  return '';
}

export function validateRoomForm(form: RoomFormState) {
  if (!form.name.trim()) {
    return 'Room name is required.';
  }

  return '';
}

export function getCinemaLocation(cinema: Cinema) {
  return cinema.wardName || cinema.provinceName || cinema.city || 'No location';
}

export function getCinemaInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function toOptionalString(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

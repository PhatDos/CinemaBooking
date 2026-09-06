import { apiFetch } from '@/src/api/client';
import type { LocationItem } from '@/src/types';

let provincesCache: LocationItem[] | null = null;
let provincesPromise: Promise<LocationItem[]> | null = null;
const wardsCache = new Map<string, LocationItem[]>();
const wardsPromises = new Map<string, Promise<LocationItem[]>>();

type CacheOptions = {
  forceRefresh?: boolean;
};

export async function getProvinces(options: CacheOptions = {}) {
  if (!options.forceRefresh && provincesCache) {
    return provincesCache;
  }

  if (!options.forceRefresh && provincesPromise) {
    return provincesPromise;
  }

  provincesPromise = apiFetch<LocationItem[]>('/api/locations/provinces', {
    auth: false,
  })
    .then((provinces) => {
      provincesCache = provinces;
      return provinces;
    })
    .finally(() => {
      provincesPromise = null;
    });

  return provincesPromise;
}

export async function getWards(
  provinceCode: string,
  options: CacheOptions = {},
) {
  if (!options.forceRefresh && wardsCache.has(provinceCode)) {
    return wardsCache.get(provinceCode)!;
  }

  const pending = wardsPromises.get(provinceCode);

  if (!options.forceRefresh && pending) {
    return pending;
  }

  const promise = apiFetch<LocationItem[]>(
    `/api/locations/provinces/${provinceCode}/wards`,
    {
      auth: false,
    },
  )
    .then((wards) => {
      wardsCache.set(provinceCode, wards);
      return wards;
    })
    .finally(() => {
      wardsPromises.delete(provinceCode);
    });

  wardsPromises.set(provinceCode, promise);

  return promise;
}

export function clearLocationsCache() {
  provincesCache = null;
  provincesPromise = null;
  wardsCache.clear();
  wardsPromises.clear();
}

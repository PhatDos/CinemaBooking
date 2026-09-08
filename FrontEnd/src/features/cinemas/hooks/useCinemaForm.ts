import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/src/api/client';
import {
  createCinema,
  getCinema,
  updateCinema,
} from '@/src/api/cinemas';
import { getProvinces, getWards } from '@/src/api/locations';
import { signCinemaImageUpload, uploadCinemaImage } from '@/src/api/media';
import { useAppNotification } from '@/src/components/AppNotification';
import type { LocationItem } from '@/src/types';

import {
  defaultCinemaForm,
  toCinemaForm,
  toCreateCinemaRequest,
  toUpdateCinemaRequest,
  validateCinemaForm,
  type CinemaFormState,
} from '../utils';

const manageRoute = '/cinemas/manage' as Href;

export function useCinemaForm(cinemaId?: string) {
  const { showNotification } = useAppNotification();
  const [form, setForm] = useState<CinemaFormState>(defaultCinemaForm);
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [imageLocalUri, setImageLocalUri] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editing = Boolean(cinemaId);

  const selectedProvince = useMemo(
    () => provinces.find((province) => province.code === form.provinceCode) ?? null,
    [form.provinceCode, provinces],
  );

  const selectedWard = useMemo(
    () => wards.find((ward) => ward.code === form.wardCode) ?? null,
    [form.wardCode, wards],
  );

  const loadWards = useCallback(async (provinceCode: string) => {
    setLoadingWards(true);

    try {
      const result = await getWards(provinceCode);
      setWards(result);
      return result;
    } catch (loadError) {
      console.error(loadError);
      setWards([]);
      showNotification('Cannot load wards right now.', { tone: 'error' });
      return [];
    } finally {
      setLoadingWards(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [provinceResult, cinemaResult] = await Promise.all([
          getProvinces(),
          cinemaId ? getCinema(cinemaId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setProvinces(provinceResult);

        if (cinemaResult) {
          const nextForm = toCinemaForm(cinemaResult);
          setForm(nextForm);
          setImageLocalUri(null);

          if (nextForm.provinceCode) {
            void loadWards(nextForm.provinceCode);
          }
        }
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load cinema form data');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [cinemaId, loadWards]);

  function updateField<K extends keyof CinemaFormState>(
    field: K,
    value: CinemaFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectProvince(province: LocationItem) {
    setForm((current) => ({
      ...current,
      city: province.name,
      provinceCode: province.code,
      provinceName: province.name,
      wardCode: '',
      wardName: '',
    }));
    void loadWards(province.code);
  }

  function selectWard(ward: LocationItem) {
    setForm((current) => ({
      ...current,
      wardCode: ward.code,
      wardName: ward.name,
    }));
  }

  async function pickImage() {
    if (saving) {
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const message = 'Photo library permission is required.';
      setError(message);
      showNotification(message, { tone: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      return;
    }

    setImageLocalUri(asset.uri);
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
    updateField('imageUrl', asset.uri);
  }

  function clearImage() {
    setImageLocalUri(null);
    updateField('imageUrl', '');
  }

  async function save() {
    if (saving) {
      return;
    }

    const validationError = validateCinemaForm(form);

    if (validationError) {
      setError(validationError);
      showNotification(validationError, { tone: 'error' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      const nextForm = { ...form };

      if (imageLocalUri) {
        showNotification('Uploading cinema image...', { tone: 'info' });
        const signature = await signCinemaImageUpload();
        const uploaded = await uploadCinemaImage(
          imageLocalUri,
          signature,
          imageMimeType,
        );

        nextForm.imageUrl = uploaded.imageUrl;
      }

      if (editing && cinemaId) {
        await updateCinema(cinemaId, toUpdateCinemaRequest(nextForm));
        showNotification('Cinema updated.', { tone: 'success' });
      } else {
        await createCinema(toCreateCinemaRequest(nextForm));
        showNotification('Cinema created.', { tone: 'success' });
      }

      router.replace(manageRoute);
    } catch (saveError) {
      console.error(saveError);
      const message = saveError instanceof ApiError
        ? saveError.message
        : editing ? 'Cannot update cinema right now.' : 'Cannot create cinema right now.';
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return {
    clearImage,
    editing,
    error,
    form,
    loading,
    loadingWards,
    pickImage,
    provinces,
    save,
    saving,
    selectedProvince,
    selectedWard,
    selectProvince,
    selectWard,
    setForm,
    updateField,
    wards,
  };
}

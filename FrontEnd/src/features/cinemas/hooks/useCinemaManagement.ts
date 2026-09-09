import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createRoom,
  getCinemas,
  getRoomsByCinema,
  updateCinema,
  updateRoom,
} from '@/src/api/cinemas';
import { useAppNotification } from '@/src/components/AppNotification';
import type { Cinema, Room } from '@/src/types';

import {
  defaultRoomForm,
  toCinemaForm,
  toCreateRoomRequest,
  toRoomForm,
  toUpdateCinemaRequest,
  toUpdateRoomRequest,
  validateRoomForm,
  type RoomFormState,
} from '../utils';

export function useCinemaManagement() {
  const { showNotification } = useAppNotification();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormState>(defaultRoomForm);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingCinema, setSavingCinema] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [error, setError] = useState('');
  const selectedCinemaIdRef = useRef<string | null>(null);

  const selectedCinema = useMemo(
    () => cinemas.find((cinema) => cinema.id === selectedCinemaId) ?? null,
    [cinemas, selectedCinemaId],
  );

  const loadRooms = useCallback(async (cinemaId: string) => {
    setLoadingRooms(true);

    try {
      setRooms(await getRoomsByCinema(cinemaId));
    } catch (loadError) {
      console.error(loadError);
      setRooms([]);
      showNotification('Cannot load rooms right now.', { tone: 'error' });
    } finally {
      setLoadingRooms(false);
    }
  }, [showNotification]);

  const selectCinema = useCallback((cinemaId: string | null) => {
    selectedCinemaIdRef.current = cinemaId;
    setSelectedCinemaId(cinemaId);
    setEditingRoom(null);
    setRoomForm(defaultRoomForm);

    if (cinemaId) {
      void loadRooms(cinemaId);
    } else {
      setRooms([]);
    }
  }, [loadRooms]);

  const loadCinemas = useCallback(async (
    showSpinner = true,
    preferredCinemaId?: string | null,
  ) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getCinemas();
      setCinemas(result);
      const nextCinemaId =
        preferredCinemaId && result.some((cinema) => cinema.id === preferredCinemaId)
          ? preferredCinemaId
          : selectedCinemaIdRef.current &&
              result.some((cinema) => cinema.id === selectedCinemaIdRef.current)
            ? selectedCinemaIdRef.current
            : result[0]?.id ?? null;

      selectCinema(nextCinemaId);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load cinemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectCinema]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadCinemas();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadCinemas]);

  function startEditRoom(room: Room) {
    setEditingRoom(room);
    setRoomForm(toRoomForm(room));
  }

  function resetRoomForm() {
    setEditingRoom(null);
    setRoomForm(defaultRoomForm);
  }

  async function toggleCinema(cinema: Cinema) {
    if (savingCinema) {
      return;
    }

    setSavingCinema(true);
    setError('');

    try {
      await updateCinema(cinema.id, {
        ...toUpdateCinemaRequest(toCinemaForm(cinema)),
        isActive: !cinema.isActive,
      });
      showNotification(cinema.isActive ? 'Cinema deactivated.' : 'Cinema restored.', {
        tone: 'success',
      });
      await loadCinemas(false);
    } catch (saveError) {
      console.error(saveError);
      showNotification('Cannot update cinema right now.', { tone: 'error' });
    } finally {
      setSavingCinema(false);
    }
  }

  async function saveRoom() {
    if (!selectedCinemaId || savingRoom) {
      return;
    }

    const validationError = validateRoomForm(roomForm);

    if (validationError) {
      setError(validationError);
      showNotification(validationError, { tone: 'error' });
      return;
    }

    setSavingRoom(true);
    setError('');

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, toUpdateRoomRequest(roomForm));
        showNotification('Room updated.', { tone: 'success' });
      } else {
        await createRoom(selectedCinemaId, toCreateRoomRequest(roomForm));
        showNotification('Room created.', { tone: 'success' });
      }

      resetRoomForm();
      await loadRooms(selectedCinemaId);
    } catch (saveError) {
      console.error(saveError);
      showNotification('Cannot save room right now.', { tone: 'error' });
    } finally {
      setSavingRoom(false);
    }
  }

  async function toggleRoom(room: Room) {
    if (savingRoom) {
      return;
    }

    setSavingRoom(true);
    setError('');

    try {
      await updateRoom(room.id, {
        ...toUpdateRoomRequest(toRoomForm(room)),
        isActive: !room.isActive,
      });
      showNotification(room.isActive ? 'Room deactivated.' : 'Room restored.', {
        tone: 'success',
      });

      if (selectedCinemaId) {
        await loadRooms(selectedCinemaId);
      }
    } catch (saveError) {
      console.error(saveError);
      showNotification('Cannot update room right now.', { tone: 'error' });
    } finally {
      setSavingRoom(false);
    }
  }

  return {
    cinemas,
    editingRoom,
    error,
    loading,
    loadingRooms,
    refresh: () => {
      setRefreshing(true);
      void loadCinemas(false);
    },
    refreshing,
    resetRoomForm,
    roomForm,
    rooms,
    saveRoom,
    savingCinema,
    savingRoom,
    selectedCinema,
    selectedCinemaId,
    setRoomForm,
    setSelectedCinemaId: selectCinema,
    startEditRoom,
    toggleCinema,
    toggleRoom,
  };
}

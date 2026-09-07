import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { makeUserStaff } from '@/src/api/admin-users';
import { ApiError } from '@/src/api/client';
import { assignStaffToCinema, getCinemas } from '@/src/api/cinemas';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { formatCinemaName } from '@/src/display';
import { styles } from '@/src/styles/screens/staff-manage.styles';
import type { Cinema } from '@/src/types';

export default function StaffManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const trimmedUserId = userId.trim();
  const busy = savingRole || savingAssignment;

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    let cancelled = false;

    async function loadCinemas() {
      setLoading(true);
      setError('');

      try {
        const result = await getCinemas();

        if (!cancelled) {
          setCinemas(result);
          setSelectedCinemaId((current) =>
            current && result.some((cinema) => cinema.id === current)
              ? current
              : result[0]?.id ?? null,
          );
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError('Cannot load cinemas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCinemas();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin]);

  async function handleMakeStaff() {
    if (!trimmedUserId || busy) {
      return;
    }

    setSavingRole(true);
    setError('');

    try {
      await makeUserStaff(trimmedUserId);
      showNotification('User is now staff.', { tone: 'success' });
    } catch (roleError) {
      console.error(roleError);
      const message = getFriendlyError(roleError, 'Cannot make user staff.');
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSavingRole(false);
    }
  }

  async function handleAssignStaff() {
    if (!trimmedUserId || !selectedCinemaId || busy) {
      return;
    }

    setSavingAssignment(true);
    setError('');

    try {
      await assignStaffToCinema(selectedCinemaId, trimmedUserId);
      showNotification('Staff assigned to cinema.', { tone: 'success' });
      setUserId('');
    } catch (assignmentError) {
      console.error(assignmentError);
      const message = getFriendlyError(assignmentError, 'Cannot assign staff.');
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSavingAssignment(false);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/more" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedPressable contentStyle={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <FadeInView>
          <Text style={styles.kicker}>Admin</Text>
          <Text style={styles.title}>Manage Staff</Text>
          <Text style={styles.subtitle}>Grant staff role, then assign that staff user to a cinema.</Text>
        </FadeInView>

        <View style={styles.group}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            autoCapitalize="none"
            editable={!busy}
            onChangeText={setUserId}
            placeholder="Paste user GUID"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={userId}
          />

          <AnimatedPressable
            contentStyle={[styles.primaryButton, (!trimmedUserId || busy) && styles.buttonDisabled]}
            disabled={!trimmedUserId || busy}
            onPress={handleMakeStaff}>
            {savingRole ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Make Staff</Text>
            )}
          </AnimatedPressable>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Cinema</Text>
          {cinemas.length === 0 ? (
            <Text style={styles.emptyText}>No cinemas available.</Text>
          ) : (
            <View style={styles.cinemaList}>
              {cinemas.map((cinema) => {
                const selected = cinema.id === selectedCinemaId;

                return (
                  <Pressable
                    disabled={busy}
                    key={cinema.id}
                    onPress={() => setSelectedCinemaId(cinema.id)}
                    style={[
                      styles.cinemaRow,
                      selected && styles.cinemaRowSelected,
                    ]}>
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.cinemaText}>
                      <Text numberOfLines={1} style={styles.cinemaName}>
                        {formatCinemaName(cinema.name)}
                      </Text>
                      <Text numberOfLines={1} style={styles.cinemaMeta}>
                        {cinema.provinceName ?? cinema.city}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <AnimatedPressable
            contentStyle={[styles.secondaryButton, (!trimmedUserId || !selectedCinemaId || busy) && styles.buttonDisabled]}
            disabled={!trimmedUserId || !selectedCinemaId || busy}
            onPress={handleAssignStaff}>
            {savingAssignment ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.secondaryButtonText}>Assign to Cinema</Text>
            )}
          </AnimatedPressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function getFriendlyError(error: unknown, fallback: string) {
  return error instanceof ApiError
    ? error.message
    : fallback;
}

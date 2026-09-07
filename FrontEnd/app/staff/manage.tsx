import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getAdminUsers,
  makeUserStaff,
} from '@/src/api/admin-users';
import { ApiError } from '@/src/api/client';
import { assignStaffToCinema, getCinemas } from '@/src/api/cinemas';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { formatCinemaName } from '@/src/display';
import { styles } from '@/src/styles/screens/staff-manage.styles';
import type { AdminUser, Cinema } from '@/src/types';

const allCitiesValue = '__all__';

export default function StaffManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(allCitiesValue);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const busy = savingUserId !== null;

  const cinemasById = useMemo(
    () => new Map(cinemas.map((cinema) => [cinema.id, cinema])),
    [cinemas],
  );

  const cities = useMemo(() => {
    const cityNames = cinemas
      .map(getCinemaCity)
      .filter((city, index, values) => values.indexOf(city) === index)
      .sort((left, right) => left.localeCompare(right));

    return [allCitiesValue, ...cityNames];
  }, [cinemas]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((item) => {
      const assignedCinemas = item.assignedCinemaIds
        .map((cinemaId) => cinemasById.get(cinemaId))
        .filter((cinema): cinema is Cinema => cinema !== undefined);
      const matchesQuery =
        !normalizedQuery ||
        item.email.toLowerCase().includes(normalizedQuery) ||
        (item.userName?.toLowerCase().includes(normalizedQuery) ?? false);
      const matchesCity =
        selectedCity === allCitiesValue ||
        assignedCinemas.some((cinema) => getCinemaCity(cinema) === selectedCity);

      return matchesQuery && matchesCity;
    });
  }, [cinemasById, query, selectedCity, users]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      void loadData();
    }
  }, [isAuthenticated, isAdmin]);

  async function loadData(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const [userResult, cinemaResult] = await Promise.all([
        getAdminUsers(),
        getCinemas(),
      ]);

      setUsers(userResult);
      setCinemas(cinemaResult);
      setSelectedCinemaId((current) =>
        current && cinemaResult.some((cinema) => cinema.id === current)
          ? current
          : cinemaResult[0]?.id ?? null,
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load staff data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleMakeStaff(adminUser: AdminUser) {
    if (busy || adminUser.roles.includes('Staff')) {
      return;
    }

    setSavingUserId(adminUser.id);
    setError('');

    try {
      await makeUserStaff(adminUser.id);
      showNotification('User is now staff.', { tone: 'success' });
      await loadData(false);
    } catch (roleError) {
      console.error(roleError);
      const message = getFriendlyError(roleError, 'Cannot make user staff.');
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleAssignStaff(adminUser: AdminUser) {
    if (!selectedCinemaId || busy) {
      return;
    }

    if (!adminUser.roles.includes('Staff')) {
      showNotification('Make this user staff before assigning a cinema.', {
        tone: 'error',
      });
      return;
    }

    setSavingUserId(adminUser.id);
    setError('');

    try {
      await assignStaffToCinema(selectedCinemaId, adminUser.id);
      showNotification('Staff assigned to cinema.', { tone: 'success' });
      await loadData(false);
    } catch (assignmentError) {
      console.error(assignmentError);
      const message = getFriendlyError(assignmentError, 'Cannot assign staff.');
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSavingUserId(null);
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshing(true);
              void loadData(false);
            }}
            refreshing={refreshing}
          />
        }>
        <AnimatedPressable contentStyle={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <FadeInView>
          <Text style={styles.kicker}>Admin</Text>
          <Text style={styles.title}>Manage Staff</Text>
          <Text style={styles.subtitle}>
            Search users, grant staff role, and assign staff to a cinema.
          </Text>
        </FadeInView>

        <View style={styles.group}>
          <Text style={styles.label}>Search</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder="Email or user name"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={query}
          />

          <Text style={styles.filterLabel}>City</Text>
          <ScrollView
            contentContainerStyle={styles.chipRail}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {cities.map((city) => {
              const selected = city === selectedCity;

              return (
                <Pressable
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={[
                    styles.filterChip,
                    selected && styles.filterChipSelected,
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.filterChipText,
                      selected && styles.filterChipTextSelected,
                    ]}>
                    {city === allCitiesValue ? 'All cities' : city}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Assign cinema</Text>
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
                        {getCinemaCity(cinema)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Users</Text>
          <Text style={styles.listCount}>{filteredUsers.length}</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>Adjust search or city filter.</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {filteredUsers.map((adminUser) => (
              <UserCard
                assignedCinemas={adminUser.assignedCinemaIds
                  .map((cinemaId) => cinemasById.get(cinemaId))
                  .filter((cinema): cinema is Cinema => cinema !== undefined)}
                busy={busy}
                key={adminUser.id}
                loading={savingUserId === adminUser.id}
                onAssign={() => void handleAssignStaff(adminUser)}
                onMakeStaff={() => void handleMakeStaff(adminUser)}
                selectedCinemaId={selectedCinemaId}
                user={adminUser}
              />
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function UserCard({
  assignedCinemas,
  busy,
  loading,
  onAssign,
  onMakeStaff,
  selectedCinemaId,
  user,
}: {
  assignedCinemas: Cinema[];
  busy: boolean;
  loading: boolean;
  onAssign: () => void;
  onMakeStaff: () => void;
  selectedCinemaId: string | null;
  user: AdminUser;
}) {
  const isStaff = user.roles.includes('Staff');
  const alreadyAssigned =
    Boolean(selectedCinemaId) &&
    user.assignedCinemaIds.includes(selectedCinemaId!);

  return (
    <View style={styles.userCard}>
      <View style={styles.userTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.email || user.userName || 'U')}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName}>
            {user.userName || user.email}
          </Text>
          <Text numberOfLines={1} style={styles.userEmail}>
            {user.email}
          </Text>
        </View>
        <Text style={[styles.roleBadge, isStaff && styles.roleBadgeStaff]}>
          {isStaff ? 'Staff' : 'User'}
        </Text>
      </View>

      <View style={styles.assignedList}>
        {assignedCinemas.length === 0 ? (
          <Text style={styles.assignedEmpty}>No cinema assigned</Text>
        ) : (
          assignedCinemas.map((cinema) => (
            <Text key={cinema.id} numberOfLines={1} style={styles.assignedChip}>
              {formatCinemaName(cinema.name)} | {getCinemaCity(cinema)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.userActions}>
        {!isStaff ? (
          <AnimatedPressable
            contentStyle={[styles.primaryButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={onMakeStaff}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Make Staff</Text>
            )}
          </AnimatedPressable>
        ) : null}
        <AnimatedPressable
          contentStyle={[
            styles.secondaryButton,
            (!isStaff || alreadyAssigned || busy) && styles.buttonDisabled,
          ]}
          disabled={!isStaff || alreadyAssigned || busy}
          onPress={onAssign}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {alreadyAssigned ? 'Assigned' : 'Assign Cinema'}
            </Text>
          )}
        </AnimatedPressable>
      </View>
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

function getCinemaCity(cinema: Cinema) {
  return cinema.provinceName || cinema.city || 'Unknown city';
}

function getInitials(value: string) {
  return value
    .split(/[@\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

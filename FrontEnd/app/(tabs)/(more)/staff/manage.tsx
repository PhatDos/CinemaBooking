import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
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
import { useAppNotification } from '@/src/components/AppNotification';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { formatCinemaName } from '@/src/display';
import { styles } from '@/src/styles/screens/staff-manage.styles';
import { useThemeMode } from '@/src/theme';
import type { AdminUser, Cinema } from '@/src/types';

const allCitiesValue = '__all__';

export default function StaffManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const dark = useThemeMode() === 'dark';
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
    <View style={[styles.container, dark && styles.containerDark]}>
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
        <ScreenHeader
          backHref="/more"
          title="Manage Staff"
        />

        <View style={[styles.group, dark && styles.groupDark]}>
          <Text style={[styles.label, dark && styles.textDark]}>Search</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder="Email or user name"
            placeholderTextColor={dark ? '#6e7683' : '#98a2b3'}
            style={[styles.input, dark && styles.inputDark]}
            value={query}
          />

          <Text style={[styles.filterLabel, dark && styles.textDark]}>City</Text>
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
                    dark && styles.filterChipDark,
                    selected && styles.filterChipSelected,
                    selected && dark && styles.filterChipSelectedDark,
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.filterChipText,
                      dark && styles.mutedTextDark,
                      selected && !dark && styles.filterChipTextSelected,
                      selected && dark && styles.filterChipTextSelectedDark,
                    ]}>
                    {city === allCitiesValue ? 'All cities' : city}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.group, dark && styles.groupDark]}>
          <Text style={[styles.label, dark && styles.textDark]}>Assign cinema</Text>
          {cinemas.length === 0 ? (
            <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>No cinemas available.</Text>
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
                      dark && styles.cinemaRowDark,
                      selected && styles.cinemaRowSelected,
                      selected && dark && styles.cinemaRowSelectedDark,
                    ]}>
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <CinemaRowImage cinema={cinema} />
                    <View style={styles.cinemaText}>
                      <Text numberOfLines={1} style={[styles.cinemaName, dark && styles.textDark]}>
                        {formatCinemaName(cinema.name)}
                      </Text>
                      <Text numberOfLines={1} style={[styles.cinemaMeta, dark && styles.mutedTextDark]}>
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
          <Text style={[styles.listTitle, dark && styles.textDark]}>Users</Text>
          <Text style={[styles.listCount, dark && styles.mutedTextDark]}>{filteredUsers.length}</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={[styles.emptyPanel, dark && styles.emptyPanelDark]}>
            <Text style={[styles.emptyTitle, dark && styles.textDark]}>No users found</Text>
            <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>
              Adjust search or city filter.
            </Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {filteredUsers.map((adminUser) => (
              <UserCard
                assignedCinemas={adminUser.assignedCinemaIds
                  .map((cinemaId) => cinemasById.get(cinemaId))
                  .filter((cinema): cinema is Cinema => cinema !== undefined)}
                busy={busy}
                dark={dark}
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
    </View>
  );
}

function CinemaRowImage({ cinema }: { cinema: Cinema }) {
  const imageUrl = cinema.imageUrl?.trim();

  return (
    <View style={styles.cinemaImage}>
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={styles.cinemaImageMedia}
          transition={180}
        />
      ) : (
        <Text style={styles.cinemaImageText}>
          {formatCinemaName(cinema.name)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('')}
        </Text>
      )}
    </View>
  );
}

function UserCard({
  assignedCinemas,
  busy,
  dark,
  loading,
  onAssign,
  onMakeStaff,
  selectedCinemaId,
  user,
}: {
  assignedCinemas: Cinema[];
  busy: boolean;
  dark: boolean;
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
    <View style={[styles.userCard, dark && styles.userCardDark]}>
      <View style={styles.userTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.email || user.userName || 'U')}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={[styles.userName, dark && styles.textDark]}>
            {user.userName || user.email}
          </Text>
          <Text numberOfLines={1} style={[styles.userEmail, dark && styles.mutedTextDark]}>
            {user.email}
          </Text>
        </View>
        <Text style={[styles.roleBadge, isStaff && styles.roleBadgeStaff]}>
          {isStaff ? 'Staff' : 'User'}
        </Text>
      </View>

      <View style={styles.assignedList}>
        {assignedCinemas.length === 0 ? (
          <Text style={[styles.assignedEmpty, dark && styles.mutedTextDark]}>No cinema assigned</Text>
        ) : (
          assignedCinemas.map((cinema) => (
            <Text
              key={cinema.id}
              numberOfLines={1}
              style={[styles.assignedChip, dark && styles.assignedChipDark]}>
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
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.containerDark]}>
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


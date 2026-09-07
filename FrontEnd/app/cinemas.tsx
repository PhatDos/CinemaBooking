import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCinemas } from '@/src/api/cinemas';
import { getProvinces, getWards } from '@/src/api/locations';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName } from '@/src/display';
import { styles } from '@/src/styles/screens/cinemas.styles';
import type { Cinema, LocationItem } from '@/src/types';

export default function CinemasScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState('');

  const selectedProvince = useMemo(
    () => provinces.find((province) => province.code === selectedProvinceCode) ?? null,
    [provinces, selectedProvinceCode],
  );

  async function loadCinemasForFilters(
    provinceCode = selectedProvinceCode,
    wardCode = selectedWardCode,
    showSpinner = true,
  ) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getCinemas({
        provinceCode,
        wardCode,
      });
      setCinemas(result);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load cinemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadInitialData() {
    setLoading(true);
    setError('');

    try {
      const [provinceResult, cinemaResult] = await Promise.all([
        getProvinces(),
        getCinemas(),
      ]);

      setProvinces(provinceResult);
      setCinemas(cinemaResult);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load cinemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleSelectProvince(provinceCode: string | null) {
    setSelectedProvinceCode(provinceCode);
    setSelectedWardCode(null);
    setWards([]);

    if (!provinceCode) {
      await loadCinemasForFilters(null, null);
      return;
    }

    setLoadingWards(true);

    try {
      const [wardResult] = await Promise.all([
        getWards(provinceCode),
        loadCinemasForFilters(provinceCode, null),
      ]);

      setWards(wardResult);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load location filter');
    } finally {
      setLoadingWards(false);
    }
  }

  async function handleSelectWard(wardCode: string | null) {
    setSelectedWardCode(wardCode);
    await loadCinemasForFilters(selectedProvinceCode, wardCode);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadInitialData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Theaters</Text>
          <Text style={styles.heading}>Cinemas</Text>
          <Text style={styles.subtitle}>
            {selectedProvince ? selectedProvince.name : user?.email}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <AnimatedPressable contentStyle={styles.primaryButton} onPress={() => loadInitialData()}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <>
          <View style={styles.filters}>
            <Text style={styles.filterLabel}>Province</Text>
            <ScrollView
              contentContainerStyle={styles.filterRail}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <FilterChip
                label="All"
                selected={!selectedProvinceCode}
                onPress={() => void handleSelectProvince(null)}
              />
              {provinces.map((province) => (
                <FilterChip
                  key={province.code}
                  label={province.name}
                  selected={province.code === selectedProvinceCode}
                  onPress={() => void handleSelectProvince(province.code)}
                />
              ))}
            </ScrollView>

            {selectedProvinceCode ? (
              <>
                <Text style={styles.filterLabel}>Ward</Text>
                {loadingWards ? (
                  <View style={styles.inlineLoader}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.inlineLoaderText}>Loading wards</Text>
                  </View>
                ) : (
                  <ScrollView
                    contentContainerStyle={styles.filterRail}
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    <FilterChip
                      label="All wards"
                      selected={!selectedWardCode}
                      onPress={() => void handleSelectWard(null)}
                    />
                    {wards.map((ward) => (
                      <FilterChip
                        key={ward.code}
                        label={ward.name}
                        selected={ward.code === selectedWardCode}
                        onPress={() => void handleSelectWard(ward.code)}
                      />
                    ))}
                  </ScrollView>
                )}
              </>
            ) : null}
          </View>

          <FlatList
            contentContainerStyle={cinemas.length === 0 ? styles.emptyList : styles.list}
            data={cinemas}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No cinemas found</Text>
                <Text style={styles.emptyText}>Try another province or ward.</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                onRefresh={() => {
                  setRefreshing(true);
                  void loadCinemasForFilters(selectedProvinceCode, selectedWardCode, false);
                }}
                refreshing={refreshing}
              />
            }
            renderItem={({ item, index }) => (
              <FadeInView delay={index * 45}>
                <AnimatedPressable
                  contentStyle={styles.card}
                  onPress={() =>
                    router.push(`/cinemas/${item.id}` as Href)
                  }>
                  {item.imageUrl ? (
                    <View style={styles.thumbnail}>
                      <Image
                        contentFit="cover"
                        source={{ uri: item.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        transition={220}
                      />
                    </View>
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(formatCinemaName(item.name))}</Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text numberOfLines={2} style={styles.title}>
                        {formatCinemaName(item.name)}
                      </Text>
                      <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.meta}>{item.provinceName ?? item.city}</Text>
                    {item.wardName ? <Text style={styles.ward}>{item.wardName}</Text> : null}
                    <Text numberOfLines={2} style={styles.address}>
                      {item.addressLine ?? item.address}
                    </Text>
                    {item.description ? (
                      <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.detail}>View upcoming showtimes</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            )}
          />
        </>
      )}

      <BottomNav />
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      contentStyle={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
      pressedScale={0.97}>
      <Text
        numberOfLines={1}
        style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

import {
  Redirect } from 'expo-router';
import { useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { getCinemas } from '@/src/api/cinemas';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName } from '@/src/display';
import type { Cinema } from '@/src/types';
import { styles } from '@/src/styles/screens/cinemas.styles';

export default function CinemasScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadCinemas(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getCinemas();
      setCinemas(result);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load cinemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadCinemas();
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
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <AnimatedPressable contentStyle={styles.primaryButton} onPress={() => loadCinemas()}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={cinemas.length === 0 ? styles.emptyList : styles.list}
          data={cinemas}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No cinemas yet</Text>
              <Text style={styles.emptyText}>Admin-created cinemas will appear here.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadCinemas(false);
              }}
              refreshing={refreshing}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 45}>
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(formatCinemaName(item.name))}</Text>
                </View>

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

                  <Text style={styles.meta}>{item.city}</Text>
                  <Text numberOfLines={2} style={styles.address}>{item.address}</Text>
                  {item.description ? (
                    <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            </FadeInView>
          )}
        />
      )}

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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

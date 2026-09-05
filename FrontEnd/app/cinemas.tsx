import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCinemas } from '@/src/api/cinemas';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav, bottomNavHeight } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName } from '@/src/display';
import { colors, radius, shadow } from '@/src/theme';
import type { Cinema } from '@/src/types';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
  },
  list: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: bottomNavHeight + 24,
    gap: 14,
  },
  emptyList: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: bottomNavHeight + 24,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.card,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  badgeTextActive: {
    color: colors.success,
  },
  badgeTextInactive: {
    color: colors.muted,
  },
  meta: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  address: {
    marginTop: 5,
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
});

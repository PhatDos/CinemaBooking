import { Image } from 'expo-image';
import { Redirect, router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCinema, getCinemaShowtimeHistory } from '@/src/api/cinemas';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName, formatCurrency, formatDateTime, formatRoomName } from '@/src/display';
import { styles } from '@/src/styles/screens/cinema-detail.styles';
import type { Cinema, CinemaShowtime } from '@/src/types';

export default function CinemaHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [showtimes, setShowtimes] = useState<CinemaShowtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canViewHistory =
    user?.roles.some((role) => role === 'Admin' || role === 'Staff') ?? false;

  useEffect(() => {
    if (!id || !isAuthenticated || !canViewHistory) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [cinemaResult, historyResult] = await Promise.all([
          getCinema(id),
          getCinemaShowtimeHistory(id),
        ]);

        if (!cancelled) {
          setCinema(cinemaResult);
          setShowtimes(historyResult);
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError('Cannot load showtime history');
        }
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
  }, [canViewHistory, id, isAuthenticated]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!canViewHistory) {
    return (
      <Redirect href={`/cinemas/${id}` as Href} />
    );
  }

  if (loading) {
    return <CenteredLoader />;
  }

  if (error || !cinema) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Cinema not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topActions}>
          <AnimatedPressable contentStyle={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Back</Text>
          </AnimatedPressable>
        </View>

        <FadeInView>
          <Text style={styles.kicker}>Operations log</Text>
          <Text style={styles.title}>{formatCinemaName(cinema.name)}</Text>
          <Text style={styles.subtitle}>Past 30 days of showtimes</Text>
        </FadeInView>

        {showtimes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>Past showtimes for this cinema will appear here.</Text>
          </View>
        ) : (
          showtimes.map((showtime, index) => (
            <FadeInView delay={index * 35 + 70} key={showtime.showtimeId}>
              <View style={styles.historyCard}>
                <View style={styles.posterSmall}>
                  {showtime.posterUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: showtime.posterUrl }}
                      style={StyleSheet.absoluteFill}
                      transition={180}
                    />
                  ) : (
                    <Text style={styles.posterSmallText}>{getInitials(showtime.movieTitle)}</Text>
                  )}
                </View>
                <View style={styles.showtimeBody}>
                  <Text numberOfLines={2} style={styles.movieTitle}>
                    {showtime.movieTitle}
                  </Text>
                  <Text style={styles.meta}>{formatDateTime(showtime.startTime)}</Text>
                  <Text style={styles.meta}>{formatRoomName(showtime.roomName)}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>{formatCurrency(showtime.basePrice)}</Text>
                    <Text style={styles.historyLabel}>Past</Text>
                  </View>
                </View>
              </View>
            </FadeInView>
          ))
        )}
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

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

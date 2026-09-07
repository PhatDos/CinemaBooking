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

import {
  getCinema,
  getCinemaShowtimes,
} from '@/src/api/cinemas';
import { getCurrentStaffCinemaAssignment } from '@/src/api/staff';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName, formatCurrency, formatDateTime, formatRoomName } from '@/src/display';
import { styles } from '@/src/styles/screens/cinema-detail.styles';
import type { Cinema, CinemaShowtime } from '@/src/types';

export default function CinemaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [showtimes, setShowtimes] = useState<CinemaShowtime[]>([]);
  const [isAssignedStaff, setIsAssignedStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isStaff = user?.roles.includes('Staff') ?? false;
  const canViewHistory = isAdmin || isAssignedStaff;

  useEffect(() => {
    if (!id || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [cinemaResult, showtimeResult] = await Promise.all([
          getCinema(id),
          getCinemaShowtimes(id),
        ]);
        const assignmentResult = !isAdmin && isStaff
          ? await getCurrentStaffCinemaAssignment(id)
          : null;

        if (!cancelled) {
          setCinema(cinemaResult);
          setShowtimes(showtimeResult);
          setIsAssignedStaff(assignmentResult?.isAssigned ?? false);
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError('Cannot load cinema');
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
  }, [id, isAdmin, isStaff, isAuthenticated]);

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
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

          {canViewHistory ? (
            <AnimatedPressable
              contentStyle={styles.historyButton}
              onPress={() =>
                router.push(`/cinemas/${id}/history` as Href)
              }>
              <Text style={styles.historyButtonText}>History</Text>
            </AnimatedPressable>
          ) : null}
        </View>

        <FadeInView>
          {cinema.imageUrl ? (
            <View style={styles.heroImage}>
              <Image
                contentFit="cover"
                source={{ uri: cinema.imageUrl }}
                style={StyleSheet.absoluteFill}
                transition={240}
              />
            </View>
          ) : null}
          <Text style={styles.kicker}>Cinema</Text>
          <Text style={styles.title}>{formatCinemaName(cinema.name)}</Text>
          <Text style={styles.subtitle}>
            {cinema.provinceName ?? cinema.city}
            {cinema.wardName ? ` | ${cinema.wardName}` : ''}
          </Text>
          <Text style={styles.address}>{cinema.addressLine ?? cinema.address}</Text>
          {cinema.description ? <Text style={styles.description}>{cinema.description}</Text> : null}
        </FadeInView>

        <Text style={styles.sectionTitle}>Upcoming showtimes</Text>

        {showtimes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No upcoming showtimes</Text>
            <Text style={styles.emptyText}>Try another cinema or check again later.</Text>
          </View>
        ) : (
          showtimes.map((showtime, index) => (
            <FadeInView delay={index * 45 + 80} key={showtime.showtimeId}>
              <ShowtimeCard showtime={showtime} />
            </FadeInView>
          ))
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function ShowtimeCard({ showtime }: { showtime: CinemaShowtime }) {
  return (
    <AnimatedPressable
      contentStyle={styles.showtimeCard}
      onPress={() =>
        router.push({
          pathname: '/seats/[showtimeId]',
          params: { showtimeId: showtime.showtimeId },
        })
      }>
      <View style={styles.poster}>
        {showtime.posterUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: showtime.posterUrl }}
            style={StyleSheet.absoluteFill}
            transition={220}
          />
        ) : (
          <Text style={styles.posterText}>{getInitials(showtime.movieTitle)}</Text>
        )}
      </View>

      <View style={styles.showtimeBody}>
        <Text numberOfLines={2} style={styles.movieTitle}>
          {showtime.movieTitle}
        </Text>
        <Text style={styles.meta}>{formatDateTime(showtime.startTime)}</Text>
        <Text style={styles.meta}>{formatRoomName(showtime.roomName)}</Text>
        {showtime.genre ? <Text style={styles.genre}>{showtime.genre}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatCurrency(showtime.basePrice)}</Text>
          <Text style={styles.action}>Select seats</Text>
        </View>
      </View>
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

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

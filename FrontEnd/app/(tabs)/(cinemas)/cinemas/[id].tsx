import { Image } from 'expo-image';
import { Redirect, router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { FadeInView } from '@/src/components/FadeInView';
import { ShowtimeDateRail } from '@/src/features/showtimes/ShowtimeDateRail';
import {
  formatShowtimeTime,
  getDateRangeForQuery,
  getTodayDateValue,
} from '@/src/features/showtimes/date-filter';
import { formatCinemaName, formatCurrency, formatRoomName } from '@/src/display';
import { styles } from '@/src/styles/screens/cinema-detail.styles';
import { useThemeMode } from '@/src/theme';
import type { Cinema, CinemaShowtime } from '@/src/types';

type MovieShowtimeGroup = {
  genre: string | null;
  minPrice: number;
  movieId: string;
  movieTitle: string;
  posterUrl: string | null;
  rooms: RoomShowtimeGroup[];
};

type RoomShowtimeGroup = {
  roomId: string;
  roomName: string;
  showtimes: CinemaShowtime[];
};

export default function CinemaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const dark = useThemeMode() === 'dark';
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [showtimes, setShowtimes] = useState<CinemaShowtime[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [includePast, setIncludePast] = useState(false);
  const [isAssignedStaff, setIsAssignedStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isStaff = user?.roles.includes('Staff') ?? false;
  const canIncludePast = isAdmin || isStaff;
  const canViewHistory = isAdmin || isAssignedStaff;
  const movieGroups = useMemo(
    () => groupShowtimesByMovie(showtimes),
    [showtimes],
  );

  useEffect(() => {
    if (!id || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const cinemaResult = await getCinema(id);
        const assignmentResult = !isAdmin && isStaff
          ? await getCurrentStaffCinemaAssignment(id)
          : null;

        if (!cancelled) {
          setCinema(cinemaResult);
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

  useEffect(() => {
    if (!id || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadShowtimes() {
      setLoadingShowtimes(true);

      try {
        const range = getDateRangeForQuery(selectedDate);
        const showtimeResult = await getCinemaShowtimes(id, {
          ...range,
          includePast: canIncludePast && includePast,
        });

        if (!cancelled) {
          setShowtimes(showtimeResult);
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setShowtimes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingShowtimes(false);
        }
      }
    }

    void loadShowtimes();

    return () => {
      cancelled = true;
    };
  }, [
    canIncludePast,
    id,
    includePast,
    isAuthenticated,
    selectedDate,
  ]);

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (error || !cinema) {
    return (
      <View style={[styles.center, dark && styles.centerDark]}>
        <Text style={styles.error}>{error || 'Cinema not found'}</Text>
        <Pressable onPress={() => router.back()} style={[styles.backButton, dark && styles.backButtonDark]}>
          <Text style={[styles.backButtonText, dark && styles.textDark]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topActions}>
          <AnimatedPressable
            contentStyle={[styles.backLink, dark && styles.backLinkDark]}
            onPress={() => router.back()}>
            <Text style={[styles.backLinkText, dark && styles.textDark]}>Back</Text>
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
          <Text style={[styles.kicker, dark && styles.kickerDark]}>Cinema</Text>
          <Text style={[styles.title, dark && styles.textDark]}>{formatCinemaName(cinema.name)}</Text>
          <Text style={[styles.subtitle, dark && styles.mutedTextDark]}>
            {cinema.provinceName ?? cinema.city}
            {cinema.wardName ? ` | ${cinema.wardName}` : ''}
          </Text>
          <Text style={[styles.address, dark && styles.addressDark]}>{cinema.addressLine ?? cinema.address}</Text>
          {cinema.description ? (
            <Text style={[styles.description, dark && styles.mutedTextDark]}>
              {cinema.description}
            </Text>
          ) : null}
        </FadeInView>

        <ShowtimeDateRail
          canIncludePast={canIncludePast}
          includePast={includePast}
          onSelectDate={setSelectedDate}
          onToggleIncludePast={setIncludePast}
          selectedDate={selectedDate}
        />

        <Text style={[styles.sectionTitle, dark && styles.textDark]}>CHỌN PHIM - SUẤT CHIẾU</Text>

        {loadingShowtimes ? (
          <View style={styles.showtimeLoading}>
            <ActivityIndicator />
          </View>
        ) : movieGroups.length === 0 ? (
          <View style={[styles.empty, dark && styles.emptyDark]}>
            <Text style={[styles.emptyTitle, dark && styles.textDark]}>No upcoming showtimes</Text>
            <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>
              Choose another date or check again later.
            </Text>
          </View>
        ) : (
          movieGroups.map((group, index) => (
            <FadeInView delay={index * 45 + 80} key={group.movieId}>
              <MovieShowtimeCard dark={dark} group={group} />
            </FadeInView>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MovieShowtimeCard({ dark, group }: { dark: boolean; group: MovieShowtimeGroup }) {
  return (
    <View style={[styles.showtimeCard, dark && styles.showtimeCardDark]}>
      <View style={styles.poster}>
        {group.posterUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: group.posterUrl }}
            style={StyleSheet.absoluteFill}
            transition={220}
          />
        ) : (
          <Text style={styles.posterText}>{getInitials(group.movieTitle)}</Text>
        )}
      </View>

      <View style={styles.showtimeBody}>
        <Text numberOfLines={2} style={[styles.movieTitle, dark && styles.textDark]}>
          {group.movieTitle}
        </Text>
        {group.genre ? <Text style={styles.genre}>{group.genre}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.price, dark && styles.textDark]}>{formatCurrency(group.minPrice)}</Text>
        </View>

        {group.rooms.map((room) => (
          <View key={room.roomId} style={[styles.roomBlock, dark && styles.roomBlockDark]}>
            <Text style={[styles.meta, dark && styles.mutedTextDark]}>{formatRoomName(room.roomName)}</Text>
            <View style={styles.timeGrid}>
              {room.showtimes.map((showtime) => (
                <AnimatedPressable
                  contentStyle={[styles.timeChip, dark && styles.timeChipDark]}
                  key={showtime.showtimeId}
                  onPress={() =>
                    router.push({
                      pathname: '/seats/[showtimeId]',
                      params: { showtimeId: showtime.showtimeId },
                    })
                  }
                  pressedScale={0.96}>
                  <Text style={[styles.timeText, dark && styles.timeTextDark]}>
                    {formatShowtimeTime(showtime.startTime)}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CenteredLoader() {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.centerDark]}>
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

function groupShowtimesByMovie(
  showtimes: CinemaShowtime[],
): MovieShowtimeGroup[] {
  const movies = new Map<string, MovieShowtimeGroup>();

  showtimes.forEach((showtime) => {
    let movie = movies.get(showtime.movieId);

    if (!movie) {
      movie = {
        genre: showtime.genre,
        minPrice: showtime.standardPrice || showtime.basePrice,
        movieId: showtime.movieId,
        movieTitle: showtime.movieTitle,
        posterUrl: showtime.posterUrl,
        rooms: [],
      };
      movies.set(showtime.movieId, movie);
    }

    movie.minPrice = Math.min(
      movie.minPrice,
      showtime.standardPrice || showtime.basePrice,
    );

    let room = movie.rooms.find((item) => item.roomId === showtime.roomId);

    if (!room) {
      room = {
        roomId: showtime.roomId,
        roomName: showtime.roomName,
        showtimes: [],
      };
      movie.rooms.push(room);
    }

    room.showtimes.push(showtime);
  });

  return Array.from(movies.values())
    .map((movie) => ({
      ...movie,
      rooms: movie.rooms.map((room) => ({
        ...room,
        showtimes: [...room.showtimes].sort(
          (left, right) =>
            new Date(left.startTime).getTime() -
            new Date(right.startTime).getTime(),
        ),
      })),
    }))
    .sort((left, right) => left.movieTitle.localeCompare(right.movieTitle));
}


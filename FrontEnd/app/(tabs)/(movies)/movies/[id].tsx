import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCinema, getRoom } from '@/src/api/cinemas';
import { getMovieById, getMovieShowtimes } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { YouTubeEmbed } from '@/src/features/movies/components/YouTubeEmbed';
import { ShowtimeDateRail } from '@/src/features/showtimes/ShowtimeDateRail';
import {
  formatShowtimeTime,
  getDateRangeForQuery,
  getTodayDateValue,
} from '@/src/features/showtimes/date-filter';
import { formatCinemaName } from '@/src/display';
import { getYouTubeVideoId } from '@/src/media/youtube';
import { styles } from '@/src/styles/screens/movie-detail.styles';
import { useThemeMode } from '@/src/theme';
import type { MovieDetail, Showtime } from '@/src/types';

type ShowtimeVenue = {
  cinemaAddress: string;
  cinemaCity: string;
  cinemaId: string;
  cinemaImageUrl: string | null;
  cinemaName: string;
};

type CinemaShowtimeGroup = {
  address: string;
  city: string;
  cinemaId: string;
  imageUrl: string | null;
  minPrice: number;
  name: string;
  showtimes: Showtime[];
};

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const dark = useThemeMode() === 'dark';
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [venues, setVenues] = useState<Record<string, ShowtimeVenue>>({});
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [error, setError] = useState('');

  const canIncludePast =
    user?.roles.some((role) => role === 'Admin' || role === 'Staff') ?? false;

  const cinemaGroups = useMemo(
    () => groupShowtimesByCinema(showtimes, venues),
    [showtimes, venues],
  );
  const selectedCinemaGroup = selectedCinemaId
    ? cinemaGroups.find((group) => group.cinemaId === selectedCinemaId) ?? null
    : null;
  const visibleCinemaGroups = selectedCinemaGroup
    ? [selectedCinemaGroup]
    : cinemaGroups;

  const loadVenues = useCallback(async (items: Showtime[]) => {
    const uniqueRoomIds = Array.from(new Set(items.map((item) => item.roomId)));
    const entries = await Promise.all(
      uniqueRoomIds.map(async (roomId) => {
        try {
          const room = await getRoom(roomId);
          const cinema = await getCinema(room.cinemaId);

          return [
            roomId,
            {
              cinemaAddress: cinema.addressLine ?? cinema.address,
              cinemaCity: cinema.provinceName ?? cinema.city,
              cinemaId: cinema.id,
              cinemaImageUrl: cinema.imageUrl ?? null,
              cinemaName: formatCinemaName(cinema.name),
            },
          ] as const;
        } catch (venueError) {
          console.error(venueError);
          return null;
        }
      }),
    );

    setVenues(Object.fromEntries(entries.filter((entry) => entry !== null)));
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!id || !isAuthenticated) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        setMovie(await getMovieById(id));
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load movie');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id, isAuthenticated]);

  useEffect(() => {
    async function loadShowtimes() {
      if (!id || !isAuthenticated) {
        return;
      }

      setLoadingShowtimes(true);

      try {
        const range = getDateRangeForQuery(selectedDate);
        const showtimeResult = await getMovieShowtimes(id, {
          ...range,
          includePast: canIncludePast && includePast,
        });

        setShowtimes(showtimeResult);
        await loadVenues(showtimeResult);
      } catch (loadError) {
        console.error(loadError);
        setShowtimes([]);
      } finally {
        setLoadingShowtimes(false);
      }
    }

    void loadShowtimes();
  }, [
    canIncludePast,
    id,
    includePast,
    isAuthenticated,
    loadVenues,
    selectedDate,
  ]);

  if (isLoading || loading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (error || !movie) {
    return (
      <View style={[styles.center, dark && styles.centerDark]}>
        <Text style={styles.error}>{error || 'Movie not found'}</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, dark && styles.backButtonDark]}>
          <Text style={[styles.backButtonText, dark && styles.textDark]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const trailerVideoId = getYouTubeVideoId(movie.trailerUrl);

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {movie.posterUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: movie.posterUrl }}
              style={StyleSheet.absoluteFill}
              transition={300}
            />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.posterText}>{getInitials(movie.title)}</Text>
            </View>
          )}
          <View style={[styles.heroOverlay, dark && styles.heroOverlayDark]} />

          <AnimatedPressable
            contentStyle={styles.heroBackButton}
            onPress={() => router.back()}>
            <Text style={styles.heroBackText}>Back</Text>
          </AnimatedPressable>

          <View style={styles.heroCopy}>
            <Text numberOfLines={2} style={styles.heroTitle}>{movie.title}</Text>
            <Text numberOfLines={1} style={styles.heroMeta}>
              {getHeroMeta(movie)}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <ShowtimeDateRail
            canIncludePast={canIncludePast}
            includePast={includePast}
            onSelectDate={setSelectedDate}
            onToggleIncludePast={setIncludePast}
            selectedDate={selectedDate}
          />

          <View style={styles.showtimeSection}>
            <Text style={[styles.heading, dark && styles.textDark]}>CHỌN RẠP CHIẾU - SUẤT CHIẾU</Text>
            <Text style={[styles.sectionHint, dark && styles.mutedTextDark]}>
              Vui lòng chọn rạp - suất chiếu
            </Text>
          </View>

          {loadingShowtimes ? (
            <View style={styles.showtimeLoading}>
              <ActivityIndicator color={dark ? '#ffffff' : undefined} />
            </View>
          ) : cinemaGroups.length === 0 ? (
            <View style={[styles.emptyPanel, dark && styles.emptyPanelDark]}>
              <Text style={[styles.emptyTitle, dark && styles.textDark]}>No showtimes available</Text>
              <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>
                Choose another date or check again later.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.cinemaRail}
                horizontal
                showsHorizontalScrollIndicator={false}>
                {cinemaGroups.map((group) => {
                  const selected = group.cinemaId === selectedCinemaGroup?.cinemaId;

                  return (
                    <AnimatedPressable
                      contentStyle={[
                        styles.cinemaChip,
                        dark && styles.cinemaChipDark,
                        selected && styles.cinemaChipSelected,
                        selected && dark && styles.cinemaChipSelectedDark,
                      ]}
                      key={group.cinemaId}
                      onPress={() =>
                        setSelectedCinemaId((current) =>
                          current === group.cinemaId ? null : group.cinemaId,
                        )
                      }
                      pressedScale={0.95}>
                      {group.imageUrl ? (
                        <Image
                          contentFit="cover"
                          source={{ uri: group.imageUrl }}
                          style={[StyleSheet.absoluteFill, styles.cinemaChipImage]}
                          transition={160}
                        />
                      ) : (
                        <Text style={[styles.cinemaChipText, dark && styles.textDark]}>
                          {getInitials(group.name)}
                        </Text>
                      )}
                      <View style={styles.cinemaPriceBadge}>
                        <Text style={styles.cinemaPriceText}>
                          {formatShortCurrency(group.minPrice)}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>

              <View style={styles.cinemaList}>
                {visibleCinemaGroups.map((group, index) => (
                  <FadeInView delay={80 + index * 35} key={group.cinemaId}>
                    <View style={styles.cinemaSummary}>
                      <View style={[styles.cinemaMark, dark && styles.cinemaMarkDark]}>
                        {group.imageUrl ? (
                          <Image
                            contentFit="cover"
                            source={{ uri: group.imageUrl }}
                            style={styles.cinemaMarkImage}
                            transition={160}
                          />
                        ) : (
                          <Text style={[styles.cinemaMarkText, dark && styles.cinemaMarkTextDark]}>
                            {getInitials(group.name).slice(0, 1)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.cinemaInfo}>
                        <Text numberOfLines={1} style={[styles.cinemaName, dark && styles.textDark]}>
                          {group.name}
                        </Text>
                        <Text numberOfLines={1} style={[styles.cinemaAddress, dark && styles.mutedTextDark]}>
                          {group.address}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.timePanel, dark && styles.timePanelDark]}>
                      <Text style={[styles.roomFormat, dark && styles.textDark]}>2D - Phụ đề</Text>
                      <View style={styles.timeDivider}>
                        {Array.from({ length: 18 }).map((_, dashIndex) => (
                          <View
                            key={dashIndex}
                            style={[
                              styles.timeDividerDash,
                              dark && styles.timeDividerDashDark,
                            ]}
                          />
                        ))}
                      </View>
                      <View style={styles.timeGrid}>
                        {group.showtimes.map((showtime) => (
                          <AnimatedPressable
                            contentStyle={[styles.timeChip, dark && styles.timeChipDark]}
                            key={showtime.id}
                            onPress={() =>
                              router.push({
                                pathname: '/seats/[showtimeId]',
                                params: { showtimeId: showtime.id },
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
                  </FadeInView>
                ))}
              </View>
            </>
          )}

          {trailerVideoId ? (
            <View style={styles.trailerPanel}>
              <Text style={[styles.trailerTitle, dark && styles.textDark]}>Trailer</Text>
              <View style={styles.trailerPlayer}>
                <YouTubeEmbed
                  height={210}
                  play={false}
                  videoId={trailerVideoId}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function CenteredLoader() {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.centerDark]}>
      <ActivityIndicator color={dark ? '#ffffff' : undefined} size="large" />
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function getGenreLabel(movie: MovieDetail) {
  return movie.genres?.length
    ? movie.genres.map((genre) => genre.name).join(', ')
    : movie.genre ?? '';
}

function getHeroMeta(movie: MovieDetail) {
  return [
    getGenreLabel(movie),
    `${movie.durationMinutes} min`,
    `Release ${formatDate(movie.releaseDate)}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

function groupShowtimesByCinema(
  showtimes: Showtime[],
  venues: Record<string, ShowtimeVenue>,
): CinemaShowtimeGroup[] {
  const cinemas = new Map<string, CinemaShowtimeGroup>();

  showtimes.forEach((showtime) => {
    const venue = venues[showtime.roomId];

    if (!venue) {
      return;
    }

    let cinema = cinemas.get(venue.cinemaId);

    if (!cinema) {
      cinema = {
        address: venue.cinemaAddress,
        cinemaId: venue.cinemaId,
        city: venue.cinemaCity,
        imageUrl: venue.cinemaImageUrl,
        minPrice: showtime.standardPrice || showtime.basePrice,
        name: venue.cinemaName,
        showtimes: [],
      };
      cinemas.set(venue.cinemaId, cinema);
    }

    cinema.minPrice = Math.min(
      cinema.minPrice,
      showtime.standardPrice || showtime.basePrice,
    );
    cinema.showtimes.push(showtime);
  });

  return Array.from(cinemas.values())
    .map((cinema) => ({
      ...cinema,
      showtimes: [...cinema.showtimes].sort(
        (left, right) =>
          new Date(left.startTime).getTime() -
          new Date(right.startTime).getTime(),
      ),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function formatShortCurrency(value: number) {
  return `Từ ${Math.round(value / 1000)}K`;
}

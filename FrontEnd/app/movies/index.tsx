import { router, Redirect, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getGenres } from '@/src/api/genres';
import { getNowShowingMovies } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/components/LogoutButton';
import type { Genre, Movie } from '@/src/types';
import { styles } from '@/src/styles/screens/movies.styles';

const scanTicketRoute = '/staff/scan-ticket' as Href;
const manageMoviesRoute = '/movies/manage' as Href;

export default function MoviesScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filteredMovies = useMemo(() => {
    if (!selectedGenreId) {
      return movies;
    }

    const selectedGenre = genres.find((genre) => genre.id === selectedGenreId);

    return movies.filter((movie) =>
      movie.genres?.some((genre) => genre.id === selectedGenreId) ||
      movie.genreId === selectedGenreId ||
      (
        selectedGenre &&
        movie.genre?.toLowerCase() === selectedGenre.name.toLowerCase()
      ));
  }, [genres, movies, selectedGenreId]);

  async function loadMovies(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const [movieResult, genreResult] = await Promise.all([
        getNowShowingMovies(),
        getGenres(),
      ]);

      setMovies(movieResult);
      setGenres(genreResult);
      setSelectedGenreId((current) =>
        current && genreResult.some((genre) => genre.id === current)
          ? current
          : null,
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load movies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadMovies();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  const canCheckIn = user?.roles.some((role) => role === 'Staff' || role === 'Admin') ?? false;
  const canManageMovies = user?.roles.includes('Admin') ?? false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Cinema Booking</Text>
          <Text style={styles.heading}>Now Showing</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.actions}>
          {canManageMovies && (
            <AnimatedPressable
              contentStyle={styles.primaryActionButton}
              onPress={() => router.push(manageMoviesRoute)}>
              <Text style={styles.primaryActionText}>Manage Movies</Text>
            </AnimatedPressable>
          )}

          {canCheckIn && (
            <AnimatedPressable
              contentStyle={styles.primaryActionButton}
              onPress={() => router.push(scanTicketRoute)}>
              <Text style={styles.primaryActionText}>Scan Ticket</Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable
            contentStyle={styles.actionButton}
            onPress={() => router.push('/bookings')}>
            <Text style={styles.actionText}>My Bookings</Text>
          </AnimatedPressable>

          <LogoutButton style={styles.actionButton} textStyle={styles.actionText} />
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadMovies()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.filters}>
            <ScrollView
              contentContainerStyle={styles.filterRail}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <FilterChip
                label="All"
                selected={!selectedGenreId}
                onPress={() => setSelectedGenreId(null)}
              />
              {genres.map((genre) => (
                <FilterChip
                  key={genre.id}
                  label={genre.name}
                  selected={genre.id === selectedGenreId}
                  onPress={() => setSelectedGenreId(genre.id)}
                />
              ))}
            </ScrollView>
          </View>

          <FlatList
            contentContainerStyle={filteredMovies.length === 0 ? styles.emptyList : styles.list}
            data={filteredMovies}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No movies found</Text>
                <Text style={styles.emptyText}>Try another genre or check upcoming showtimes later.</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                onRefresh={() => {
                  setRefreshing(true);
                  loadMovies(false);
                }}
                refreshing={refreshing}
              />
            }
            renderItem={({ item, index }) => {
              return (
              <FadeInView delay={index * 45}>
                <AnimatedPressable
                  contentStyle={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/movies/[id]',
                      params: { id: item.id },
                    })
                  }>
                  <View style={styles.poster}>
                    {item.posterUrl ? (
                      <Image
                        contentFit="cover"
                        source={{ uri: item.posterUrl }}
                        style={StyleSheet.absoluteFill}
                        transition={250}
                      />
                    ) : (
                      <Text style={styles.posterText}>{getInitials(item.title)}</Text>
                    )}
                    {getGenreLabel(item) ? (
                      <View style={styles.posterBadge}>
                        <Text style={styles.posterBadgeText}>{getGenreLabel(item)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.info}>
                    <Text numberOfLines={2} style={styles.title}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>{item.durationMinutes} min</Text>
                      <Text style={styles.dot}>|</Text>
                      <Text style={styles.meta}>{formatDate(item.releaseDate)}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.description}>
                      {item.description || 'No description yet.'}
                    </Text>
                    <Text style={styles.detail}>View showtimes</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
              );
            }}
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

function getGenreLabel(movie: Movie) {
  return movie.genres?.length
    ? movie.genres.map((genre) => genre.name).join(', ')
    : movie.genre ?? '';
}

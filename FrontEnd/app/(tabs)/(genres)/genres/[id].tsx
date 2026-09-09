import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getGenres } from '@/src/api/genres';
import { getNowShowingMovies } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { goBackOrReplace } from '@/src/navigation';
import { styles } from '@/src/styles/screens/genres.styles';
import { colors, useThemeMode } from '@/src/theme';
import type { Genre, Movie } from '@/src/types';

export default function GenreMoviesScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const dark = useThemeMode() === 'dark';
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const selectedGenre = useMemo(
    () => genres.find((genre) => genre.id === id) ?? null,
    [genres, id],
  );
  const genreName = selectedGenre?.name ?? name ?? 'Genre';

  const filteredMovies = useMemo(() => {
    if (!id) {
      return [];
    }

    return movies.filter((movie) =>
      movie.genres?.some((genre) => genre.id === id) ||
      movie.genreId === id ||
      (
        selectedGenre &&
        movie.genre?.toLowerCase() === selectedGenre.name.toLowerCase()
      ));
  }, [id, movies, selectedGenre]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, id]);

  async function loadData(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      const [genreResult, movieResult] = await Promise.all([
        getGenres(),
        getNowShowingMovies(),
      ]);

      setGenres(genreResult);
      setMovies(movieResult);
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load movies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <View style={styles.resultHeader}>
        <View style={styles.resultTopRow}>
          <AnimatedPressable
            contentStyle={[styles.resultBackButton, dark && styles.resultBackButtonDark]}
            onPress={() => goBackOrReplace('/genres')}>
            <Ionicons color={dark ? '#ffffff' : colors.ink} name="chevron-back" size={24} />
          </AnimatedPressable>
          <Text numberOfLines={1} style={[styles.resultTopTitle, dark && styles.resultTopTitleDark]}>
            Genres
          </Text>
          <View style={styles.resultTopSpacer} />
        </View>

        <FadeInView>
          <View style={styles.resultHero}>
            {selectedGenre?.imageUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: selectedGenre.imageUrl }}
                style={StyleSheet.absoluteFill}
                transition={180}
              />
            ) : null}
            <View style={styles.resultHeroShade}>
              <Text style={styles.resultKicker}>Genre</Text>
              <Text numberOfLines={2} style={styles.resultHeading}>
                {genreName}
              </Text>
              <View style={styles.resultMetaRow}>
                <Text style={styles.resultSubtitle}>Now showing movies</Text>
                <View style={styles.resultCountPill}>
                  <Text style={styles.resultCountText}>
                    {filteredMovies.length} movies
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </FadeInView>
      </View>

      {error ? (
        <View style={[styles.center, dark && styles.centerDark]}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredMovies}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, dark && styles.emptyTitleDark]}>
                No movies in this genre
              </Text>
              <Text style={[styles.emptyText, dark && styles.emptyTextDark]}>
                Choose another genre or check upcoming showtimes later.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadData(false);
              }}
              refreshing={refreshing}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 45}>
              <AnimatedPressable
                contentStyle={[styles.movieCard, dark && styles.movieCardDark]}
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
                      transition={220}
                    />
                  ) : (
                    <Text style={styles.posterText}>{getInitials(item.title)}</Text>
                  )}
                </View>

                <View style={styles.movieInfo}>
                  <Text numberOfLines={2} style={[styles.movieTitle, dark && styles.movieTitleDark]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.movieMeta, dark && styles.movieMetaDark]}>
                    {item.durationMinutes} min | {formatDate(item.releaseDate)}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.movieDescription, dark && styles.movieDescriptionDark]}>
                    {item.description || 'No description yet.'}
                  </Text>
                  <Text style={[styles.movieAction, dark && styles.movieActionDark]}>
                    View showtimes
                  </Text>
                </View>
              </AnimatedPressable>
            </FadeInView>
          )}
        />
      )}
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


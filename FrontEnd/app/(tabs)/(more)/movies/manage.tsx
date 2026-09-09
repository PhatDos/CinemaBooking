import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getMovies, updateMovie } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { styles } from '@/src/styles/screens/movie-manage.styles';
import { useThemeMode } from '@/src/theme';
import type { Movie, UpdateMovieRequest } from '@/src/types';

const movieFormRoute = '/movies/form' as Href;
const genreManageRoute = '/genres/manage' as Href;
const movieImportsRoute = '/movies/imports' as Href;

export default function MovieManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const dark = useThemeMode() === 'dark';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMovieId, setSavingMovieId] = useState<string | null>(null);
  const [movieToDeactivate, setMovieToDeactivate] = useState<Movie | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const filteredMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return movies;
    }

    return movies.filter((movie) =>
      [
        movie.title,
        getGenreLabel(movie),
        movie.description,
      ]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [movies, query]);

  async function loadMovies(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      setMovies(await getMovies());
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load movies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const timeoutId = setTimeout(() => {
        void loadMovies();
      }, 0);

      return () => clearTimeout(timeoutId);
    }

  }, [isAuthenticated, isAdmin, isLoading]);

  async function handleSetActive(movie: Movie, isActive: boolean) {
    if (savingMovieId) {
      return;
    }

    setSavingMovieId(movie.id);
    setError('');

    try {
      await updateMovie(movie.id, toUpdateRequest(movie, isActive));
      setMovieToDeactivate(null);
      showNotification(isActive ? 'Movie restored.' : 'Movie deactivated.', {
        tone: 'success',
      });
      await loadMovies(false);
    } catch (updateError) {
      console.error(updateError);
      showNotification('Cannot update movie right now.', { tone: 'error' });
    } finally {
      setSavingMovieId(null);
    }
  }

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/movies" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {error ? (
        <View style={[styles.center, dark && styles.centerDark]}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadMovies()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredMovies}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <ScreenHeader
                backHref="/more"
                title="Manage Movies"
              />

              <View style={styles.toolbar}>
                <View style={styles.toolbarRow}>
                  <TextInput
                    autoCapitalize="none"
                    placeholder="Search title or genre"
                    placeholderTextColor={dark ? '#6e7683' : '#98a2b3'}
                    value={query}
                    onChangeText={setQuery}
                    style={[styles.searchInput, dark && styles.searchInputDark]}
                  />
                </View>

                <View style={styles.toolbarRow}>
                  <AnimatedPressable
                    contentStyle={styles.toolbarPrimaryButton}
                    onPress={() => router.push(movieFormRoute)}
                    pressableStyle={styles.toolbarActionItem}>
                    <Text style={styles.toolbarPrimaryButtonText}>Add</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    contentStyle={[styles.toolbarOutlineButton, dark && styles.toolbarOutlineButtonDark]}
                    onPress={() => router.push(genreManageRoute)}
                    pressableStyle={styles.toolbarActionItem}>
                    <Text style={[styles.toolbarOutlineButtonText, dark && styles.textDark]}>
                      Genres
                    </Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    contentStyle={[styles.toolbarOutlineButton, dark && styles.toolbarOutlineButtonDark]}
                    onPress={() => router.push(movieImportsRoute)}
                    pressableStyle={styles.toolbarActionItem}>
                    <Text style={[styles.toolbarOutlineButtonText, dark && styles.textDark]}>
                      Import
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadMovies(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, dark && styles.textDark]}>No movies found</Text>
              <Text style={[styles.emptyText, dark && styles.mutedTextDark]}>
                Create a movie or clear your search.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            return (
              <FadeInView delay={index * 35}>
                <AnimatedPressable
                  contentStyle={[styles.card, dark && styles.cardDark]}
                  onPress={() => router.push(toMovieFormRoute(item.id))}>
                  <View style={styles.cardTop}>
                    <View style={styles.poster}>
                      {item.posterUrl ? (
                        <Image
                          contentFit="cover"
                          source={{ uri: item.posterUrl }}
                          style={StyleSheet.absoluteFill}
                          transition={200}
                        />
                      ) : (
                        <Text style={styles.posterText}>{getInitials(item.title)}</Text>
                      )}
                    </View>

                    <View style={styles.info}>
                      <View style={styles.titleRow}>
                        <Text numberOfLines={3} style={[styles.title, dark && styles.textDark]}>
                          {item.title}
                        </Text>
                        <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                          <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.meta, dark && styles.mutedTextDark]}>
                        {item.durationMinutes} min | {formatDate(item.releaseDate)}
                      </Text>
                      {getGenreLabel(item) ? (
                        <Text style={[styles.genre, dark && styles.accentTextDark]}>
                          {getGenreLabel(item)}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={[styles.cardBody, dark && styles.cardBodyDark]}>
                    <Text numberOfLines={2} style={[styles.description, dark && styles.descriptionDark]}>
                      {item.description}
                    </Text>

                    <View style={styles.cardActions}>
                      <AnimatedPressable
                        contentStyle={[styles.secondaryButton, dark && styles.secondaryButtonDark]}
                        onPress={(event) => {
                          event.stopPropagation();
                          router.push(toMovieFormRoute(item.id));
                        }}>
                        <Text style={[styles.secondaryButtonText, dark && styles.textDark]}>
                          Edit
                        </Text>
                      </AnimatedPressable>

                      {item.isActive ? (
                        <AnimatedPressable
                          contentStyle={styles.dangerButton}
                          disabled={savingMovieId === item.id}
                          onPress={(event) => {
                            event.stopPropagation();
                            setMovieToDeactivate(item);
                          }}>
                          {savingMovieId === item.id ? (
                            <ActivityIndicator color="#b42318" />
                          ) : (
                            <Text style={styles.dangerButtonText}>Deactivate</Text>
                          )}
                        </AnimatedPressable>
                      ) : (
                        <AnimatedPressable
                          contentStyle={styles.restoreButton}
                          disabled={savingMovieId === item.id}
                          onPress={(event) => {
                            event.stopPropagation();
                            void handleSetActive(item, true);
                          }}>
                          {savingMovieId === item.id ? (
                            <ActivityIndicator color="#067647" />
                          ) : (
                            <Text style={styles.restoreButtonText}>Restore</Text>
                          )}
                        </AnimatedPressable>
                      )}
                    </View>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          }}
        />
      )}
      <ConfirmDialog
        cancelLabel="Keep active"
        confirmLabel="Deactivate"
        destructive
        loading={savingMovieId !== null}
        message="This hides the movie from customers but keeps its history."
        onCancel={() => {
          if (!savingMovieId) {
            setMovieToDeactivate(null);
          }
        }}
        onConfirm={() => {
          if (movieToDeactivate) {
            void handleSetActive(movieToDeactivate, false);
          }
        }}
        title="Deactivate movie?"
        visible={movieToDeactivate !== null}
      />
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

function toUpdateRequest(movie: Movie, isActive: boolean): UpdateMovieRequest {
  const genreIds = getMovieGenreIds(movie);

  return {
    description: movie.description,
    durationMinutes: movie.durationMinutes,
    genreId: genreIds[0] ?? null,
    genreIds,
    isActive,
    posterPublicId: movie.posterPublicId,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate,
    title: movie.title,
    trailerUrl: movie.trailerUrl,
  };
}

function getMovieGenreIds(movie: Movie) {
  return movie.genres?.length
    ? movie.genres.map((genre) => genre.id)
    : movie.genreId ? [movie.genreId] : [];
}

function getGenreLabel(movie: Movie) {
  return movie.genres?.length
    ? movie.genres.map((genre) => genre.name).join(', ')
    : movie.genre ?? '';
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

function toMovieFormRoute(movieId: string) {
  return `/movies/form?movieId=${encodeURIComponent(movieId)}` as Href;
}


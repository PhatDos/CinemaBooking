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
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { useAppNotification } from '@/src/components/AppNotification';
import { styles } from '@/src/styles/screens/movie-manage.styles';
import type { Movie, UpdateMovieRequest } from '@/src/types';

const movieFormRoute = '/movies/form' as Href;
const genreManageRoute = '/genres/manage' as Href;
const movieImportsRoute = '/movies/imports' as Href;

export default function MovieManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
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
      [movie.title, movie.genre ?? '', movie.description]
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Admin</Text>
          <Text style={styles.heading}>Manage Movies</Text>
          <Text style={styles.subtitle}>Add, edit, deactivate, and restore catalog movies.</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          autoCapitalize="none"
          placeholder="Search title or genre"
          placeholderTextColor="#98a2b3"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        <AnimatedPressable
          contentStyle={styles.addButton}
          onPress={() => router.push(movieFormRoute)}>
          <Text style={styles.addButtonText}>Add</Text>
        </AnimatedPressable>
        <AnimatedPressable
          contentStyle={styles.outlineButton}
          onPress={() => router.push(genreManageRoute)}>
          <Text style={styles.outlineButtonText}>Genres</Text>
        </AnimatedPressable>
        <AnimatedPressable
          contentStyle={styles.outlineButton}
          onPress={() => router.push(movieImportsRoute)}>
          <Text style={styles.outlineButtonText}>Import</Text>
        </AnimatedPressable>
      </View>

      {error ? (
        <View style={styles.center}>
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
              <Text style={styles.emptyTitle}>No movies found</Text>
              <Text style={styles.emptyText}>Create a movie or clear your search.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            return (
              <FadeInView delay={index * 35}>
                <AnimatedPressable
                  contentStyle={styles.card}
                  onPress={() => router.push(toMovieFormRoute(item.id))}>
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
                      <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                      <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.meta}>
                      {item.durationMinutes} min | {formatDate(item.releaseDate)}
                    </Text>
                    {item.genre ? <Text style={styles.genre}>{item.genre}</Text> : null}
                    <Text numberOfLines={2} style={styles.description}>
                      {item.description}
                    </Text>

                    <View style={styles.cardActions}>
                      <AnimatedPressable
                        contentStyle={styles.secondaryButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          router.push(toMovieFormRoute(item.id));
                        }}>
                        <Text style={styles.secondaryButtonText}>Edit</Text>
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

      <BottomNav />
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
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function toUpdateRequest(movie: Movie, isActive: boolean): UpdateMovieRequest {
  return {
    description: movie.description,
    durationMinutes: movie.durationMinutes,
    genreId: movie.genreId,
    isActive,
    posterPublicId: movie.posterPublicId,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate,
    title: movie.title,
    trailerUrl: movie.trailerUrl,
  };
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

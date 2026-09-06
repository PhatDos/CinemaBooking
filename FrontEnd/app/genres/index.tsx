import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
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
import { styles } from '@/src/styles/screens/genres.styles';
import type { Genre, Movie } from '@/src/types';

const genreManageRoute = '/genres/manage' as Href;

export default function GenresScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const selectedGenre = useMemo(
    () => genres.find((genre) => genre.id === selectedGenreId) ?? null,
    [genres, selectedGenreId],
  );

  const filteredMovies = useMemo(() => {
    if (!selectedGenreId) {
      return [];
    }

    return movies.filter((movie) => movie.genreId === selectedGenreId);
  }, [movies, selectedGenreId]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated]);

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
      setSelectedGenreId((current) =>
        current && genreResult.some((genre) => genre.id === current)
          ? current
          : genreResult[0]?.id ?? null,
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load genres');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Browse</Text>
          <Text style={styles.heading}>Genres</Text>
          <Text style={styles.subtitle}>
            {selectedGenre ? `${selectedGenre.name} movies` : 'Choose a genre'}
          </Text>
        </View>

        {isAdmin ? (
          <AnimatedPressable
            contentStyle={styles.manageButton}
            onPress={() => router.push(genreManageRoute)}>
            <Text style={styles.manageButtonText}>Manage</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.genreRail}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {genres.map((genre, index) => {
              const selected = genre.id === selectedGenreId;

              return (
                <FadeInView delay={index * 35} key={genre.id}>
                  <AnimatedPressable
                    contentStyle={[
                      styles.genreCard,
                      selected && styles.genreCardSelected,
                    ]}
                    onPress={() => setSelectedGenreId(genre.id)}>
                    <Image
                      contentFit="cover"
                      source={{ uri: genre.imageUrl }}
                      style={StyleSheet.absoluteFill}
                      transition={180}
                    />
                    <View style={styles.genreShade}>
                      <Text numberOfLines={1} style={styles.genreName}>
                        {genre.name}
                      </Text>
                    </View>
                  </AnimatedPressable>
                </FadeInView>
              );
            })}
          </ScrollView>

          <FlatList
            contentContainerStyle={styles.list}
            data={filteredMovies}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                onRefresh={() => {
                  setRefreshing(true);
                  void loadData(false);
                }}
                refreshing={refreshing}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No movies in this genre</Text>
                <Text style={styles.emptyText}>Choose another genre or add movies from Admin.</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <FadeInView delay={index * 45}>
                <AnimatedPressable
                  contentStyle={styles.movieCard}
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
                    <Text numberOfLines={2} style={styles.movieTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.movieMeta}>
                      {item.durationMinutes} min | {formatDate(item.releaseDate)}
                    </Text>
                    <Text numberOfLines={2} style={styles.movieDescription}>
                      {item.description || 'No description yet.'}
                    </Text>
                    <Text style={styles.movieAction}>View showtimes</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            )}
          />
        </>
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

import { router, Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
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

import { getNowShowingMovies } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { useThemeMode } from '@/src/theme';
import type { Movie } from '@/src/types';
import { styles } from '@/src/styles/screens/movies.styles';

type MovieFilter = 'all' | 'now-showing' | 'coming-soon';

export default function MoviesScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const dark = useThemeMode() === 'dark';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<MovieFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMovies = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      setMovies(await getNowShowingMovies());
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load movies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        void loadMovies();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loadMovies]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return <CenteredLoader />;
  }

  const visibleMovies = selectedFilter === 'coming-soon' ? [] : movies;
  const sectionTitle = selectedFilter === 'coming-soon' ? 'Coming soon' : 'Now showing';

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <View style={styles.chipSection}>
        <ScrollView
          contentContainerStyle={styles.chipRail}
          horizontal
          showsHorizontalScrollIndicator={false}>
          <MovieFilterChip
            dark={dark}
            label="All"
            onPress={() => setSelectedFilter('all')}
            selected={selectedFilter === 'all'}
          />
          <MovieFilterChip
            dark={dark}
            label="Now showing"
            onPress={() => setSelectedFilter('now-showing')}
            selected={selectedFilter === 'now-showing'}
          />
          <MovieFilterChip
            dark={dark}
            label="Coming soon"
            onPress={() => setSelectedFilter('coming-soon')}
            selected={selectedFilter === 'coming-soon'}
          />
        </ScrollView>
      </View>

      <View style={styles.header}>
        <Text style={[styles.heading, dark && styles.headingDark]}>{sectionTitle}</Text>
        <Text style={[styles.count, dark && styles.countDark]}>{visibleMovies.length} films</Text>
      </View>

      {error ? (
        <View style={[styles.center, dark && styles.centerDark]}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadMovies()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={visibleMovies.length === 0 ? styles.emptyList : styles.list}
          data={visibleMovies}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, dark && styles.emptyTitleDark]}>
                No movies found
              </Text>
              <Text style={[styles.emptyText, dark && styles.emptyTextDark]}>
                {selectedFilter === 'coming-soon'
                  ? 'Coming soon movies are not available yet.'
                  : 'Check upcoming showtimes later.'}
              </Text>
            </View>
          }
          numColumns={2}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                loadMovies(false);
              }}
              refreshing={refreshing}
              tintColor={dark ? '#ffffff' : '#050505'}
            />
          }
          renderItem={({ item, index }) => {
            const genreLabel = getGenreLabel(item);

            return (
              <View style={styles.cardWrap}>
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
                    </View>

                    <View style={styles.info}>
                      <Text numberOfLines={2} style={[styles.title, dark && styles.titleDark]}>
                        {item.title}
                      </Text>
                      <View style={styles.metaRow}>
                        {genreLabel ? (
                          <>
                            <Text
                              ellipsizeMode="tail"
                              numberOfLines={1}
                              style={[styles.meta, styles.metaGenre, dark && styles.metaDark]}>
                              {genreLabel}
                            </Text>
                            <Text style={[styles.dot, styles.metaDivider, dark && styles.dotDark]}>
                              |
                            </Text>
                          </>
                        ) : null}
                        <Text
                          numberOfLines={1}
                          style={[styles.meta, styles.metaDuration, dark && styles.metaDark]}>
                          {formatDuration(item.durationMinutes)}
                        </Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                </FadeInView>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function MovieFilterChip({
  dark,
  label,
  onPress,
  selected = false,
}: {
  dark: boolean;
  label: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  return (
    <AnimatedPressable
      contentStyle={[
        styles.filterChip,
        dark && styles.filterChipDark,
        selected && styles.filterChipSelected,
        selected && dark && styles.filterChipSelectedDark,
      ]}
      disabled={!onPress}
      onPress={onPress}
      pressedScale={0.97}>
      <Text
        numberOfLines={1}
        style={[
          styles.filterChipText,
          dark && styles.filterChipTextDark,
          selected && styles.filterChipTextSelected,
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
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

function getGenreLabel(movie: Movie) {
  return movie.genres?.length
    ? movie.genres.map((genre) => genre.name).join(', ')
    : movie.genre ?? '';
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}


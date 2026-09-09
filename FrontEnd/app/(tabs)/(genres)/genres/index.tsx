import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getGenres } from '@/src/api/genres';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { styles } from '@/src/styles/screens/genres.styles';
import { useThemeMode } from '@/src/theme';
import type { Genre } from '@/src/types';

const genreManageRoute = '/genres/manage' as Href;

export default function GenresScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const dark = useThemeMode() === 'dark';
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;

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
      setGenres(await getGenres());
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
    <View style={[styles.container, dark && styles.containerDark]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, dark && styles.kickerDark]}>Browse</Text>
          <Text style={[styles.heading, dark && styles.headingDark]}>Genres</Text>
          <Text style={[styles.subtitle, dark && styles.subtitleDark]}>
            Choose a genre to see matching movies.
          </Text>
        </View>

        {isAdmin ? (
          <AnimatedPressable
            contentStyle={[styles.manageButton, dark && styles.manageButtonDark]}
            onPress={() => router.push(genreManageRoute)}>
            <Text style={[styles.manageButtonText, dark && styles.manageButtonTextDark]}>
              Manage
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {error ? (
        <View style={[styles.center, dark && styles.centerDark]}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadData(false);
              }}
              refreshing={refreshing}
            />
          }>
          {genres.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, dark && styles.emptyTitleDark]}>
                No genres found
              </Text>
              <Text style={[styles.emptyText, dark && styles.emptyTextDark]}>
                Add genres from Admin to start browsing.
              </Text>
            </View>
          ) : (
            <View style={styles.genreGrid}>
              {genres.map((genre, index) => (
                <FadeInView delay={index * 35} key={genre.id} style={styles.genreItem}>
                  <AnimatedPressable
                    contentStyle={styles.genreCard}
                    onPress={() =>
                      router.push({
                        pathname: '/genres/[id]',
                        params: { id: genre.id, name: genre.name },
                      })
                    }>
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
              ))}
            </View>
          )}
        </ScrollView>
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


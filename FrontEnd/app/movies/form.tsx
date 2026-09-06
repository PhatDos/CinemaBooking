import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getGenres } from '@/src/api/genres';
import { createMovie, getMovieById, updateMovie } from '@/src/api/movies';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useAppNotification } from '@/src/components/AppNotification';
import { styles } from '@/src/styles/screens/movie-form.styles';
import { colors } from '@/src/theme';
import type { Genre, Movie, UpdateMovieRequest } from '@/src/types';

type MovieFormState = {
  description: string;
  durationMinutes: string;
  genreId: string;
  isActive: boolean;
  posterUrl: string;
  releaseDate: string;
  title: string;
  trailerUrl: string;
};

const defaultForm: MovieFormState = {
  description: '',
  durationMinutes: '',
  genreId: '',
  isActive: true,
  posterUrl: '',
  releaseDate: toDateInputValue(new Date().toISOString()),
  title: '',
  trailerUrl: '',
};

const genreManageRoute = '/genres/manage' as Href;
const movieManageRoute = '/movies/manage' as Href;

export default function MovieFormScreen() {
  const { movieId } = useLocalSearchParams<{ movieId?: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [form, setForm] = useState<MovieFormState>(defaultForm);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;
  const editing = Boolean(movieId);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [genreResult, movieResult] = await Promise.all([
          getGenres(),
          movieId ? getMovieById(movieId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setGenres(genreResult);

        if (movieResult) {
          setForm(toFormState(movieResult));
        }
      } catch (loadError) {
        console.error(loadError);
        setError('Cannot load movie form data');
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
  }, [isAuthenticated, isAdmin, movieId]);

  async function handleSubmit() {
    if (saving) {
      return;
    }

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      showNotification(validationError, { tone: 'error' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      const request = toRequest(form);

      if (editing && movieId) {
        await updateMovie(movieId, request);
        showNotification('Movie updated.', { tone: 'success' });
      } else {
        await createMovie(request);
        showNotification('Movie created.', { tone: 'success' });
      }

      router.replace(movieManageRoute);
    } catch (saveError) {
      console.error(saveError);
      const message = editing ? 'Cannot update movie right now.' : 'Cannot create movie right now.';
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof MovieFormState>(
    field: K,
    value: MovieFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/movies" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topActions}>
          <AnimatedPressable
            contentStyle={styles.backButton}
            disabled={saving}
            onPress={() => router.replace(movieManageRoute)}>
            <Text style={styles.backButtonText}>Back</Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.heading}>{editing ? 'Edit Movie' : 'Add Movie'}</Text>
        <Text style={styles.subtitle}>
          Catalog metadata is used by movie listings, showtime selection, and ticket emails.
        </Text>

        <View style={styles.form}>
          <Field
            label="Title"
            onChangeText={(value) => updateField('title', value)}
            placeholder="Movie title"
            value={form.title}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Short movie description"
            placeholderTextColor="#98a2b3"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={form.description}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Field
                inputMode="numeric"
                keyboardType="number-pad"
                label="Duration"
                onChangeText={(value) =>
                  updateField('durationMinutes', value.replace(/\D/g, ''))}
                placeholder="120"
                value={form.durationMinutes}
              />
            </View>
            <View style={styles.rowField}>
              <Field
                label="Release date"
                onChangeText={(value) => updateField('releaseDate', value)}
                placeholder="YYYY-MM-DD"
                value={form.releaseDate}
              />
            </View>
          </View>

          <View style={styles.genreHeader}>
            <Text style={styles.label}>Genre</Text>
            <AnimatedPressable
              contentStyle={styles.manageGenresButton}
              disabled={saving}
              onPress={() => router.push(genreManageRoute)}>
              <Text style={styles.manageGenresText}>Manage Genres</Text>
            </AnimatedPressable>
          </View>

          {genres.length === 0 ? (
            <Text style={styles.emptyGenreText}>Create a genre before adding movies.</Text>
          ) : (
            <View style={styles.genreGrid}>
              {genres.map((genre) => {
                const selected = form.genreId === genre.id;

                return (
                  <AnimatedPressable
                    key={genre.id}
                    contentStyle={[
                      styles.genreOption,
                      selected && styles.genreOptionSelected,
                    ]}
                    disabled={saving}
                    onPress={() => updateField('genreId', genre.id)}>
                    <Image
                      contentFit="cover"
                      source={{ uri: genre.imageUrl }}
                      style={styles.genreImage}
                      transition={180}
                    />
                    <View style={styles.genreOverlay}>
                      <Text numberOfLines={1} style={styles.genreName}>
                        {genre.name}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          )}

          <Field
            autoCapitalize="none"
            inputMode="url"
            label="Poster URL"
            onChangeText={(value) => updateField('posterUrl', value)}
            placeholder="https://..."
            value={form.posterUrl}
          />

          <Field
            autoCapitalize="none"
            inputMode="url"
            label="Trailer URL"
            onChangeText={(value) => updateField('trailerUrl', value)}
            placeholder="https://..."
            value={form.trailerUrl}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Active</Text>
              <Text style={styles.switchDescription}>Visible to customers and selectable for new showtimes.</Text>
            </View>
            <Switch
              ios_backgroundColor="#d0d5dd"
              onValueChange={(value) => updateField('isActive', value)}
              thumbColor={colors.surface}
              trackColor={{ false: '#d0d5dd', true: '#fecaca' }}
              value={form.isActive}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AnimatedPressable
            contentStyle={[styles.submitButton, saving && styles.submitButtonDisabled]}
            disabled={saving || genres.length === 0}
            onPress={handleSubmit}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{editing ? 'Save changes' : 'Create movie'}</Text>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label: string;
};

function Field({ label, ...props }: FieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#98a2b3"
        style={styles.input}
        {...props}
      />
    </>
  );
}

function toFormState(movie: Movie): MovieFormState {
  return {
    description: movie.description,
    durationMinutes: movie.durationMinutes.toString(),
    genreId: movie.genreId ?? '',
    isActive: movie.isActive,
    posterUrl: movie.posterUrl ?? '',
    releaseDate: toDateInputValue(movie.releaseDate),
    title: movie.title,
    trailerUrl: movie.trailerUrl ?? '',
  };
}

function toRequest(form: MovieFormState): UpdateMovieRequest {
  return {
    description: form.description.trim(),
    durationMinutes: Number(form.durationMinutes),
    genreId: form.genreId || null,
    isActive: form.isActive,
    posterUrl: toOptionalString(form.posterUrl),
    releaseDate: `${form.releaseDate.trim()}T00:00:00.000Z`,
    title: form.title.trim(),
    trailerUrl: toOptionalString(form.trailerUrl),
  };
}

function validateForm(form: MovieFormState) {
  if (!form.title.trim()) {
    return 'Movie title is required.';
  }

  if (!form.description.trim()) {
    return 'Movie description is required.';
  }

  const duration = Number(form.durationMinutes);

  if (!Number.isInteger(duration) || duration < 1 || duration > 500) {
    return 'Duration must be between 1 and 500 minutes.';
  }

  if (!isValidDateInput(form.releaseDate)) {
    return 'Release date must use YYYY-MM-DD.';
  }

  if (!form.genreId) {
    return 'Genre is required.';
  }

  if (!isValidOptionalUrl(form.posterUrl)) {
    return 'Poster URL must start with http:// or https://.';
  }

  if (!isValidOptionalUrl(form.trailerUrl)) {
    return 'Trailer URL must start with http:// or https://.';
  }

  return '';
}

function isValidDateInput(value: string) {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === trimmed;
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toDateInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function toOptionalString(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

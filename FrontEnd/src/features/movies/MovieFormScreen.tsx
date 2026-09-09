import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getGenres } from '@/src/api/genres';
import { ApiError } from '@/src/api/client';
import { signMoviePosterUpload, uploadMoviePoster } from '@/src/api/media';
import { createMovie, getMovieById, updateMovie } from '@/src/api/movies';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useAppNotification } from '@/src/components/AppNotification';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { styles } from '@/src/features/movies/movie-form.styles';
import { colors, useThemeMode } from '@/src/theme';
import type { Genre } from '@/src/types';

import { Field } from './components/Field';
import {
  defaultMovieForm,
  toFormState,
  toRequest,
  validateMovieForm,
  type MovieFormState,
} from './utils';

const genreManageRoute = '/genres/manage' as Href;
const movieManageRoute = '/movies/manage' as Href;

type MovieFormScreenProps = {
  movieId?: string;
};

export default function MovieFormScreen({ movieId }: MovieFormScreenProps) {
  const { showNotification } = useAppNotification();
  const dark = useThemeMode() === 'dark';
  const [form, setForm] = useState<MovieFormState>(defaultMovieForm);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [posterLocalUri, setPosterLocalUri] = useState<string | null>(null);
  const [posterMimeType, setPosterMimeType] = useState('image/jpeg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editing = Boolean(movieId);

  useEffect(() => {
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
          setPosterLocalUri(null);
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
  }, [movieId]);

  async function handleSubmit() {
    if (saving) {
      return;
    }

    const validationError = validateMovieForm(form);

    if (validationError) {
      setError(validationError);
      showNotification(validationError, { tone: 'error' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      const request = toRequest(form);

      if (posterLocalUri) {
        showNotification('Uploading poster...', { tone: 'info' });
        const signature = await signMoviePosterUpload();
        const uploaded = await uploadMoviePoster(
          posterLocalUri,
          signature,
          posterMimeType,
        );

        request.posterUrl = uploaded.posterUrl;
        request.posterPublicId = uploaded.posterPublicId;
      }

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
      const message = saveError instanceof ApiError
      ? saveError.message
      : editing ? 'Cannot update movie right now.' : 'Cannot create movie right now.';
      const friendlyMessage =
        saveError instanceof ApiError && saveError.status === 401
          ? 'Session expired. Please log in again.'
          : message;
      setError(friendlyMessage);
      showNotification(friendlyMessage, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPoster() {
    if (saving) {
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const message = 'Photo library permission is required.';
      setError(message);
      showNotification(message, { tone: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      return;
    }

    setPosterLocalUri(asset.uri);
    setPosterMimeType(asset.mimeType ?? 'image/jpeg');
    updateField('posterUrl', asset.uri);
    updateField('posterPublicId', '');
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

  function toggleGenre(genreId: string) {
    setForm((current) => {
      const selected = current.genreIds.includes(genreId);

      return {
        ...current,
        genreIds: selected
          ? current.genreIds.filter((id) => id !== genreId)
          : [...current.genreIds, genreId],
      };
    });
  }

  if (loading) {
    return (
      <View style={[styles.center, dark && styles.containerDark]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={[styles.container, dark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader
          backHref={movieManageRoute}
          title={editing ? 'Edit Movie' : 'Add Movie'}
        />

        <View style={[styles.form, dark && styles.formDark]}>
          <Field
            label="Title"
            onChangeText={(value) => updateField('title', value)}
            placeholder="Movie title"
            value={form.title}
          />

          <Text style={[styles.label, dark && styles.textDark]}>Description</Text>
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Short movie description"
            placeholderTextColor={dark ? '#6e7683' : '#98a2b3'}
            style={[styles.input, dark && styles.inputDark, styles.textArea]}
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
          <Text style={[styles.label, dark && styles.textDark]}>Genres</Text>
            <AnimatedPressable
              contentStyle={[styles.manageGenresButton, dark && styles.secondaryButtonDark]}
              disabled={saving}
              onPress={() => router.push(genreManageRoute)}>
              <Text style={[styles.manageGenresText, dark && styles.textDark]}>Manage Genres</Text>
            </AnimatedPressable>
          </View>

          {genres.length === 0 ? (
            <Text style={[styles.emptyGenreText, dark && styles.emptyGenreTextDark]}>
              Create a genre before adding movies.
            </Text>
          ) : (
            <View style={styles.genreGrid}>
              {genres.map((genre) => {
                const selected = form.genreIds.includes(genre.id);

                return (
                  <AnimatedPressable
                    key={genre.id}
                    contentStyle={[
                      styles.genreOption,
                      selected && styles.genreOptionSelected,
                    ]}
                    disabled={saving}
                    onPress={() => toggleGenre(genre.id)}
                    pressableStyle={styles.genrePressable}>
                    <Image
                      contentFit="cover"
                      source={{ uri: genre.imageUrl.trim() }}
                      style={StyleSheet.absoluteFill}
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

          <Text style={[styles.label, dark && styles.textDark]}>Poster</Text>
          <View style={styles.posterPicker}>
            <View style={styles.posterPreview}>
              {form.posterUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: form.posterUrl }}
                  style={styles.posterImage}
                  transition={180}
                />
              ) : (
                <Text style={styles.posterPlaceholder}>Poster</Text>
              )}
            </View>
            <View style={styles.posterActions}>
              <AnimatedPressable
                contentStyle={styles.posterButton}
                disabled={saving}
                onPress={handlePickPoster}>
                <Text style={styles.posterButtonText}>Choose poster</Text>
              </AnimatedPressable>
              {form.posterUrl ? (
                <AnimatedPressable
                  contentStyle={[styles.posterClearButton, dark && styles.secondaryButtonDark]}
                  disabled={saving}
                  onPress={() => {
                    setPosterLocalUri(null);
                    updateField('posterUrl', '');
                    updateField('posterPublicId', '');
                  }}>
                  <Text style={styles.posterClearText}>Remove</Text>
                </AnimatedPressable>
              ) : null}
              <Text style={[styles.posterHint, dark && styles.mutedTextDark]}>
                Uploads to Cloudinary when you save.
              </Text>
            </View>
          </View>

          <Field
            autoCapitalize="none"
            inputMode="url"
            label="Trailer URL"
            onChangeText={(value) => updateField('trailerUrl', value)}
            placeholder="https://..."
            value={form.trailerUrl}
          />

          <View style={[styles.switchRow, dark && styles.switchRowDark]}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, dark && styles.textDark]}>Active</Text>
              <Text style={[styles.switchDescription, dark && styles.mutedTextDark]}>
                Visible to customers and selectable for new showtimes.
              </Text>
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

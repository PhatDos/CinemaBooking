import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createGenre,
  deleteGenre,
  getGenres,
  updateGenre,
} from '@/src/api/genres';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useAppNotification } from '@/src/components/AppNotification';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { styles } from '@/src/styles/screens/genre-manage.styles';
import type { Genre } from '@/src/types';

type GenreFormState = {
  imageUrl: string;
  name: string;
  slug: string;
};

const defaultForm: GenreFormState = {
  imageUrl: '',
  name: '',
  slug: '',
};

const moviesManageRoute = '/movies/manage' as Href;

export default function GenreManageScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNotification } = useAppNotification();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<GenreFormState>(defaultForm);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const filteredGenres = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return genres;
    }

    return genres.filter((genre) =>
      [genre.name, genre.slug]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [genres, query]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const timeoutId = setTimeout(() => {
        void loadGenres();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isAdmin]);

  async function loadGenres(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    setError('');

    try {
      setGenres(await getGenres({ forceRefresh: true }));
    } catch (loadError) {
      console.error(loadError);
      setError('Cannot load genres');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

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
      const request = {
        imageUrl: form.imageUrl.trim(),
        name: form.name.trim(),
        slug: toOptionalString(form.slug),
      };

      if (editingGenre) {
        await updateGenre(editingGenre.id, request);
        showNotification('Genre updated.', { tone: 'success' });
      } else {
        await createGenre(request);
        showNotification('Genre created.', { tone: 'success' });
      }

      resetForm();
      await loadGenres(false);
    } catch (saveError) {
      console.error(saveError);
      const message = editingGenre ? 'Cannot update genre right now.' : 'Cannot create genre right now.';
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!genreToDelete || deleting) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteGenre(genreToDelete.id);
      showNotification('Genre deleted.', { tone: 'success' });
      setGenreToDelete(null);
      await loadGenres(false);
    } catch (deleteError) {
      console.error(deleteError);
      const message = 'Cannot delete this genre. It may be used by a movie.';
      setError(message);
      showNotification(message, { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(genre: Genre) {
    setEditingGenre(genre);
    setForm({
      imageUrl: genre.imageUrl,
      name: genre.name,
      slug: genre.slug,
    });
  }

  function resetForm() {
    setEditingGenre(null);
    setForm(defaultForm);
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
        <AnimatedPressable
          contentStyle={styles.backButton}
          onPress={() => router.replace(moviesManageRoute)}>
          <Text style={styles.backButtonText}>Movies</Text>
        </AnimatedPressable>

        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.heading}>Manage Genres</Text>
        <Text style={styles.subtitle}>Genres are cached and used as movie category visuals.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{editingGenre ? 'Edit genre' : 'Add genre'}</Text>
        <TextInput
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Name"
          placeholderTextColor="#98a2b3"
          style={styles.input}
          value={form.name}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => setForm((current) => ({ ...current, slug: value }))}
          placeholder="Slug (optional)"
          placeholderTextColor="#98a2b3"
          style={styles.input}
          value={form.slug}
        />
        <TextInput
          autoCapitalize="none"
          inputMode="url"
          onChangeText={(value) => setForm((current) => ({ ...current, imageUrl: value }))}
          placeholder="Image URL"
          placeholderTextColor="#98a2b3"
          style={styles.input}
          value={form.imageUrl}
        />

        <View style={styles.formActions}>
          {editingGenre ? (
            <AnimatedPressable
              contentStyle={styles.secondaryButton}
              disabled={saving}
              onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </AnimatedPressable>
          ) : null}

          <AnimatedPressable
            contentStyle={[styles.submitButton, saving && styles.disabledButton]}
            disabled={saving}
            onPress={handleSubmit}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{editingGenre ? 'Save' : 'Create'}</Text>
            )}
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Search genres"
          placeholderTextColor="#98a2b3"
          style={styles.searchInput}
          value={query}
        />
      </View>

      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={filteredGenres}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshing(true);
              void loadGenres(false);
            }}
            refreshing={refreshing}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No genres found</Text>
            <Text style={styles.emptyText}>Create a genre or clear your search.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 35}>
            <View style={styles.card}>
              <View style={styles.image}>
                <Image
                  contentFit="cover"
                  source={{ uri: item.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  transition={180}
                />
              </View>

              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.slug}>{item.slug}</Text>
                <Text style={styles.created}>Created {formatDate(item.createdAt)}</Text>

                <View style={styles.cardActions}>
                  <AnimatedPressable
                    contentStyle={styles.secondaryButton}
                    onPress={() => startEdit(item)}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    contentStyle={styles.dangerButton}
                    disabled={deleting}
                    onPress={() => setGenreToDelete(item)}>
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          </FadeInView>
        )}
      />

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Keep"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        message="Genres used by movies cannot be deleted."
        onCancel={() => {
          if (!deleting) {
            setGenreToDelete(null);
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete genre?"
        visible={genreToDelete !== null}
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

function validateForm(form: GenreFormState) {
  if (!form.name.trim()) {
    return 'Genre name is required.';
  }

  if (!isValidOptionalSlug(form.slug)) {
    return 'Slug can only contain letters, numbers, and dashes.';
  }

  if (!isValidUrl(form.imageUrl)) {
    return 'Image URL must start with http:// or https://.';
  }

  return '';
}

function isValidOptionalSlug(value: string) {
  const trimmed = value.trim();

  return !trimmed || /^[a-zA-Z0-9-]+$/.test(trimmed);
}

function isValidUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toOptionalString(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

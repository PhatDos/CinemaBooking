import { Pressable, Text, TextInput, View } from 'react-native';

import type { Movie } from '@/src/types';
import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';
import { getMovieMeta } from '../utils';
import { EmptyPanel } from './EmptyPanel';

type MovieSelectorProps = {
  filteredMovies: Movie[];
  movieQuery: string;
  movieCount: number;
  saving: boolean;
  selectedMovieId: string | null;
  onChangeQuery: (query: string) => void;
  onSelectMovie: (movieId: string) => void;
};

export function MovieSelector({
  filteredMovies,
  movieQuery,
  movieCount,
  saving,
  selectedMovieId,
  onChangeQuery,
  onSelectMovie,
}: MovieSelectorProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.group, dark && styles.groupDark]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dark && styles.textDark]}>Movie</Text>
        <Text style={[styles.sectionCount, dark && styles.mutedTextDark]}>{movieCount}</Text>
      </View>
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeQuery}
        placeholder="Search active movies"
        placeholderTextColor={dark ? '#6e7683' : '#98a2b3'}
        style={[styles.input, dark && styles.inputDark]}
        value={movieQuery}
      />
      {filteredMovies.length === 0 ? (
        <EmptyPanel body="No active movie matches this search." title="No movies" />
      ) : (
        <View style={styles.movieList}>
          {filteredMovies.map((movie) => {
            const selected = movie.id === selectedMovieId;

            return (
              <Pressable
                disabled={saving}
                key={movie.id}
                onPress={() => onSelectMovie(movie.id)}
                style={[
                  styles.movieRow,
                  dark && styles.movieRowDark,
                  selected && styles.movieRowSelected,
                  selected && dark && styles.movieRowSelectedDark,
                ]}>
                <View style={styles.movieText}>
                  <Text numberOfLines={1} style={[styles.movieTitle, dark && styles.textDark]}>
                    {movie.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.movieMeta, dark && styles.mutedTextDark]}>
                    {getMovieMeta(movie)}
                  </Text>
                </View>
                {selected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

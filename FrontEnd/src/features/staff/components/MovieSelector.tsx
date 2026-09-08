import { Pressable, Text, TextInput, View } from 'react-native';

import type { Movie } from '@/src/types';

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
  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Movie</Text>
        <Text style={styles.sectionCount}>{movieCount}</Text>
      </View>
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeQuery}
        placeholder="Search active movies"
        placeholderTextColor="#98a2b3"
        style={styles.input}
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
                style={[styles.movieRow, selected && styles.movieRowSelected]}>
                <View style={styles.movieText}>
                  <Text numberOfLines={1} style={styles.movieTitle}>
                    {movie.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.movieMeta}>
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

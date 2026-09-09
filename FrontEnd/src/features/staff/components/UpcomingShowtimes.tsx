import { Text, View } from 'react-native';

import { formatCinemaName, formatDateTime, formatRoomName } from '@/src/display';
import { useThemeMode } from '@/src/theme';
import type { Cinema, CinemaShowtime } from '@/src/types';

import { styles } from '../styles';
import { formatSeatPrices } from '../utils';
import { EmptyPanel } from './EmptyPanel';

type UpcomingShowtimesProps = {
  selectedCinema: Cinema | null;
  showtimes: CinemaShowtime[];
};

export function UpcomingShowtimes({
  selectedCinema,
  showtimes,
}: UpcomingShowtimesProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <>
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, dark && styles.textDark]}>Showtimes</Text>
        <Text style={[styles.listCount, dark && styles.mutedTextDark]}>{showtimes.length}</Text>
      </View>

      {showtimes.length === 0 ? (
        <EmptyPanel
          body={
            selectedCinema
              ? 'No showtimes for this cinema on the selected date.'
              : 'Select a cinema to view showtimes.'
          }
          title="No showtimes"
        />
      ) : (
        <View style={styles.showtimeList}>
          {showtimes.map((showtime) => (
            <View key={showtime.showtimeId} style={[styles.showtimeCard, dark && styles.showtimeCardDark]}>
              <View style={styles.showtimeInfo}>
                <Text numberOfLines={1} style={[styles.showtimeMovie, dark && styles.textDark]}>
                  {showtime.movieTitle}
                </Text>
                <Text numberOfLines={1} style={[styles.showtimeMeta, dark && styles.mutedTextDark]}>
                  {selectedCinema ? `${formatCinemaName(selectedCinema.name)} | ` : ''}
                  {formatRoomName(showtime.roomName)} |{' '}
                  {formatDateTime(showtime.startTime)}
                </Text>
              </View>
              <Text style={[styles.price, dark && styles.textDark]}>
                {formatSeatPrices(
                  showtime.standardPrice,
                  showtime.vipPrice,
                  showtime.couplePrice,
                )}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

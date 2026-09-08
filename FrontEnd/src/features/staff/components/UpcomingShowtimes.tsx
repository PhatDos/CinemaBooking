import { Text, View } from 'react-native';

import { formatDateTime, formatRoomName } from '@/src/display';
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
  return (
    <>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Upcoming</Text>
        <Text style={styles.listCount}>{showtimes.length}</Text>
      </View>

      {showtimes.length === 0 ? (
        <EmptyPanel
          body={
            selectedCinema
              ? 'No upcoming showtimes for this cinema.'
              : 'Select a cinema to view showtimes.'
          }
          title="No showtimes"
        />
      ) : (
        <View style={styles.showtimeList}>
          {showtimes.map((showtime) => (
            <View key={showtime.showtimeId} style={styles.showtimeCard}>
              <View style={styles.showtimeInfo}>
                <Text numberOfLines={1} style={styles.showtimeMovie}>
                  {showtime.movieTitle}
                </Text>
                <Text numberOfLines={1} style={styles.showtimeMeta}>
                  {formatRoomName(showtime.roomName)} |{' '}
                  {formatDateTime(showtime.startTime)}
                </Text>
              </View>
              <Text style={styles.price}>
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

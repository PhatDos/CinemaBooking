import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ShowtimeDateRail } from '@/src/features/showtimes/ShowtimeDateRail';
import { useThemeMode } from '@/src/theme';

import { CinemaSelector } from './components/CinemaSelector';
import { RoomSelector } from './components/RoomSelector';
import { MovieSelector } from './components/MovieSelector';
import { ScheduleForm } from './components/ScheduleForm';
import { UpcomingShowtimes } from './components/UpcomingShowtimes';
import { useStaffShowtimes } from './hooks/useStaffShowtimes';
import { styles } from './styles';

type StaffShowtimesScreenProps = {
  isAdmin: boolean;
  isStaff: boolean;
};

export function StaffShowtimesScreen({
  isAdmin,
  isStaff,
}: StaffShowtimesScreenProps) {
  const showtimes = useStaffShowtimes(isAdmin);
  const dark = useThemeMode() === 'dark';

  if (showtimes.loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void showtimes.refreshShowtimes()}
            refreshing={showtimes.refreshing}
          />
        }>
        <ScreenHeader
          backHref="/more"
          title="Manage Showtimes"
        />

        <CinemaSelector
          cinemas={showtimes.cinemas}
          isStaff={isStaff}
          saving={showtimes.saving}
          selectedCinemaId={showtimes.selectedCinemaId}
          onSelectCinema={showtimes.setSelectedCinemaId}
        />

        <RoomSelector
          loadingCinema={showtimes.loadingCinema}
          rooms={showtimes.rooms}
          saving={showtimes.saving}
          selectedCinema={showtimes.selectedCinema}
          selectedRoomId={showtimes.selectedRoomId}
          onSelectRoom={showtimes.setSelectedRoomId}
        />

        <MovieSelector
          filteredMovies={showtimes.filteredMovies}
          movieCount={showtimes.movies.length}
          movieQuery={showtimes.movieQuery}
          saving={showtimes.saving}
          selectedMovieId={showtimes.selectedMovieId}
          onChangeQuery={showtimes.setMovieQuery}
          onSelectMovie={showtimes.setSelectedMovieId}
        />

        <ScheduleForm
          bulkMode={showtimes.bulkMode}
          bulkTimes={showtimes.bulkTimes}
          couplePrice={showtimes.couplePrice}
          date={showtimes.date}
          saving={showtimes.saving}
          selectedMovie={showtimes.selectedMovie}
          selectedRoom={showtimes.selectedRoom}
          standardPrice={showtimes.standardPrice}
          time={showtimes.time}
          vipPrice={showtimes.vipPrice}
          onChangeBulkMode={showtimes.setBulkMode}
          onChangeBulkTimes={showtimes.setBulkTimes}
          onChangeCouplePrice={showtimes.setCouplePrice}
          onChangeDate={showtimes.setDate}
          onChangeStandardPrice={showtimes.setStandardPrice}
          onChangeTime={showtimes.setTime}
          onChangeVipPrice={showtimes.setVipPrice}
          onCreateShowtime={() => void showtimes.createSelectedShowtime()}
        />

        {showtimes.error ? <Text style={styles.error}>{showtimes.error}</Text> : null}

        <ShowtimeDateRail
          canIncludePast
          includePast={showtimes.includePast}
          onSelectDate={showtimes.setFilterDate}
          onToggleIncludePast={showtimes.setIncludePast}
          selectedDate={showtimes.filterDate}
          title="FILTER SHOWTIMES"
        />

        <UpcomingShowtimes
          selectedCinema={showtimes.selectedCinema}
          showtimes={showtimes.upcomingShowtimes}
        />
      </ScrollView>
    </View>
  );
}

function CenteredLoader() {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.center, dark && styles.containerDark]}>
      <ActivityIndicator size="large" />
    </View>
  );
}

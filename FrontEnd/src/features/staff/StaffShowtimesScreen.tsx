import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';

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

  if (showtimes.loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void showtimes.refreshShowtimes()}
            refreshing={showtimes.refreshing}
          />
        }>
        <AnimatedPressable contentStyle={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>

        <FadeInView>
          <Text style={styles.kicker}>{isAdmin ? 'Admin' : 'Staff'}</Text>
          <Text style={styles.title}>Manage Showtimes</Text>
          <Text style={styles.subtitle}>
            Create showtimes from active movies for available cinema rooms.
          </Text>
        </FadeInView>

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

        <UpcomingShowtimes
          selectedCinema={showtimes.selectedCinema}
          showtimes={showtimes.upcomingShowtimes}
        />
      </ScrollView>

      <BottomNav />
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

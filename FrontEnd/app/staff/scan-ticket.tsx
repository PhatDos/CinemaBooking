import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult } from 'expo-camera';
import { Redirect,
  router } from 'expo-router';
import { useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/src/api/client';
import { checkInTicket } from '@/src/api/tickets';
import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import type { CheckInTicketResponse } from '@/src/types';
import { getCinema, getRoom, getSeats } from '@/src/api/cinemas';
import { getMovieById } from '@/src/api/movies';
import { getShowtimeById } from '@/src/api/showtimes';
import { formatCinemaName, formatRoomName, getSeatLabel } from '@/src/display';
import { styles } from '@/src/styles/screens/scan-ticket.styles';

type CheckInDetails = {
  cinemaName: string;
  movieTitle: string;
  roomName: string;
  seatLabel: string;
};

export default function ScanTicketScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInTicketResponse | null>(null);
  const [details, setDetails] = useState<CheckInDetails | null>(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [scanLine] = useState(() => new Animated.Value(0));

  const canCheckIn = user?.roles.some((role) => role === 'Staff' || role === 'Admin') ?? false;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [scanLine]);

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!canCheckIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Scanner unavailable</Text>
        <Text style={styles.bodyText}>Your account cannot check in tickets.</Text>
        <AnimatedPressable
          contentStyle={styles.secondaryButton}
          onPress={() => router.replace('/movies')}>
          <Text style={styles.secondaryButtonText}>Back to movies</Text>
        </AnimatedPressable>
      </View>
    );
  }

  if (!permission) {
    return <CenteredLoader />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.bodyText}>Allow camera permission to scan ticket QR codes.</Text>
        <AnimatedPressable contentStyle={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </AnimatedPressable>
        <AnimatedPressable contentStyle={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </AnimatedPressable>
      </View>
    );
  }

  async function handleBarcodeScanned(scanningResult: BarcodeScanningResult) {
    if (isScanned || isSubmitting) {
      return;
    }

    setIsScanned(true);
    setIsSubmitting(true);
    setResult(null);
    setDetails(null);
    setMessage('');
    setMessageTone('info');

    try {
      const checkInResult = await checkInTicket(scanningResult.data);
      setResult(checkInResult);
      void loadCheckInDetails(checkInResult);
      setMessage('Check-in successful');
      setMessageTone('success');
    } catch (error) {
      setResult(null);
      setMessage(getCheckInErrorMessage(error));
      setMessageTone('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  function scanAgain() {
    setIsScanned(false);
    setResult(null);
    setDetails(null);
    setMessage('');
    setMessageTone('info');
  }

  async function loadCheckInDetails(checkInResult: CheckInTicketResponse) {
    try {
      const showtime = await getShowtimeById(checkInResult.showtimeId);
      const [movie, room, seats] = await Promise.all([
        getMovieById(showtime.movieId),
        getRoom(showtime.roomId),
        getSeats(),
      ]);
      const cinema = await getCinema(room.cinemaId);
      const seat = seats.find((item) => item.id === checkInResult.seatId);

      setDetails({
        cinemaName: formatCinemaName(cinema.name),
        movieTitle: movie.title,
        roomName: formatRoomName(room.name),
        seatLabel: seat ? getSeatLabel(seat) : 'Seat checked',
      });
    } catch (detailsError) {
      console.error(detailsError);
      setDetails(null);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        facing="back"
        onBarcodeScanned={isScanned ? undefined : handleBarcodeScanned}
        style={styles.camera}
      />

      <View style={styles.topBar}>
        <AnimatedPressable contentStyle={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </AnimatedPressable>
        <Text style={styles.screenTitle}>Scan Ticket</Text>
      </View>

      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLine.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 220],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.hint}>Place the ticket QR inside the frame</Text>
      </View>

      {(isSubmitting || message) && (
        <FadeInView distance={16} style={styles.resultPanel}>
          {isSubmitting ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.resultTitle}>Checking ticket...</Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.resultTitle,
                  messageTone === 'success' ? styles.successText : styles.errorText,
                ]}>
                {message}
              </Text>

              {result && (
                <View style={styles.resultDetails}>
                  <Text style={styles.detailText}>Status: {result.status}</Text>
                  {details ? (
                    <>
                      <Text style={styles.detailText}>Movie: {details.movieTitle}</Text>
                      <Text style={styles.detailText}>Cinema: {details.cinemaName}</Text>
                      <Text style={styles.detailText}>Room: {details.roomName}</Text>
                      <Text style={styles.detailText}>Seat: {details.seatLabel}</Text>
                    </>
                  ) : (
                    <Text style={styles.detailText}>Ticket checked in</Text>
                  )}
                  <Text style={styles.detailText}>Checked in: {formatDateTime(result.usedAt)}</Text>
                </View>
              )}

              <AnimatedPressable contentStyle={styles.primaryButton} onPress={scanAgain}>
                <Text style={styles.primaryButtonText}>Scan another ticket</Text>
              </AnimatedPressable>
            </>
          )}
        </FadeInView>
      )}
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

function getCheckInErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || 'Ticket cannot be checked in.';
      case 403:
        return 'You are not allowed to check in this ticket.';
      case 404:
        return 'Ticket not found.';
      case 409:
        return 'Ticket has already been used.';
      default:
        return error.message || 'Check-in failed.';
    }
  }

  return 'Check-in failed.';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

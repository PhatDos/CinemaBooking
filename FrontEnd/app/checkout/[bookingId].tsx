import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import BookingCheckoutScreen from '@/src/features/checkout/BookingCheckoutScreen';
import { styles } from '@/src/features/checkout/styles';
import { isNonEmptyGuid } from '@/src/features/checkout/utils';

export default function BookingCheckoutRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const validBookingId = isNonEmptyGuid(bookingId) ? bookingId : null;

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

  if (!validBookingId) {
    return <Redirect href="/bookings" />;
  }

  return <BookingCheckoutScreen bookingId={validBookingId} />;
}

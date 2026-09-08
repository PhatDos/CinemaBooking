import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import HoldCheckoutScreen from '@/src/features/checkout/HoldCheckoutScreen';
import { styles } from '@/src/features/checkout/styles';

export default function HoldCheckoutRoute() {
  const params = useLocalSearchParams<{
    amount?: string;
    expiresAt?: string;
    holdId: string;
    seatCount?: string;
    showtimeId?: string;
  }>();
  const { isAuthenticated, isLoading } = useAuth();

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

  return <HoldCheckoutScreen params={params} />;
}

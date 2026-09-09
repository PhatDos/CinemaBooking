import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import SeatsScreen from '@/src/features/seats/SeatsScreen';
import { styles } from '@/src/features/seats/styles';

export default function SeatsRoute() {
  const { showtimeId } = useLocalSearchParams<{ showtimeId: string }>();
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

  return <SeatsScreen showtimeId={showtimeId} />;
}

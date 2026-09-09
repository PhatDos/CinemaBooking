import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { StaffShowtimesScreen } from '@/src/features/staff/StaffShowtimesScreen';
import { styles } from '@/src/features/staff/styles';

export default function StaffShowtimesRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isStaff = roles.includes('Staff');
  const canManage = isAdmin || isStaff;

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

  if (!canManage) {
    return <Redirect href="/movies" />;
  }

  return <StaffShowtimesScreen isAdmin={isAdmin} isStaff={isStaff} />;
}

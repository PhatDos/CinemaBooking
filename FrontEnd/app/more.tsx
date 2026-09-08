import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { LogoutButton } from '@/src/auth/components/LogoutButton';
import { colors } from '@/src/theme';
import { styles } from '@/src/styles/screens/more.styles';

type MoreItem = {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  roles: string[];
};

const items: MoreItem[] = [
  {
    href: '/movies/manage' as Href,
    icon: 'film-outline',
    label: 'Manage Movies',
    roles: ['Admin'],
  },
  {
    href: '/staff/manage' as Href,
    icon: 'people-outline',
    label: 'Add / Manage Staff',
    roles: ['Admin'],
  },
  {
    href: '/staff/showtimes' as Href,
    icon: 'calendar-outline',
    label: 'Manage Showtimes',
    roles: ['Admin', 'Staff'],
  },
  {
    href: '/staff/scan-ticket' as Href,
    icon: 'scan-outline',
    label: 'Scan Ticket',
    roles: ['Admin', 'Staff'],
  },
  {
    href: '/bookings' as Href,
    icon: 'ticket-outline',
    label: 'My Bookings',
    roles: ['Admin', 'Staff'],
  },
];

export default function MoreScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const roles = user?.roles ?? [];
  const canUseMore = roles.some((role) => role === 'Admin' || role === 'Staff');

  if (!canUseMore) {
    return <Redirect href="/movies" />;
  }

  const visibleItems = items.filter((item) =>
    item.roles.some((role) => roles.includes(role)),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>

        <View style={styles.group}>
          {visibleItems.map((item, index) => (
            <SettingsRow
              icon={item.icon}
              isLast={index === visibleItems.length - 1}
              key={item.label}
              label={item.label}
              onPress={() => router.push(item.href)}
            />
          ))}
        </View>

        <View style={styles.group}>
          <LogoutButton
            style={styles.logoutRow}
            textStyle={styles.logoutText}
          />
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function SettingsRow({
  icon,
  isLast,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isLast: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      contentStyle={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.surface} name={icon} size={22} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons color={colors.muted} name="chevron-forward" size={22} />
    </AnimatedPressable>
  );
}

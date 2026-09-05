import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { colors, radius, shadow } from '@/src/theme';

type NavItem = {
  label: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  match: string;
};

const baseItems: NavItem[] = [
  {
    label: 'Movies',
    href: '/movies',
    icon: 'film-outline',
    match: '/movies',
  },
  {
    label: 'Cinemas',
    href: '/cinemas',
    icon: 'business-outline',
    match: '/cinemas',
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: 'ticket-outline',
    match: '/bookings',
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const canScan = user?.roles.some((role) => role === 'Staff' || role === 'Admin') ?? false;

  const items = canScan
    ? [
        ...baseItems,
        {
          label: 'Scan',
          href: '/staff/scan-ticket' as Href,
          icon: 'scan-outline' as const,
          match: '/staff/scan-ticket',
        },
      ]
    : baseItems;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname.startsWith(item.match);

          return (
            <AnimatedPressable
              contentStyle={[styles.item, active && styles.itemActive]}
              key={item.match}
              onPress={() => router.navigate(item.href)}
              pressedScale={0.96}>
              <Ionicons
                color={active ? colors.surface : colors.muted}
                name={item.icon}
                size={20}
              />
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

export const bottomNavHeight = 94;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderBottomWidth: 0,
    borderRadius: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 22,
    ...shadow.card,
  },
  item: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: 3,
  },
  itemActive: {
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  labelActive: {
    color: colors.surface,
  },
});

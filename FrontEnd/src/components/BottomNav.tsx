import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { colors } from '@/src/theme';
import { styles } from '@/src/styles/components/bottom-nav.styles';

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
              onPress={() => {
                if (!active) {
                  router.navigate(item.href);
                }
              }}
              pressableStyle={styles.itemPressable}
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

export { bottomNavHeight } from '@/src/styles/layout';

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useThemeMode } from '@/src/theme';
import { styles } from '@/src/styles/components/bottom-nav.styles';

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  routeName: string;
};

type BottomNavProps = {
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (options: {
      canPreventDefault?: boolean;
      target: string;
      type: 'tabLongPress' | 'tabPress';
    }) => unknown;
    navigate: (name: string, params?: object) => void;
  };
  state: {
    index: number;
    routes: {
      key: string;
      name: string;
      params?: object;
    }[];
  };
};

const baseItems: NavItem[] = [
  {
    label: 'Movies',
    icon: 'film-outline',
    routeName: '(movies)',
  },
  {
    label: 'Cinemas',
    icon: 'business-outline',
    routeName: '(cinemas)',
  },
  {
    label: 'Genres',
    icon: 'grid-outline',
    routeName: '(genres)',
  },
  {
    label: 'Bookings',
    icon: 'ticket-outline',
    routeName: '(bookings)',
  },
  {
    label: 'More',
    icon: 'ellipsis-horizontal-circle-outline',
    routeName: '(more)',
  },
];

export function BottomNav({ descriptors, navigation, state }: BottomNavProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.nav, !dark && styles.navLight]}>
        {baseItems.map((item) => {
          const routeIndex = state.routes.findIndex((route) => route.name === item.routeName);
          const route = state.routes[routeIndex];

          if (!route) {
            return null;
          }

          const descriptor = descriptors[route.key];
          const active = state.index === routeIndex;

          return (
            <AnimatedPressable
              contentStyle={[styles.item, active && styles.itemActive]}
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  canPreventDefault: true,
                  target: route.key,
                  type: 'tabPress',
                }) as { defaultPrevented?: boolean };

                if (!active && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => {
                navigation.emit({
                  target: route.key,
                  type: 'tabLongPress',
                });
              }}
              pressableStyle={styles.itemPressable}
              pressedScale={0.96}>
              <Ionicons
                color={active ? (dark ? '#ffffff' : '#050505') : (dark ? '#6e7683' : '#8a94a5')}
                name={item.icon}
                size={20}
              />
              <Text
                style={[
                  styles.label,
                  !dark && styles.labelLight,
                  active && styles.labelActive,
                  active && !dark && styles.labelActiveLight,
                ]}>
                {descriptor.options.title ?? item.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

export { bottomNavHeight } from '@/src/styles/layout';

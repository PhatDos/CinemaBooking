import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { LogoutButton } from '@/src/auth/components/LogoutButton';
import { useThemePreference } from '@/src/theme';
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
    href: '/cinemas/manage' as Href,
    icon: 'business-outline',
    label: 'Manage Cinemas',
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
];

export default function MoreScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { mode, setMode } = useThemePreference();
  const dark = mode === 'dark';

  if (isLoading) {
    return (
      <View style={[styles.center, dark && styles.containerDark]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const roles = user?.roles ?? [];
  const visibleItems = items.filter((item) =>
    item.roles.some((role) => roles.includes(role)),
  );

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, dark && styles.titleDark]}>More</Text>
        <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{user?.email}</Text>

        <View style={[styles.group, dark && styles.groupDark]}>
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceText}>
              <Text style={[styles.appearanceTitle, dark && styles.rowLabelDark]}>
                Appearance
              </Text>
              <Text style={[styles.appearanceMeta, dark && styles.subtitleDark]}>
                {mode === 'dark' ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
            <View style={[styles.themeSwitch, dark && styles.themeSwitchDark]}>
              <ThemeOption
                active={mode === 'light'}
                dark={dark}
                label="Light"
                onPress={() => void setMode('light')}
              />
              <ThemeOption
                active={mode === 'dark'}
                dark={dark}
                label="Dark"
                onPress={() => void setMode('dark')}
              />
            </View>
          </View>
        </View>

        {visibleItems.length > 0 ? (
          <View style={[styles.group, dark && styles.groupDark]}>
            {visibleItems.map((item, index) => (
              <SettingsRow
                dark={dark}
                icon={item.icon}
                isLast={index === visibleItems.length - 1}
                key={item.label}
                label={item.label}
                onPress={() => router.push(item.href)}
              />
            ))}
          </View>
        ) : null}

        <View style={[styles.group, dark && styles.groupDark]}>
          <LogoutButton
            style={styles.logoutRow}
            textStyle={styles.logoutText}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeOption({
  active,
  dark,
  label,
  onPress,
}: {
  active: boolean;
  dark: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      contentStyle={[
        styles.themeOption,
        active && styles.themeOptionActive,
        active && dark && styles.themeOptionActiveDark,
      ]}
      onPress={onPress}
      pressedScale={0.97}>
      <Text
        style={[
          styles.themeOptionText,
          dark && styles.themeOptionTextDark,
          active && styles.themeOptionTextActive,
          active && dark && styles.themeOptionTextActiveDark,
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function SettingsRow({
  dark,
  icon,
  isLast,
  label,
  onPress,
}: {
  dark: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  isLast: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      contentStyle={[
        styles.row,
        !isLast && styles.rowBorder,
        dark && !isLast && styles.rowBorderDark,
      ]}
      onPress={onPress}>
      <View style={[styles.iconWrap, dark && styles.iconWrapDark]}>
        <Ionicons color={dark ? '#050505' : '#ffffff'} name={icon} size={22} />
      </View>
      <Text style={[styles.rowLabel, dark && styles.rowLabelDark]}>{label}</Text>
      <Ionicons color={dark ? '#5f6673' : '#667085'} name="chevron-forward" size={22} />
    </AnimatedPressable>
  );
}


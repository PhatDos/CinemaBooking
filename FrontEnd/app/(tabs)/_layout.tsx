import { Tabs } from 'expo-router';

import { BottomNav } from '@/src/components/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen
        name="(movies)"
        options={{ href: '/movies', title: 'Movies' }}
      />
      <Tabs.Screen
        name="(cinemas)"
        options={{ href: '/cinemas', title: 'Cinemas' }}
      />
      <Tabs.Screen
        name="(genres)"
        options={{ href: '/genres', title: 'Genres' }}
      />
      <Tabs.Screen
        name="(bookings)"
        options={{ href: '/bookings', title: 'Bookings' }}
      />
      <Tabs.Screen
        name="(more)"
        options={{ href: '/more', title: 'More' }}
      />
      <Tabs.Screen
        name="(booking-flow)"
        options={{ href: null }}
      />
    </Tabs>
  );
}


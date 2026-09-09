import type { Href } from 'expo-router';
import { Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { goBackOrReplace } from '@/src/navigation';
import { styles } from '@/src/styles/components/screen-header.styles';
import { useThemeMode } from '@/src/theme';

type ScreenHeaderProps = {
  backHref?: Href;
  backLabel?: string;
  title: string;
};

export function ScreenHeader({
  backHref,
  backLabel = 'Back',
  title,
}: ScreenHeaderProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      <View style={styles.topRow}>
        {backHref ? (
          <AnimatedPressable
            accessibilityLabel={backLabel}
            contentStyle={[styles.backButton, dark && styles.backButtonDark]}
            onPress={() => goBackOrReplace(backHref)}>
            <Text style={[styles.backButtonText, dark && styles.backButtonTextDark]}>
              {backLabel}
            </Text>
          </AnimatedPressable>
        ) : (
          <View style={styles.topSpacer} />
        )}

        <Text numberOfLines={1} style={[styles.title, dark && styles.titleDark]}>
          {title}
        </Text>

        <View style={styles.topSpacer} />
      </View>
      <View style={[styles.divider, dark && styles.dividerDark]} />
    </View>
  );
}

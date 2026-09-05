import { PropsWithChildren, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';

type FadeInViewProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function FadeInView({
  children,
  delay = 0,
  distance = 12,
  duration = 280,
  style,
}: FadeInViewProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(distance));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        delay,
        duration,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        delay,
        duration,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

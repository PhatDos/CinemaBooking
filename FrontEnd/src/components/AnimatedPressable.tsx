import * as Haptics from 'expo-haptics';
import { PropsWithChildren, useState } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AnimatedPressableProps = PropsWithChildren<
  Omit<PressableProps, 'style' | 'children'> & {
    contentStyle?: StyleProp<ViewStyle>;
    haptic?: boolean;
    pressedScale?: number;
  }
>;

export function AnimatedPressable({
  children,
  contentStyle,
  disabled,
  haptic = true,
  onPress,
  onPressIn,
  onPressOut,
  pressedScale = 0.98,
  ...props
}: AnimatedPressableProps) {
  const [scale] = useState(() => new Animated.Value(1));

  function animate(toValue: number) {
    Animated.spring(scale, {
      damping: 18,
      mass: 0.7,
      stiffness: 220,
      toValue,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPress={(event) => {
        if (haptic && !disabled) {
          void Haptics.selectionAsync();
        }

        onPress?.(event);
      }}
      onPressIn={(event) => {
        animate(pressedScale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        onPressOut?.(event);
      }}>
      <Animated.View
        style={[
          contentStyle,
          {
            opacity: disabled ? 0.58 : 1,
            transform: [{ scale }],
          },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// A small quiet icon inside the circle (the loudspeaker above the word, the cross under it), 20 px in a 40 px touch area, at the
// given `top` and centred. It is always mounted and fades in and out with `visible` (260 ms in, 140 ms out): a view that is taken
// away while it fades can jump to another place for a moment. `SpeakButton` and `DontKnowButton` are this with their icon and job.
export function CircleAction({
  top,
  onPress,
  visible = true,
  accessibilityLabel,
  children,
}: {
  top: number;
  onPress: () => void;
  visible?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? 260 : 140 });
  }, [visible, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.wrap, { top }, fade]} pointerEvents={visible ? 'box-none' : 'none'}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={10} style={styles.button}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

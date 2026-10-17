import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// A thin bar at the top of the first-run screens: how far through them the user is. It fills smoothly as
// the screens change.
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  const insets = useSafeAreaInsets();
  const p = useSharedValue(step / total);
  useEffect(() => {
    p.value = withTiming(step / total, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [step, total, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View pointerEvents="none" style={[styles.track, { top: insets.top + 8 }]} accessible accessibilityLabel={`step ${step} of ${total}`}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { position: 'absolute', left: 24, right: 24, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
});

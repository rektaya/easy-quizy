import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts, radius, shadow } from '../theme';

/** How far the bottom of the hint sits above the top of the circle's box: just clear of the handle at the top of the ring. */
export const HINT_GAP = 24;

// The hint about the handle on the ring, on a plate of its own so it reads over the stars. Shown above the circle,
// close to it, for the first words (Explore's test, the Study test). `delay` waits for the badge that sits above
// the circle for its two seconds. `bottom` is measured from the bottom of the area the circle sits in.
export function AdjustHint({ bottom, delay = 0 }: { bottom: number; delay?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(300).delay(delay)} pointerEvents="none" style={[styles.slot, { bottom }]}>
      <View style={styles.plate}>
        <Text style={styles.text}>hint: if you were wrong, drag the dot on the ring to change your initial answer</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 28 },
  plate: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
});

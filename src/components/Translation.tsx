import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts } from '../theme';

// The translation takes the place of the German word inside the circle, in the same style.
// Longer translations step down in size and wrap, so they stay inside the ring.
function sizeFor(text: string): number {
  if (text.length <= 12) return 30;
  if (text.length <= 18) return 24;
  if (text.length <= 28) return 20;
  return 17;
}

export function Translation({ text }: { text: string }) {
  const size = sizeFor(text);
  return (
    <Animated.Text
      entering={FadeIn.duration(280)}
      style={[styles.text, { fontSize: size, lineHeight: Math.round(size * 1.25) }]}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.medium, color: colors.text, textAlign: 'center' },
});

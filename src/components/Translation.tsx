import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts, tracking } from '../theme';

// The translation takes the place of the German word inside the circle, in the same style.
// Longer translations step down in size and wrap, so they stay inside the ring.
function sizeFor(text: string): number {
  if (text.length <= 12) return 36;
  if (text.length <= 18) return 30;
  if (text.length <= 28) return 24;
  return 20;
}

export function Translation({ text }: { text: string }) {
  const size = sizeFor(text);
  return (
    <Animated.Text
      entering={FadeIn.duration(280)}
      style={[styles.text, { fontSize: size, lineHeight: Math.round(size * 1.25), letterSpacing: tracking(size) }]}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.display, color: colors.text, textAlign: 'center' },
});

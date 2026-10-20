import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../theme';

// A word as a small pill (the "similar words" under the circle in Explore, the words a word often comes with on its card):
// tapping it goes to that word. Without `onPress` it is just a label.
export function WordChip({ label, onPress, accessibilityLabel }: { label: string; onPress?: () => void; accessibilityLabel?: string }) {
  if (!onPress) {
    return (
      <Pressable disabled style={styles.chip}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.chip,
  },
  pressed: { backgroundColor: colors.accent },
  text: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
});

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, fonts, radius, shadow } from '../theme';

type Props = { label: string; onPress: () => void; kind?: 'primary' | 'ghost'; disabled?: boolean };

// Chunky button: filled orange for the main action, frosted for the quieter one.
export function Button({ label, onPress, kind = 'primary', disabled }: Props) {
  const primary = kind === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, primary ? styles.textPrimary : styles.textGhost]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radius.button,
    borderWidth: 1.5,
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent, ...shadow },
  ghost: { backgroundColor: colors.surface, borderColor: colors.border },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: fonts.medium, fontSize: 16 },
  textPrimary: { color: colors.onAccent },
  textGhost: { color: colors.text },
});

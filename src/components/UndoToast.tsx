import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, fonts, radius, shadow } from '../theme';

type Props = { message: string; onUndo: () => void };

// A plate at the top of the screen: what just happened to the word, and a way to take it back.
export function UndoToast({ message, onUndo }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOut.duration(160)} style={styles.plate}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel="undo">
        <Text style={styles.undo}>undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  message: { fontFamily: fonts.regular, color: colors.text, fontSize: 14 },
  undo: { fontFamily: fonts.medium, color: colors.accent, fontSize: 14 },
});

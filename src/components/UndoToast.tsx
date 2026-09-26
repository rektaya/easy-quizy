import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, fonts } from '../theme';

type Props = { message: string; onUndo: () => void };

// A small stack of text: what just happened to the word, and below it a way to take it back.
export function UndoToast({ message, onUndo }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOut.duration(160)} style={styles.toast}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel="undo">
        <Text style={styles.undo}>undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'column', // the label above, undo below
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  message: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 13 },
  undo: { fontFamily: fonts.medium, color: colors.accent, fontSize: 13 },
});

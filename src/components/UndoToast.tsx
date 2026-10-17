import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';
import { HEADER_HEIGHT } from './TabHeader';

/** `message` is left out where there is nothing to say (the Study test): the plate then holds only "undo". */
type Props = { message?: string; onUndo: () => void };

/** Where the plate sits, measured from the top of the screen's safe area: the same on every screen that has one. */
export const UNDO_TOP = 12 + HEADER_HEIGHT + 10;
/** How far down the plate reaches (its own height included), for screens that make room for it. */
export const UNDO_BOTTOM = UNDO_TOP + 40;

/** The plate in its one place (under the first line of the screen): onboarding, Explore and Study all use this. */
export function UndoPlate({ message, onUndo }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.slot, { top: insets.top + UNDO_TOP }]}>
      <UndoToast message={message} onUndo={onUndo} />
    </View>
  );
}

// A plate at the top of the screen: what just happened to the word, and a way to take it back.
export function UndoToast({ message, onUndo }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOut.duration(160)} style={styles.plate}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable onPress={onUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel="undo">
        <Text style={styles.undo}>undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
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

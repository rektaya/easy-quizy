import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DONT_KNOW } from '../circle/geometry';
import { colors } from '../theme';
import { XIcon } from './Icons';

export { DONT_KNOW };

/** Where the cross goes: in the circle, right under the word (the article, when there is one, adds a line). */
export function dontKnowTop(circleTop: number, size: number, hasArticle: boolean): number {
  return circleTop + size / 2 + (hasArticle ? 36 : 22) + 12;
}

// A small cross in the circle, right under the word: for a word you do not know at all, so there is no need to draw
// a circle for it (the ring then draws itself, in dark blue). It is there only while the word is still to be rated: it fades
// in and out with `visible` and stays mounted (a view that is taken away while it fades can jump to another place for a moment).
export function DontKnowButton({ top, onPress, visible = true }: { top: number; onPress: () => void; visible?: boolean }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? 260 : 140 });
  }, [visible, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.wrap, { top }, fade]} pointerEvents={visible ? 'box-none' : 'none'}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="i don’t know this word at all" hitSlop={10} style={styles.button}>
        <XIcon color={colors.textSecondary} size={20} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

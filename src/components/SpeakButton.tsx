import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { speak, stopSpeaking } from '../audio/speak';
import type { Word } from '../data/words';
import { colors } from '../theme';
import { SpeakerIcon } from './Icons';

/**
 * Where the loudspeaker goes: in the circle, above the word, always in the same place: before and after the word is rated,
 * for every word: just clear of the article above a noun (the highest the word block reaches), and of a translation of up to
 * two lines, which takes the word's place once the word is rated.
 */
export function speakTop(circleTop: number, size: number): number {
  return circleTop + size / 2 - 36 - 12 - 40;
}

// A small loudspeaker in the circle, above the word, in the same quiet style as the cross under it: it says the German
// word aloud (with the voice of the phone). It stops when the word changes. It is always there and fades in and out with
// `visible` (a view that is taken away while it fades can jump to another place for a moment).
export function SpeakButton({ word, top, visible = true }: { word: Word; top: number; visible?: boolean }) {
  useEffect(() => stopSpeaking, [word.id]);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? 260 : 140 });
  }, [visible, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.wrap, { top }, fade]} pointerEvents={visible ? 'box-none' : 'none'}>
      <Pressable onPress={() => speak(word)} accessibilityRole="button" accessibilityLabel={`hear ${word.lemma}`} hitSlop={10} style={styles.button}>
        <SpeakerIcon color={colors.textSecondary} size={20} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { speak, stopSpeaking } from '../audio/speak';
import type { Word } from '../data/words';
import { colors } from '../theme';
import { SpeakerIcon } from './Icons';

/**
 * Where the loudspeaker goes: in the circle, right above the word, as far above it as the cross is below it (the article, when
 * there is one, adds a line). Once the word is rated its translation, which may take two or three lines, is in the circle
 * instead, so the icon sits a little higher.
 */
export function speakTop(circleTop: number, size: number, hasArticle: boolean, rated = false): number {
  const halfWord = rated ? 52 : hasArticle ? 36 : 22;
  return circleTop + size / 2 - halfWord - 12 - 40;
}

// A small loudspeaker in the circle, above the word, in the same quiet style as the cross under it: it says the German
// word aloud (with the voice of the phone). It stops when the word changes.
export function SpeakButton({ word, top }: { word: Word; top: number }) {
  useEffect(() => stopSpeaking, [word.id]);
  return (
    <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(140)} style={[styles.wrap, { top }]} pointerEvents="box-none">
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

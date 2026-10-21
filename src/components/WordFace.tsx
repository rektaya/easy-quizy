import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Word } from '../data/words';
import { colors, fonts } from '../theme';

// The German word as it sits in the middle of the circle: article above, lemma below.
// Long words step down in size so they stay inside the ring.
export function WordFace({ word, fade = false }: { word: Word; fade?: boolean }) {
  const size = Math.min(36, Math.floor(244 / (word.lemma.length * 0.6)));
  return (
    <Animated.View entering={fade ? FadeIn.duration(220) : undefined} style={styles.wrap}>
      {word.article ? <Text style={styles.article}>{word.article}</Text> : null}
      <Text style={[styles.lemma, { fontSize: size }]} numberOfLines={1}>
        {word.lemma}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  article: { fontFamily: fonts.regular, fontSize: 18, color: colors.textSecondary, marginBottom: 4 },
  lemma: { fontFamily: fonts.medium, color: colors.text },
});

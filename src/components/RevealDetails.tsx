import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Word } from '../data/words';
import { VerbForms } from './VerbForms';
import { colors, fonts } from '../theme';
import { WordChip } from './WordChip';

type Props = {
  word: Word;
  related: Word[];
  onTravel: (id: string) => void;
};

// Sits below the circle once a word is revealed: one example sentence, then similar words.
// Every similar word is a path: tap one to travel to it.
// (Which parts show will become a setting later.)
export function RevealDetails({ word, related, onTravel }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(320).delay(120)} style={styles.wrap}>
      <VerbForms word={word} />
      {word.example.de ? (
        <View style={styles.example}>
          <Text style={styles.exampleDe}>{word.example.de}</Text>
          <Text style={styles.exampleEn}>{word.example.en}</Text>
        </View>
      ) : null}
      {related.length > 0 ? (
        <View style={styles.chips}>
          {related.map((w) => (
            <WordChip key={w.id} label={w.lemma} onPress={() => onTravel(w.id)} accessibilityLabel={`travel to ${w.lemma}`} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: 16 },
  example: { gap: 4, paddingHorizontal: 8 },
  exampleDe: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  exampleEn: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
});

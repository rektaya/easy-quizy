import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Word } from '../data/words';
import { colors, fonts, radius, shadow } from '../theme';

// The card a word is shown on: a small tag at the top (what it is: "new word", or its status), the word
// big with its article small above, the meaning, the plural, and an example at the bottom under a thin
// line. It is the "meet a new word" card in Study, and the card that opens when a word is tapped in the
// list of all words. It takes all the height it is given.
export function WordCard({ word, tag }: { word: Word; tag: string }) {
  return (
    <Animated.View key={word.id} entering={FadeIn.duration(320)} style={styles.card}>
      <Text style={styles.tag}>{tag}</Text>

      <View style={styles.word}>
        {word.article ? <Text style={styles.article}>{word.article}</Text> : null}
        <Text style={styles.lemma} numberOfLines={1} adjustsFontSizeToFit>
          {word.lemma}
        </Text>
        <Text style={styles.en}>{word.en}</Text>
        {word.plural ? <Text style={styles.plural}>plural: {word.plural}</Text> : null}
      </View>

      <View style={styles.example}>
        <Text style={styles.label}>example</Text>
        <Text style={styles.exampleDe}>{word.example.de}</Text>
        <Text style={styles.exampleEn}>{word.example.en}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    marginBottom: 8,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  // small label chip, top left
  tag: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  // the word: the article small and quiet, the lemma big, then the meaning and the plural
  word: { alignItems: 'center', gap: 6 },
  article: { fontFamily: fonts.regular, fontSize: 18, color: colors.textTertiary },
  lemma: { fontFamily: fonts.medium, fontSize: 44, lineHeight: 52, color: colors.text, textAlign: 'center' },
  en: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 30, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  plural: { fontFamily: fonts.regular, fontSize: 14, color: colors.textTertiary, marginTop: 4 },
  // the example sits at the bottom of the card, under a thin line
  example: { gap: 6, paddingTop: 18, borderTopWidth: 1.5, borderTopColor: colors.border },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  exampleDe: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.text },
  exampleEn: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EXTRA } from '../data/words.extra';
import { THEMES, WORD_BY_ID, commonness } from '../data/words';
import type { Word } from '../data/words';
import type { WordStatus } from '../onboarding/status';
import { colors, fonts, radius, shadow } from '../theme';
import { StatusRing } from './StatusRing';
import { VerbForms } from './VerbForms';
import { SpeakerIcon } from './Icons';
import { speak } from '../audio/speak';

// The card a word is shown on. Top: the theme it belongs to on the left, and its status on the right (the
// status circle and its name). Then the word big with its article small above, the meaning and the plural; what
// is useful to know about it (the words it often comes with, how common it is); and examples at the bottom.
// It is the card that opens when a word is tapped in a list of words. It takes all the height it is given and
// does not scroll (a swipe up or down goes to the next card).
export function WordCard({ word, status, fade = true }: { word: Word; status: WordStatus; fade?: boolean }) {
  const extra = EXTRA[word.id];
  const together = (extra?.together ?? []).map((id) => WORD_BY_ID.get(id)).filter((w): w is Word => !!w);
  const examples: { de: string; en: string }[] = [
    ...(word.example.de ? [word.example] : []),
    ...(extra?.examples ?? []).map(([de, en]) => ({ de, en })),
  ].slice(0, 3);
  // long words step down in size so they stay on one line (worked out from the length, not left to the phone to shrink:
  // the automatic shrinking could measure the card before it was laid out and leave the word tiny)
  const lemmaSize = Math.max(24, Math.min(44, Math.floor(290 / (word.lemma.length * 0.58))));
  const theme = THEMES.find((t) => t.id === word.theme)?.en;

  return (
    <Animated.View key={word.id} entering={fade ? FadeIn.duration(320) : undefined} style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.theme}>{theme ?? ''}</Text>
        <View style={styles.status}>
          <StatusRing status={status} size={22} />
        </View>
      </View>

      <View style={styles.word}>
        <Pressable onPress={() => speak(word)} accessibilityRole="button" accessibilityLabel={`hear ${word.lemma}`} hitSlop={10} style={styles.speak}>
          <SpeakerIcon color={colors.textSecondary} size={20} />
        </Pressable>
        {word.article ? <Text style={styles.article}>{word.article}</Text> : null}
        <Text style={[styles.lemma, { fontSize: lemmaSize, lineHeight: Math.round(lemmaSize * 1.18) }]} numberOfLines={1}>
          {word.lemma}
        </Text>
        <Text style={styles.en}>{word.en}</Text>
        <VerbForms word={word} size={16} />
        {word.plural ? <Text style={styles.plural}>plural: {word.plural}</Text> : null}
      </View>

      <View style={styles.info}>
        {together.length > 0 ? (
          <View style={styles.infoBlock}>
            <Text style={styles.label}>often together with</Text>
            <Text style={styles.together}>
              {together.map((w) => `${w.article ? w.article + ' ' : ''}${w.lemma}`).join('  ·  ')}
            </Text>
          </View>
        ) : null}
        {word.note ? (
          <View style={styles.infoBlock}>
            <Text style={styles.label}>your note</Text>
            <Text style={styles.together}>{word.note}</Text>
          </View>
        ) : null}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>how common</Text>
          <Text style={styles.common}>{commonness(word.rank)}</Text>
        </View>
      </View>

      {examples.length > 0 ? (
        <View style={styles.examples}>
          <Text style={styles.label}>{examples.length > 1 ? 'examples' : 'example'}</Text>
          {examples.map((e) => (
            <View key={e.de} style={styles.example}>
              <Text style={styles.exampleDe}>{e.de}</Text>
              <Text style={styles.exampleEn}>{e.en}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 14,
    padding: 24,
    marginBottom: 8,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  theme: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // the word: the article small and quiet, the lemma big, then the meaning and the plural
  word: { alignItems: 'center', gap: 6 },
  speak: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: -6 },
  article: { fontFamily: fonts.regular, fontSize: 18, color: colors.textTertiary },
  lemma: { fontFamily: fonts.medium, color: colors.text, textAlign: 'center', alignSelf: 'stretch' },
  en: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 30, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  plural: { fontFamily: fonts.regular, fontSize: 14, color: colors.textTertiary, marginTop: 2 },
  info: { gap: 12 },
  infoBlock: { gap: 3 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  together: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  common: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  // the examples sit at the bottom of the card, under a thin line
  examples: { gap: 8, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: colors.border },
  example: { gap: 1 },
  exampleDe: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  exampleEn: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});

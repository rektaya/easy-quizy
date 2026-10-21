import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EXTRA } from '../data/words.extra';
import { THEMES, WORD_BY_ID } from '../data/words';
import type { Word } from '../data/words';
import type { WordStatus } from '../onboarding/status';
import { colors, fonts, radius, shadow } from '../theme';
import { StatusRing } from './StatusRing';
import { VerbForms } from './VerbForms';
import { SpeakerIcon, XIcon } from './Icons';
import { speak } from '../audio/speak';
import { WordChip } from './WordChip';
import { useProfile } from '../state/profile';
import { useNavigation } from '@react-navigation/native';

// The card a word is shown on. Top: its status circle at the left and the cross that closes the card at the right.
// Then the word big with its article small and close above it, and the meaning. Under one thin line, everything
// else: a verb's forms, the plural, the words it often comes with, a note of your own, two examples, and last the topic.
// It is the card that opens when a word is tapped in a list of words. It takes all the height it is given. When
// everything fits, a swipe up or down goes to the next card or back; when there is more than fits (many examples, a verb's
// forms and a note), the card scrolls, and pulling past its top or bottom goes to the previous or next card.
const PULL = 70; // how far past the end a drag must go to move to the next card

export function WordCard({
  word,
  status,
  fade = true,
  onOverflow,
  onPull,
  onClose,
}: {
  word: Word;
  status: WordStatus;
  fade?: boolean;
  /** Told whether the card holds more than fits (so the pager leaves vertical drags to the scrolling). */
  onOverflow?: (overflows: boolean) => void;
  /** Told when the card was pulled past its end: 1 past the bottom (the next card), -1 past the top (the previous one). */
  onPull?: (dir: 1 | -1) => void;
  /** The cross at the top right of the card: closes it. */
  onClose?: () => void;
}) {
  const [box, setBox] = React.useState({ view: 0, content: 0 });
  React.useEffect(() => {
    onOverflow?.(box.view > 0 && box.content > box.view + 1);
  }, [box, onOverflow]);
  const endDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y < -PULL) onPull?.(-1);
    else if (contentOffset.y + layoutMeasurement.height - contentSize.height > PULL) onPull?.(1);
  };

  // a word it often comes with opens in the Map tab, on its topic's list of words (when it has a topic there)
  const navigation = useNavigation<{ navigate: (name: string) => void }>();
  const { setWordRequest } = useProfile();
  const openInMap = (w: Word) => {
    setWordRequest(w.id);
    navigation.navigate('Map');
  };
  const extra = EXTRA[word.id];
  const together = (extra?.together ?? []).map((id) => WORD_BY_ID.get(id)).filter((w): w is Word => !!w);
  const examples: { de: string; en: string }[] = [
    ...(word.example.de ? [word.example] : []),
    ...(extra?.examples ?? []).map(([de, en]) => ({ de, en })),
  ].slice(0, 2);
  // long words step down in size so they stay whole on one line (worked out from the length and the width of the card, not
  // left to the phone to shrink: the automatic shrinking could measure the card before it was laid out and leave the word tiny)
  const { width } = useWindowDimensions();
  const room = width - 2 * 24 - 2 * 24 - 4; // the screen less the margin of the card and its padding
  const fits = (px: number) => word.lemma.length * 0.68 * px <= room;
  const lemmaSize = fits(32) ? 32 : fits(24) ? 24 : Math.max(16, Math.floor(room / (word.lemma.length * 0.68))); // 32 when it fits, else 24, and only a very long word goes below
  const theme = THEMES.find((t) => t.id === word.theme)?.en;

  return (
    <Animated.View key={word.id} entering={fade ? FadeIn.duration(320) : undefined} style={styles.card}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={box.content > box.view + 1}
        bounces={box.content > box.view + 1}
        onLayout={(e) => setBox((b) => ({ ...b, view: e.nativeEvent.layout.height }))}
        onContentSizeChange={(_, h) => setBox((b) => ({ ...b, content: h }))}
        onScrollEndDrag={endDrag}
      >
        <View style={styles.top}>
          <StatusRing status={status} size={22} />
          {onClose ? (
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="close the card" hitSlop={10} style={styles.close}>
              <XIcon color={colors.text} size={18} />
            </Pressable>
          ) : null}
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
        </View>

        <View style={styles.below}>
          <VerbForms word={word} size={16} align="left" />
          {word.plural ? (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>plural</Text>
              <Text style={styles.together}>{word.plural}</Text>
            </View>
          ) : null}
          {together.length > 0 ? (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>often together with</Text>
              <View style={styles.chips}>
                {together.map((w) => (
                  <WordChip
                    key={w.id}
                    label={`${w.article ? w.article + ' ' : ''}${w.lemma}`}
                    onPress={w.theme ? () => openInMap(w) : undefined}
                    accessibilityLabel={`show ${w.lemma} on the map`}
                  />
                ))}
              </View>
            </View>
          ) : null}
          {word.note ? (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>your note</Text>
              <Text style={styles.together}>{word.note}</Text>
            </View>
          ) : null}
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
          {theme ? (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>topic</Text>
              <Text style={styles.together}>{theme}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // what is inside the card: it fills the card (and spreads out) when it all fits, and is taller than the card when it does not
  content: { flexGrow: 1, justifyContent: 'space-between', gap: 12, padding: 24 },
  card: {
    flex: 1,
    marginBottom: 8,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip, borderWidth: 1.5, borderColor: colors.border },
  // the word: the loudspeaker, the article small and close above the word, the lemma big, then the meaning
  word: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  speak: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: -6 },
  article: { fontFamily: fonts.regular, fontSize: 16, color: colors.textTertiary, marginBottom: -7 }, // close to the word
  lemma: { fontFamily: fonts.medium, color: colors.text, textAlign: 'center', alignSelf: 'stretch' },
  en: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 25, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  // everything but the word and its meaning sits under one thin line
  below: { gap: 12, paddingTop: 16, borderTopWidth: 1.5, borderTopColor: colors.border },
  infoBlock: { gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  together: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  examples: { gap: 8 },
  example: { gap: 2 },
  exampleDe: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  exampleEn: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});

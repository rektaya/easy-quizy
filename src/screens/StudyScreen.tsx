import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { Fireworks } from '../components/Fireworks';
import { Translation } from '../components/Translation';
import { WordFace } from '../components/WordFace';
import { WORDS } from '../data/words';
import { makeBatch } from '../onboarding/batch';
import type { Word } from '../data/words';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius, shadow } from '../theme';

// The circle sits where it does in Explore: a little above the middle of its area. It is placed
// absolutely, so nothing that appears after rating (the example, the button) can move it.
const CIRCLE_LIFT = 52;

/** A word rated above this in Study is a small win: fireworks and a buzz. */
const CELEBRATE_ABOVE = 0.75;

type Props = {
  /** Space to leave at the bottom (the floating tab bar, when there is one). */
  bottomSpace: number;
  exitLabel: string;
  onExit: () => void;
};

type Stage = 'meet' | 'test';

// A Study session: a small batch of gathered words. Each word is met first (German, meaning, an
// example), then tested with the Circle: you see the German word, recall what it means, draw how
// well you knew it, and the meaning appears. Scheduling reviews with FSRS comes next.
export default function StudyScreen({ bottomSpace, exitLabel, onExit }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready: ratingsReady, ratings } = useRatings();
  const { ready: profileReady, studied, recordStudy } = useProfile();
  const [batch, setBatch] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('meet');
  const [value, setValue] = useState<number | null>(null); // the rating of the word being tested
  const [burst, setBurst] = useState(0); // counts the fireworks shown for the current word
  const reduceMotion = useReducedMotion();
  const [body, setBody] = useState({ w: 0, h: 0 }); // the area the circle sits in

  // The batch is picked once, when the saved data has loaded (and again for "keep going").
  const loaded = ratingsReady && profileReady;
  useEffect(() => {
    if (loaded && batch === null) setBatch(makeBatch(WORDS, ratings, studied));
  }, [loaded, batch, ratings, studied]);

  if (!loaded || batch === null) return <View style={styles.screen} />;

  const word = batch[index];
  const size = Math.min(width - 48, 300);
  const circleTop = Math.max(0, body.h / 2 - size / 2 - CIRCLE_LIFT);
  const remaining = makeBatch(WORDS, ratings, studied).length;

  const next = () => {
    setValue(null);
    setBurst(0);
    setStage('meet');
    setIndex((i) => i + 1);
  };
  const keepGoing = () => {
    setBatch(null);
    setIndex(0);
    setStage('meet');
    setValue(null);
    setBurst(0);
  };

  const shell = [styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }];

  // Nothing to study, or the batch is done.
  if (!word) {
    const none = batch.length === 0;
    return (
      <View style={[...shell, styles.centered]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.closing}>
          <Text style={styles.closingTitle}>{none ? 'nothing to study yet' : 'nicely done'}</Text>
          <Text style={styles.closingBody}>
            {none
              ? 'gather a few words in explore first, then they’ll wait for you here.'
              : 'you’ve started your journey.'}
          </Text>
        </Animated.View>
        <View style={styles.buttons}>
          {!none && remaining > 0 ? <Button label="keep going" onPress={keepGoing} /> : null}
          <Button label={exitLabel} onPress={onExit} kind={!none && remaining > 0 ? 'ghost' : 'primary'} />
        </View>
      </View>
    );
  }

  const progress = (
    <Text style={styles.progress}>
      {index + 1} / {batch.length}
    </Text>
  );

  if (stage === 'meet') {
    return (
      <View style={shell}>
        {progress}
        <Animated.View key={word.id} entering={FadeIn.duration(320)} style={styles.meet}>
          <Text style={styles.meetTag}>new word</Text>

          <View style={styles.meetWord}>
            {word.article ? <Text style={styles.meetArticle}>{word.article}</Text> : null}
            <Text style={styles.meetLemma} numberOfLines={1} adjustsFontSizeToFit>
              {word.lemma}
            </Text>
            <Text style={styles.meetEn}>{word.en}</Text>
            {word.plural ? <Text style={styles.meetPlural}>plural: {word.plural}</Text> : null}
          </View>

          <View style={styles.meetExample}>
            <Text style={styles.meetLabel}>example</Text>
            <Text style={styles.exampleDe}>{word.example.de}</Text>
            <Text style={styles.exampleEn}>{word.example.en}</Text>
          </View>
        </Animated.View>
        <Button label="i’ve got it" onPress={() => setStage('test')} />
      </View>
    );
  }

  return (
    <View style={shell}>
      {progress}
      <View
        style={styles.test}
        onLayout={(e) => setBody({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {body.h > 0 ? (
          <>
            <Text style={[styles.testTag, { top: circleTop - 34 }]}>
              {value === null ? 'what does it mean? draw how well you know it' : ''}
            </Text>
            <View style={{ position: 'absolute', top: circleTop, left: (body.w - size) / 2, width: size, height: size }}>
              <Circle
                key={word.id}
                word={word}
                size={size}
                value={value}
                showHint={false}
                reveal={value === null ? undefined : <Translation text={word.en} />}
                onCommit={(v) => {
                  setValue(v);
                  recordStudy(word.id, v);
                  if (v > CELEBRATE_ABOVE) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    if (!reduceMotion) setBurst((n) => n + 1);
                  }
                }}
              />
              {burst > 0 ? <Fireworks key={burst} size={size} /> : null}
            </View>
            {value !== null ? (
              <Animated.Text
                entering={FadeIn.duration(320).delay(120)}
                style={[styles.exampleDe, styles.testExample, { top: circleTop + size + 26 }]}
              >
                {word.example.de}
              </Animated.Text>
            ) : null}
          </>
        ) : null}
      </View>
      {value !== null ? (
        <Button label={index + 1 === batch.length ? 'finish' : 'next word'} onPress={next} />
      ) : (
        <View style={styles.buttonSpace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, gap: 12, userSelect: 'none' },
  centered: { justifyContent: 'center' },
  progress: { fontFamily: fonts.medium, fontSize: 16, color: colors.textTertiary, minHeight: 32 },
  meet: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    marginBottom: 8,
    borderRadius: radius.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  // small label chip, top left
  meetTag: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  // the word: the article small and quiet, the lemma big, then the meaning and the plural
  meetWord: { alignItems: 'center', gap: 6 },
  meetArticle: { fontFamily: fonts.regular, fontSize: 18, color: colors.textTertiary },
  meetLemma: { fontFamily: fonts.medium, fontSize: 44, lineHeight: 52, color: colors.text, textAlign: 'center' },
  meetEn: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 30, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  meetPlural: { fontFamily: fonts.regular, fontSize: 14, color: colors.textTertiary, marginTop: 4 },
  // the example sits at the bottom of the card, under a thin line
  meetExample: { gap: 6, paddingTop: 18, borderTopWidth: 1.5, borderTopColor: colors.bg },
  meetLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
  exampleDe: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.text },
  exampleEn: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  test: { flex: 1 },
  testTag: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  testExample: { position: 'absolute', left: 4, right: 4, textAlign: 'center' },
  buttonSpace: { height: 54 },
  closing: { alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  closingTitle: { fontFamily: fonts.medium, fontSize: 26, color: colors.text },
  closingBody: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', gap: 12, marginTop: 28 },
});

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { Translation } from '../components/Translation';
import { WordCard } from '../components/WordCard';
import { WordFace } from '../components/WordFace';
import { WORDS } from '../data/words';
import { makeBatch, nextDue } from '../onboarding/batch';
import type { BatchItem } from '../onboarding/batch';
import { whenLabel } from '../srs/scheduler';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts } from '../theme';

// The circle sits where it does in Explore: a little above the middle of its area. It is placed
// absolutely, so nothing that appears after rating (the example, the button) can move it.
const CIRCLE_LIFT = 52;

/** A word rated above this in Study is a small win: a buzz. */
const CELEBRATE_ABOVE = 0.75;

/** How long "nicely done" stays before the user is taken on to Explore. */
const CLOSE_DELAY_MS = 2200;

type Props = {
  /** Space to leave at the bottom (the floating tab bar, when there is one). */
  bottomSpace: number;
  exitLabel: string;
  onExit: () => void;
  /**
   * Called (after a beat) when a session has been finished and there is nothing left to study: Study has
   * closed, and the user is taken on to Explore. Not called when the screen is simply opened with nothing to do.
   */
  onClosed?: () => void;
};

// Calls `onClosed` a beat after it appears, unless it goes away first (the user pressed something).
function CloseTimer({ onClosed }: { onClosed: () => void }) {
  const latest = useRef(onClosed);
  latest.current = onClosed;
  useEffect(() => {
    const t = setTimeout(() => latest.current(), CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);
  return null;
}

// A Study session: the reviews that are due, then a few new words from the pile. A new word is met
// first (German, meaning, an example); every word is then tested with the Circle: you see the German
// word, recall what it means, draw how well you knew it, and the meaning appears. Each rating goes to
// FSRS, which decides when the word comes back.
export default function StudyScreen({ bottomSpace, exitLabel, onExit, onClosed }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready: ratingsReady, ratings } = useRatings();
  const { ready: profileReady, cards, reviewWord } = useProfile();
  const [batch, setBatch] = useState<BatchItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [metCount, setMetCount] = useState(0); // how many of the new words have been met (their cards seen)
  const [value, setValue] = useState<number | null>(null); // the rating of the word being tested
  const [body, setBody] = useState({ w: 0, h: 0 }); // the area the circle sits in

  // The batch is picked once, when the saved data has loaded (and again for "keep going").
  const loaded = ratingsReady && profileReady;
  useEffect(() => {
    if (loaded && batch === null) setBatch(makeBatch(WORDS, ratings, cards, Date.now()));
  }, [loaded, batch, ratings, cards]);

  if (!loaded || batch === null) return <View style={styles.screen} />;

  // A session goes in two parts: first the new words, one card after another (to learn them), then every
  // word of the session, the new ones included, in the Circle (to test them). Reviews have no card.
  const newItems = batch.filter((i) => i.isNew);
  const meeting = metCount < newItems.length;
  const item = meeting ? newItems[metCount] : batch[index];
  const word = item?.word;
  const stage = meeting ? 'meet' : 'test';
  const size = Math.min(width - 48, 300);
  const circleTop = Math.max(0, body.h / 2 - size / 2 - CIRCLE_LIFT);
  const remaining = makeBatch(WORDS, ratings, cards, Date.now()).length;
  const upcoming = nextDue(WORDS, ratings, cards);


  const next = () => {
    setValue(null);
    setIndex((i) => i + 1);
  };
  const keepGoing = () => {
    setBatch(null);
    setIndex(0);
    setMetCount(0);
    setValue(null);
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
              ? upcoming !== null
                ? `you’re all caught up. next review ${whenLabel(upcoming, Date.now())}.`
                : 'gather a few words in explore first, then they’ll wait for you here.'
              : 'you’ve started your journey.'}
          </Text>
          {!none && upcoming !== null && remaining === 0 ? (
            <Text style={styles.closingBody}>next review {whenLabel(upcoming, Date.now())}.</Text>
          ) : null}
          {/* a finished session with nothing left to study closes Study: on to Explore after a beat */}
          {!none && remaining === 0 && onClosed ? <CloseTimer onClosed={onClosed} /> : null}
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
      {meeting ? `new words · ${metCount + 1} / ${newItems.length}` : `${index + 1} / ${batch.length}`}
    </Text>
  );

  if (stage === 'meet') {
    return (
      <View style={shell}>
        {progress}
        <WordCard word={word} tag="new word" />
        <Button label={metCount + 1 < newItems.length ? 'next word' : 'test me'} onPress={() => setMetCount((n) => n + 1)} />
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
                  reviewWord(word.id, v, ratings[word.id]);
                  if (v > CELEBRATE_ABOVE) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  }
                }}
              />
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
  screen: { flex: 1, paddingHorizontal: 24, gap: 12, userSelect: 'none' },
  centered: { justifyContent: 'center' },
  progress: { fontFamily: fonts.medium, fontSize: 16, color: colors.textTertiary, minHeight: 32 },
  exampleDe: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.text },
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

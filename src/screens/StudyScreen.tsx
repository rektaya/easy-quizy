import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { SwipeUpIcon } from '../components/Icons';
import { Translation } from '../components/Translation';
import { WordCard } from '../components/WordCard';
import { WordFace } from '../components/WordFace';
import { WORDS } from '../data/words';
import { makeBatch, nextDue, waitingWords } from '../onboarding/batch';
import { MIN_PILE_TO_STUDY } from '../onboarding/calibration';
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

/** Swiping up moves on after a rating, as in Explore: how far, or how fast, a swipe must go. */
const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 700;
const GLIDE_OUT = 260;
/** The "swipe up" tip is shown for the first words ever studied. */
const EARLY_WORDS = 3;

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
  /**
   * Changes each time the tab is opened. A session is picked once, so without this the tab would keep
   * showing "nothing to study" (or a finished session) while words gathered in Explore wait unseen.
   * A session that is under way is left alone.
   */
  focusTick?: number;
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
export default function StudyScreen({ bottomSpace, exitLabel, onExit, onClosed, focusTick }: Props) {
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

  // Moving on after a rating is a swipe up, the same motion as in Explore: the word follows the finger,
  // glides away, and the next one rises in from below.
  const goNext = useCallback(() => {
    setValue(null);
    setIndex((i) => i + 1);
  }, []);
  const gy = useSharedValue(0);
  const leave = useSharedValue(0);
  const arrive = useSharedValue(1);
  useEffect(() => {
    gy.value = 0;
    leave.value = 0;
    arrive.value = 0;
    arrive.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
  }, [index, gy, leave, arrive]);
  const swipe = Gesture.Pan()
    .enabled(value !== null)
    .activeOffsetY([-12, 12])
    .failOffsetX([-40, 40])
    .onUpdate((e) => {
      'worklet';
      gy.value = Math.min(0, e.translationY);
      leave.value = Math.min(1, -gy.value / GLIDE_OUT);
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY < -SWIPE_DISTANCE || e.velocityY < -SWIPE_VELOCITY) {
        const timing = { duration: 220, easing: Easing.in(Easing.cubic) };
        gy.value = withTiming(-GLIDE_OUT, timing);
        leave.value = withTiming(1, timing, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(goNext);
        });
      } else {
        gy.value = withSpring(0, { damping: 18, stiffness: 220 });
        leave.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });
  const stageStyle = useAnimatedStyle(() => ({
    opacity: (1 - leave.value) * arrive.value,
    transform: [
      { translateY: gy.value + (1 - arrive.value) * 140 },
      { scale: (1 - 0.12 * leave.value) * (0.9 + 0.1 * arrive.value) },
    ],
  }));

  useEffect(() => {
    if (focusTick === undefined || batch === null) return;
    const underWay = batch.length > 0 && index < batch.length && (metCount > 0 || index > 0);
    if (underWay) return;
    setBatch(null);
    setIndex(0);
    setMetCount(0);
    setValue(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  if (!loaded || batch === null) return <View style={styles.screen} />;

  // A session goes in two parts: first the new words, one card after another (to learn them), then every
  // word of the session, the new ones included, in the Circle (to test them). Reviews have no card.
  const newItems = batch.filter((i) => i.isNew);
  const meeting = metCount < newItems.length;
  const item = meeting ? newItems[metCount] : batch[index];
  const word = item?.word;
  const stage = meeting ? 'meet' : 'test';
  const size = Math.min(width - 48, 320); // as big as in Explore, so drawing feels the same
  const circleTop = Math.max(0, body.h / 2 - size / 2 - CIRCLE_LIFT);
  const remaining = makeBatch(WORDS, ratings, cards, Date.now()).length;
  const upcoming = nextDue(WORDS, ratings, cards);
  const waiting = waitingWords(WORDS, ratings, cards).length;


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
                : waiting > 0
                  ? `${waiting} of ${MIN_PILE_TO_STUDY} words gathered. rate a few more in explore and they’ll wait for you here.`
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
          <GestureDetector gesture={swipe}>
            <Animated.View
              style={[StyleSheet.absoluteFill, stageStyle]}
              accessible={value !== null}
              accessibilityLabel={value !== null ? 'swipe up or use the action to move to the next word' : undefined}
              accessibilityActions={value !== null ? [{ name: 'activate', label: 'next word' }] : []}
              onAccessibilityAction={goNext}
            >
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
              <Animated.View
                entering={FadeIn.duration(320).delay(120)}
                style={[styles.testExample, { top: circleTop + size + 26 }]}
              >
                <Text style={[styles.exampleDe, styles.exampleText]}>{word.example.de}</Text>
                <Text style={[styles.exampleEn, styles.exampleText]}>{word.example.en}</Text>
              </Animated.View>
            ) : null}
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
      {value !== null && Object.keys(cards).length <= EARLY_WORDS ? (
        <View style={[styles.buttonSpace, styles.swipeTip]}>
          <SwipeUpIcon color={colors.text} size={26} />
          <Text style={styles.swipeTipText}>{index + 1 === batch.length ? 'swipe up to finish' : 'swipe up for the next word'}</Text>
        </View>
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
  testExample: { position: 'absolute', left: 4, right: 4, gap: 6 },
  exampleText: { textAlign: 'center' },
  exampleEn: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  buttonSpace: { height: 54 },
  swipeTip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  swipeTipText: { fontFamily: fonts.medium, fontSize: 17, color: colors.text },
  closing: { alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  closingTitle: { fontFamily: fonts.medium, fontSize: 26, color: colors.text },
  closingBody: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', gap: 12, marginTop: 28 },
});

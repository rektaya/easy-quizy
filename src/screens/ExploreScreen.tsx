import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { Ring } from '../components/Ring';
import { HEADER_HEIGHT, TabHeader } from '../components/TabHeader';
import { SwipeUpIcon, TapIcon } from '../components/Icons';
import { RevealDetails } from '../components/RevealDetails';
import { UndoToast } from '../components/UndoToast';
import { FlipReveal } from '../components/FlipReveal';
import { WORDS } from '../data/words';
import type { Word } from '../data/words';
import { EXPLORE_LOCK_AT, waitingWords } from '../onboarding/batch';
import {
  CALIBRATION_WORDS,
  exploreChips,
  isCalibrationDone,
  pickCalibrationWord,
  pickExploreWord,
  pickThemeWord,
} from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { colors, fonts, radius, shadow } from '../theme';

const CLOSE_DELAY_MS = 1800; // how long the last word of a full pile lingers before the user is taken to Study
const STATUS_MS = 4000; // how long the "added to study" label (and its undo) stays
/** The written tips (how to draw, how to move on) are shown for this many first words. */
const EARLY_WORDS = 3;
const SWIPE_DISTANCE = 90; // how far up a swipe must travel to move on
const SWIPE_VELOCITY = 700;
const GLIDE_OUT = 260;

// The circle sits a little above the middle of the screen, leaving room below it for the
// example sentence and the similar words.
const CIRCLE_LIFT = 52;

// The one-time tips under the circle: a tap icon beside "tap", a swipe icon beside "swipe up".
function TravelHint({ tapText, swipeText }: { tapText?: string; swipeText: string }) {
  return (
    <View style={styles.travelHint}>
      {tapText ? (
        <View style={styles.hintPart}>
          <TapIcon color={colors.textSecondary} size={20} />
          <Text style={styles.hintText}>{tapText}</Text>
        </View>
      ) : null}
      <View style={styles.hintPart}>
        <SwipeUpIcon color={colors.textSecondary} size={20} />
        <Text style={styles.hintText}>{swipeText}</Text>
      </View>
    </View>
  );
}

type Props = {
  /** 'calibration' is the first-run mode: 15 adaptively picked words, then on to Study. */
  mode?: 'explore' | 'calibration';
  onCalibrationDone?: () => void;
};

// The tab. When too many gathered words are waiting, Explore pauses until some are learned.
export default function ExploreScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const waiting = waitingWords(WORDS, ratings, cards).length;
  const over = waiting >= EXPLORE_LOCK_AT;
  // When the word that fills the pile is rated, Explore closes: after a beat (so the rating's animation
  // is not cut off) the user is taken to Study, which is what is open. Coming to Explore while it is
  // already closed just shows the "paused" screen.
  const [showLocked, setShowLocked] = useState(over);
  const wasOver = useRef(over);
  useEffect(() => {
    if (!over) {
      wasOver.current = false;
      setShowLocked(false);
      return;
    }
    if (wasOver.current) return;
    wasOver.current = true;
    const t = setTimeout(() => {
      setShowLocked(true);
      navigation.navigate('Study');
    }, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);
  if (over && showLocked) return <ExploreLocked waiting={waiting} onStudy={() => navigation.navigate('Study')} />;
  return <ExploreView />;
}

function ExploreLocked({ waiting, onStudy }: { waiting: number; onStudy: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: useTabBarSpace() }]}>
      <TabHeader title="explore" />
      <View style={styles.locked}>
        <Text style={styles.emptyTitle}>explore is paused</Text>
        <Text style={styles.emptyBody}>
          {waiting} words are waiting for you in study. learn some of them first, then explore opens again.
        </Text>
        <View style={styles.lockedButton}>
          <Button label="go to study" onPress={onStudy} />
        </View>
      </View>
    </View>
  );
}

export function ExploreView({ mode = 'explore', onCalibrationDone }: Props) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { ready, ratings, pileCount, rate, unrate, reset } = useRatings();
  const { answers, removed, cards, seedTheme, setSeedTheme, addAnswer, removeAnswer } = useProfile();
  // how many gathered words are waiting to be studied: at EXPLORE_LOCK_AT, Explore pauses
  const waiting = waitingWords(WORDS, ratings, cards).length;
  const calibrating = mode === 'calibration';
  // words that were rated, or deleted from the pile, are never offered again
  // (the first word, Feierabend, was the practice word on its own screen, so the test starts after it)
  const isRated = useCallback(
    (id: string) => !!ratings[id] || !!removed[id] || (calibrating && id === WORDS[0].id),
    [ratings, removed, calibrating],
  );
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null); // "added to study" / "marked as known"
  const [body, setBody] = useState({ w: 0, h: 0 });
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // How the current word leaves: it glides up (gy) and fades as `leave` goes 0 -> 1.
  const gy = useSharedValue(0);
  const leave = useSharedValue(0);
  // How the next word arrives: it rises in from below and grows into place as `arrive` goes 0 -> 1.
  const arrive = useSharedValue(0);

  const clearStatus = useCallback(() => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = null;
    setStatus(null);
  }, []);

  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
  }, []);

  // Pick the first word once the saved ratings are loaded (or after a reset).
  useEffect(() => {
    if (!ready || currentId !== null) return;
    const first = calibrating
      ? pickCalibrationWord(WORDS, isRated, answers, null)
      : pickExploreWord(WORDS, isRated, answers, null);
    setCurrentId(first?.id ?? null);
  }, [ready, currentId, calibrating, isRated, answers]);

  // When a new word lands, it rises into place.
  useEffect(() => {
    gy.value = 0;
    leave.value = 0;
    arrive.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
  }, [currentId, gy, leave, arrive]);

  const word = WORDS.find((w) => w.id === currentId) ?? null;
  const rating = word ? ratings[word.id] : undefined;
  const revealed = rating !== undefined;

  const size = Math.min(width - 48, 320);
  // The swipe-up tip is shown for the first few words only. (The drawing is taught on the practice screen.)
  // When the last test word has been rated, one more swipe up leads on to the "got it" screen.
  const testDone = calibrating && revealed && isCalibrationDone(answers.length, pileCount);
  const ratedCount = Object.keys(ratings).length;
  const showSwipeTip = revealed && (ratedCount <= EARLY_WORDS || testDone);

  const circleTop = Math.max(56, body.h / 2 - size / 2 - CIRCLE_LIFT); // 56: room for the undo plate above
  const circleLeft = (body.w - size) / 2;

  const onCommit = useCallback(
    (value: number) => {
      if (!word) return;
      rate(word.id, value);
      addAnswer({ id: word.id, tier: word.tier, value }); // every rating refines the level estimate
      const known = value >= 0.9;
      setStatus(known ? 'marked as known' : 'added to study');
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(clearStatus, STATUS_MS);
    },
    [word, rate, addAnswer, clearStatus],
  );

  const onUndo = useCallback(() => {
    if (word) {
      unrate(word.id);
      removeAnswer(word.id);
    }
    clearStatus();
  }, [word, unrate, removeAnswer, clearStatus]);

  // Swap to another word: it starts hidden, below, and small, then rises into place.
  const swapTo = useCallback(
    (id: string | null) => {
      arrive.value = 0;
      setCurrentId(id);
    },
    [arrive],
  );

  // "Explore from here" on the Map: start on a word of that theme, near the user's level.
  useEffect(() => {
    if (!seedTheme || !ready) return;
    const start = pickThemeWord(WORDS, isRated, answers, seedTheme);
    setSeedTheme(null);
    if (start) {
      clearStatus();
      swapTo(start.id);
    }
  }, [seedTheme, ready, isRated, answers, setSeedTheme, clearStatus, swapTo]);

  // Swiping up: glide on to the current word's next association.
  const moveOn = useCallback(() => {
    if (!word) return;
    clearStatus();
    if (testDone) {
      onCalibrationDone?.();
      return;
    }
    const next = calibrating
      ? pickCalibrationWord(WORDS, isRated, answers, word)
      : pickExploreWord(WORDS, isRated, answers, word);
    swapTo(next?.id ?? null);
  }, [word, testDone, onCalibrationDone, calibrating, isRated, answers, clearStatus, swapTo]);

  // Tapping a similar word: the very same glide as swiping up, but to the word you chose.
  const travel = useCallback(
    (id: string) => {
      clearStatus();
      const timing = { duration: 220, easing: Easing.in(Easing.cubic) };
      gy.value = withTiming(-GLIDE_OUT, timing);
      leave.value = withTiming(1, timing, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(swapTo, id);
      });
    },
    [clearStatus, gy, leave, swapTo],
  );

  const onReset = useCallback(() => {
    clearStatus();
    reset();
    setCurrentId(null);
  }, [reset, clearStatus]);

  // Swipe up to drift on: the word follows the finger, then glides away.
  const swipe = Gesture.Pan()
    .enabled(revealed)
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
          if (finished) scheduleOnRN(moveOn);
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

  // Words you have already rated are not offered again.
  // Similar words: only ones near the user's level. None during calibration, where they would keep
  // the words in one thematic zone.
  const related = calibrating ? [] : exploreChips(word, WORDS, isRated, answers);

  // Inside the circle after rating: the translation, centred exactly where the German word was; tap it
  // to flip to the German word and back.
  const revealInside = word ? <FlipReveal word={word} /> : null;

  const counter = (
    <View
      style={styles.counterWrap}
      accessible
      accessibilityLabel={
        calibrating
          ? `word ${Math.min(answers.length + 1, CALIBRATION_WORDS)} of ${CALIBRATION_WORDS}`
          : `${waiting} of ${EXPLORE_LOCK_AT} words waiting for study. explore pauses at ${EXPLORE_LOCK_AT}`
      }
    >
      <Ring
        size={18}
        stroke={3}
        segments={[{ value: calibrating ? Math.min(answers.length, CALIBRATION_WORDS) : waiting, color: colors.textSecondary }]}
        total={calibrating ? CALIBRATION_WORDS : EXPLORE_LOCK_AT}
      />
      <Text style={styles.counter}>
        {calibrating
          ? `${Math.min(answers.length, CALIBRATION_WORDS)} / ${CALIBRATION_WORDS}`
          : `${waiting} / ${EXPLORE_LOCK_AT}`}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: calibrating ? insets.bottom + 12 : tabSpace },
      ]}
    >
      <TabHeader title={calibrating ? undefined : 'explore'} right={counter} />

      <View
        style={styles.body}
        onLayout={(e) => setBody({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {!ready || body.h === 0 ? null : word ? (
          <GestureDetector gesture={swipe}>
            <Animated.View
              style={[StyleSheet.absoluteFill, stageStyle]}
              accessible={revealed}
              accessibilityLabel={revealed ? 'swipe up or use the action to move to the next word' : undefined}
              accessibilityActions={revealed ? [{ name: 'activate', label: 'next word' }] : []}
              onAccessibilityAction={moveOn}
            >
              <View key={word.id} style={StyleSheet.absoluteFill}>
                <Circle
                  x={circleLeft}
                  y={circleTop}
                  word={word}
                  size={size}
                  value={rating?.value ?? null}
                  showHint={false}
                  reveal={revealed ? revealInside : undefined}
                  onCommit={onCommit}
                />

                {revealed ? (
                  <View style={[styles.details, { top: circleTop + size + 26 }]}>
                    <RevealDetails word={word} related={related} onTravel={travel} />
                  </View>
                ) : null}

                {showSwipeTip ? (
                  <View style={styles.hintBottom}>
                    {calibrating ? (
                      <TravelHint swipeText={testDone ? 'swipe up to continue' : 'swipe up for the next word'} />
                    ) : (
                      <TravelHint tapText="tap a word to travel," swipeText="or swipe up" />
                    )}
                  </View>
                ) : null}
              </View>
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>that’s all the sample words</Text>
            <Text style={styles.emptyBody}>
              {pileCount} waiting in your pile. the full dataset comes later.
            </Text>
            <Pressable onPress={onReset} style={styles.ghostButton} accessibilityRole="button">
              <Text style={styles.ghostButtonText}>start over</Text>
            </Pressable>
          </View>
        )}
      </View>

      {status ? (
        <View pointerEvents="box-none" style={[styles.statusTop, { top: insets.top + 12 + HEADER_HEIGHT + 10 }]}>
          <UndoToast message={status} onUndo={onUndo} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    userSelect: 'none',
  },
  counterWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  counter: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  // the body steps out of the screen's side padding, so drawing and swiping work edge to edge
  body: { flex: 1, marginHorizontal: -24 },
  details: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24 },
  hintBottom: { position: 'absolute', left: 28, right: 28, bottom: 48, alignItems: 'center' },
  travelHint: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 8, rowGap: 6 },
  hintPart: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hintText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  lockedButton: { alignSelf: 'stretch', marginTop: 18 },
  // covers the whole circle; the word sits in the middle of it
  statusTop: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.medium, fontSize: 18, color: colors.text },
  emptyBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  ghostButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow,
  },
  ghostButtonText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});

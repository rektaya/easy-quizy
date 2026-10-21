import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { adjustCeiling } from '../circle/geometry';
import { Button } from '../components/Button';
import { DONT_KNOW, DontKnowButton, dontKnowTop } from '../components/DontKnowButton';
import { SpeakButton, speakTop } from '../components/SpeakButton';
import { Ring } from '../components/Ring';
import { HEADER_HEIGHT, TabHeader } from '../components/TabHeader';
import { SwipeUpIcon, TapIcon } from '../components/Icons';
import { RevealDetails } from '../components/RevealDetails';
import { RatingBadge } from '../components/RatingBadge';
import { AdjustHint, HINT_GAP } from '../components/AdjustHint';
import { ExploreMenus, ExploreTitle } from '../components/ExploreControls';
import type { Anchors, Menu } from '../components/ExploreControls';
import { FlipReveal } from '../components/FlipReveal';
import { WORDS } from '../data/words';
import type { Word } from '../data/words';
import {
  CALIBRATION_WORDS,
  isCalibrationDone,
  pickCalibrationWord,
  pickThemeWord,
} from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { feedChips, fitsFeed, pickFeedWord } from '../onboarding/feed';
import type { FeedOptions } from '../onboarding/feed';
import { useRatings } from '../state/ratings';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { colors, fonts, radius, shadow } from '../theme';

const CLOSE_DELAY_MS = 1800; // how long the last word of a full pile lingers before the user is taken to Study
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

// The tab: an endless feed. There is no limit on how many words can be explored; the gathered ones wait in
// Study, to be studied at any time.
export default function ExploreScreen() {
  return <ExploreView />;
}

export function ExploreView({ mode = 'explore', onCalibrationDone }: Props) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { ready, ratings, pileCount, rate, adjustRating, reset } = useRatings();
  const { answers, removed, cards, seedTheme, setSeedTheme, addAnswer, explore, setExplore, interests } = useProfile();
  const [menu, setMenu] = useState<Menu>(null); // which of the selects' and the filter menus is open
  const [anchors, setAnchors] = useState<Anchors>({}); // where each select sits in the title (its menu opens under it)
  // how the next word is chosen (the settings of "explore by ..." and its filters, and the liked themes)
  const feed = useMemo<FeedOptions>(
    () => ({ by: explore.by, theme: explore.theme, level: explore.level, pos: explore.pos, interests }),
    [explore.by, explore.theme, explore.level, explore.pos, interests],
  );
  const calibrating = mode === 'calibration';
  const byTheme = !calibrating && explore.by === 'theme'; // the topic select gets a second row
  // words that were rated, or deleted from the pile, are never offered again
  // (the first word, Feierabend, was the practice word on its own screen, so the test starts after it)
  const isRated = useCallback(
    (id: string) => !!ratings[id] || !!removed[id] || (calibrating && id === WORDS[0].id),
    [ratings, removed, calibrating],
  );
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null); // the answer while its handle is being dragged
  const [body, setBody] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState(false); // the cross goes away while a circle is being drawn
  const [german, setGerman] = useState(false); // after rating: the German word is showing in the circle (the loudspeaker is only there then)

  // How the current word leaves: it glides up (gy) and fades as `leave` goes 0 -> 1.
  const gy = useSharedValue(0);
  const leave = useSharedValue(0);
  // How the next word arrives: it rises in from below and grows into place as `arrive` goes 0 -> 1.
  const arrive = useSharedValue(0);
  // 1 while the handle on the ring is held: a drag of the handle is not a swipe to the next word
  const handleHeld = useSharedValue(0);

  // Pick the first word once the saved ratings are loaded (or after a reset).
  useEffect(() => {
    if (!ready || currentId !== null) return;
    const first = calibrating
      ? pickCalibrationWord(WORDS, isRated, answers, null)
      : pickFeedWord(WORDS, isRated, answers, null, feed);
    setCurrentId(first?.id ?? null);
  }, [ready, currentId, calibrating, isRated, answers, feed]);

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
  const showSwipeTip = revealed && ratedCount <= EARLY_WORDS; // (not on the last test word: one more swipe still leads on)

  const circleTop = Math.max(56, body.h / 2 - size / 2 - CIRCLE_LIFT); // 56: room for the undo plate above
  const circleLeft = (body.w - size) / 2;

  const onCommit = useCallback(
    (value: number) => {
      if (!word) return;
      rate(word.id, value);
      addAnswer({ id: word.id, tier: word.tier, value }); // every rating refines the level estimate
    },
    [word, rate, addAnswer],
  );

  // After the meaning is shown the answer can be changed with the handle on the ring: the badge follows it, and when
  // the finger lets go the new answer is the one that counts (the first one stays saved as the confidence).
  const onAdjust = useCallback(
    (value: number, final: boolean) => {
      if (!word) return;
      if (!final) {
        setPreview(value);
        return;
      }
      setPreview(null);
      adjustRating(word.id, value);
      addAnswer({ id: word.id, tier: word.tier, value });
    },
    [word, adjustRating, addAnswer],
  );

  // Swap to another word: it starts hidden, below, and small, then rises into place.
  const swapTo = useCallback(
    (id: string | null) => {
      arrive.value = 0;
      setCurrentId(id);
    },
    [arrive],
  );

  // When the way of exploring or a filter changes, the word on screen follows: a word that has not been
  // rated yet and does not suit the new settings glides away and one that does takes its place. (A word the
  // user has just rated is left alone; the next word follows the new settings.)
  const lastFeed = useRef(feed);
  useEffect(() => {
    const before = lastFeed.current;
    lastFeed.current = feed;
    const changed = before.by !== feed.by || before.theme !== feed.theme || before.level !== feed.level || before.pos !== feed.pos;
    if (!changed || calibrating || !ready || !currentId) return;
    const onScreen = WORDS.find((w) => w.id === currentId);
    if (!onScreen || ratings[onScreen.id]) return;
    if (fitsFeed(onScreen, WORDS, isRated, answers, feed)) return;
    const next = pickFeedWord(WORDS, (id) => isRated(id) || id === onScreen.id, answers, onScreen, feed);
    if (next) travel(next.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed]);

  // "Explore from here" on the Map: start on a word of that theme, near the user's level.
  useEffect(() => {
    if (!seedTheme || !ready) return;
    const start = pickThemeWord(WORDS, isRated, answers, seedTheme);
    setSeedTheme(null);
    setExplore({ by: 'theme', theme: seedTheme }); // "explore from here" on the Map: stay in that theme
    if (start) {
      swapTo(start.id);
    }
  }, [seedTheme, ready, isRated, answers, setSeedTheme, setExplore, swapTo]);

  // Swiping up: glide on to the current word's next association.
  const moveOn = useCallback(() => {
    if (!word) return;
    setPreview(null);
    if (testDone) {
      onCalibrationDone?.();
      return;
    }
    const next = calibrating
      ? pickCalibrationWord(WORDS, isRated, answers, word)
      : pickFeedWord(WORDS, isRated, answers, word, feed);
    swapTo(next?.id ?? null);
  }, [word, testDone, onCalibrationDone, calibrating, isRated, answers, feed, swapTo]);

  // Tapping a similar word: the very same glide as swiping up, but to the word you chose.
  const travel = useCallback(
    (id: string) => {
      setPreview(null);
      const timing = { duration: 220, easing: Easing.in(Easing.cubic) };
      gy.value = withTiming(-GLIDE_OUT, timing);
      leave.value = withTiming(1, timing, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(swapTo, id);
      });
    },
    [gy, leave, swapTo],
  );

  const onReset = useCallback(() => {
    reset();
    setCurrentId(null);
  }, [reset]);

  // Swipe up to drift on: the word follows the finger, then glides away.
  const swipe = Gesture.Pan()
    .enabled(revealed)
    .activeOffsetY([-12, 12])
    .failOffsetX([-40, 40])
    .onUpdate((e) => {
      'worklet';
      if (handleHeld.value) return; // the handle is being dragged: that is not a swipe
      gy.value = Math.min(0, e.translationY);
      leave.value = Math.min(1, -gy.value / GLIDE_OUT);
    })
    .onEnd((e) => {
      'worklet';
      if (handleHeld.value) return;
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
  const related = calibrating ? [] : feedChips(word, WORDS, isRated, answers, feed);

  // Inside the circle after rating: the translation, centred exactly where the German word was; tap it
  // to flip to the German word and back.
  const revealInside = word ? <FlipReveal word={word} onShowing={setGerman} /> : null;

  // the counter is only for the first-run test ("3 / 15")
  const counter = (
    <View style={styles.counterWrap} accessible accessibilityLabel={`word ${Math.min(answers.length + 1, CALIBRATION_WORDS)} of ${CALIBRATION_WORDS}`}>
      <Ring size={18} stroke={3} segments={[{ value: Math.min(answers.length, CALIBRATION_WORDS), color: colors.textSecondary }]} total={CALIBRATION_WORDS} />
      <Text style={styles.counter}>{`${Math.min(answers.length, CALIBRATION_WORDS)} / ${CALIBRATION_WORDS}`}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: calibrating ? insets.bottom + 12 : tabSpace },
      ]}
    >
      <View>
        <TabHeader
          titleNode={
            calibrating ? undefined : (
              <ExploreTitle
                by={explore.by}
                theme={byTheme ? (explore.theme ?? word?.theme ?? null) : undefined}
                settings={explore}
                menu={menu}
                onMenu={setMenu}
                onAnchor={(name, rect) =>
                  setAnchors((a) => {
                    const old = a[name];
                    return old && old.x === rect.x && old.y === rect.y && old.w === rect.w && old.h === rect.h ? a : { ...a, [name]: rect };
                  })
                }
              />
            )
          }
          right={calibrating ? counter : undefined}
        />
      </View>

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
                  onDrawing={setDrawing}
                  adjust={rating ? { max: adjustCeiling(rating.confidence ?? rating.value), onAdjust, hold: handleHeld } : undefined}
                />

                <SpeakButton word={word} top={speakTop(circleTop, size)} visible={!drawing && (!revealed || german)} />
                <DontKnowButton top={dontKnowTop(circleTop, size, !!word.article)} onPress={() => onCommit(DONT_KNOW)} visible={!revealed && !drawing} />

                {revealed ? (
                  <View style={[styles.details, { top: circleTop + size + 26 }]}>
                    <RevealDetails word={word} related={related} onTravel={travel} />
                  </View>
                ) : null}

                {revealed && ratedCount <= 1 ? <AdjustHint bottom={body.h - circleTop + HINT_GAP} delay={2300} /> : null}

                {showSwipeTip ? (
                  <View style={styles.hintBottom}>
                    {calibrating ? (
                      <TravelHint swipeText="swipe up for the next word" />
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

      {calibrating ? null : (
        <ExploreMenus
          menu={menu}
          origin={insets.top + 12}
          anchors={anchors}
          settings={explore}
          onMenu={setMenu}
          onChange={setExplore}
          onPickBy={(by) => setExplore(by === 'theme' ? { by, theme: explore.theme ?? word?.theme ?? null } : { by })}
        />
      )}

      {rating ? <RatingBadge message={(preview ?? rating.value) >= 0.9 ? 'marked as known' : 'added to study'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    userSelect: 'none',
  },
  counterWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  // the body steps out of the screen's side padding, so drawing and swiping work edge to edge
  body: { flex: 1, marginHorizontal: -24 },
  details: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24 },
  hintBottom: { position: 'absolute', left: 28, right: 28, bottom: 48, alignItems: 'center', gap: 12 },
  travelHint: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 8, rowGap: 6 },
  hintPart: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lockedButton: { alignSelf: 'stretch', marginTop: 18 },
  // covers the whole circle; the word sits in the middle of it
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
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
  ghostButtonText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});

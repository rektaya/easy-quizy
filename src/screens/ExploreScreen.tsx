import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Circle } from '../circle/Circle';
import { Fireworks } from '../components/Fireworks';
import { RevealDetails } from '../components/RevealDetails';
import { Translation } from '../components/Translation';
import { UndoToast } from '../components/UndoToast';
import { WordFace } from '../components/WordFace';
import { WORDS } from '../data/words';
import type { Word } from '../data/words';
import { useRatings } from '../state/ratings';
import { TAB_BAR_SPACE, colors, fonts, radius, shadow } from '../theme';

const STATUS_MS = 4000; // how long the "added to study" label (and its undo) stays
const SWIPE_DISTANCE = 90; // how far up a swipe must travel to move on
const SWIPE_VELOCITY = 700;
const GLIDE_OUT = 260;

// The circle sits a little above the middle of the screen, leaving room below it for the
// example sentence and the similar words.
const CIRCLE_LIFT = 52;
const HEADER_HEIGHT = 32;

type Ratings = ReturnType<typeof useRatings>['ratings'];

function firstUnrated(ratings: Ratings): Word | null {
  return WORDS.find((w) => !ratings[w.id]) ?? null;
}

const wordById = (id: string) => WORDS.find((w) => w.id === id);

// Swiping on follows the current word's associations first, then falls back to the list order.
function pickNext(from: Word, ratings: Ratings): string | null {
  const nextRelated = from.related.find((id) => !ratings[id]);
  return nextRelated ?? firstUnrated(ratings)?.id ?? null;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready, ratings, pileCount, rate, unrate, reset } = useRatings();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null); // "added to study" / "marked as known"
  const [burst, setBurst] = useState<{ id: string; n: number } | null>(null); // fireworks for a known word
  const flipRef = useRef<View>(null);
  const [faceHeight, setFaceHeight] = useState(0); // height of the word in the middle of the circle
  const [showOriginal, setShowOriginal] = useState(false); // after rating: tap the word to flip to German and back
  const reduceMotion = useReducedMotion();
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
    if (ready && currentId === null) setCurrentId(firstUnrated(ratings)?.id ?? null);
  }, [ready, currentId, ratings]);

  // When a new word lands, it rises into place.
  useEffect(() => {
    gy.value = 0;
    leave.value = 0;
    arrive.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
  }, [currentId, gy, leave, arrive]);

  const word = WORDS.find((w) => w.id === currentId) ?? null;
  const rating = word ? ratings[word.id] : undefined;
  const revealed = rating !== undefined;

  // Every word starts on its translation once it has been rated.
  useEffect(() => {
    setShowOriginal(false);
  }, [currentId, revealed]);
  const size = Math.min(width - 48, 320);
  // The ghost finger and the tips teach the gestures once, on the very first word.
  const isFirstWord = word?.id === WORDS[0].id;
  const showHint = isFirstWord && !revealed;

  const circleTop = Math.max(0, body.h / 2 - size / 2 - CIRCLE_LIFT);
  const circleLeft = (body.w - size) / 2;

  const onCommit = useCallback(
    (value: number) => {
      if (!word) return;
      rate(word.id, value);
      const known = value >= 0.9;
      setStatus(known ? 'marked as known' : 'added to study');
      // knowing a word sets off fireworks (unless the phone asks for reduced motion)
      if (known && !reduceMotion) setBurst((b) => ({ id: word.id, n: (b?.n ?? 0) + 1 }));
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(clearStatus, STATUS_MS);
    },
    [word, rate, clearStatus, reduceMotion],
  );

  const onUndo = useCallback(() => {
    if (word) unrate(word.id);
    setBurst(null);
    clearStatus();
  }, [word, unrate, clearStatus]);

  // Swap to another word: it starts hidden, below, and small, then rises into place.
  const swapTo = useCallback(
    (id: string | null) => {
      arrive.value = 0;
      setCurrentId(id);
    },
    [arrive],
  );

  // Swiping up: glide on to the current word's next association.
  const moveOn = useCallback(() => {
    if (!word) return;
    clearStatus();
    swapTo(pickNext(word, ratings));
  }, [word, ratings, clearStatus, swapTo]);

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
  const related = word ? word.related.flatMap((id) => (ratings[id] ? [] : wordById(id) ?? [])) : [];

  // Tapping anywhere inside the circle flips between the translation and the original word.
  // The tap area is round like the circle, so the empty corners of its square do nothing.
  const flip = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    if (typeof pageX !== 'number' || typeof pageY !== 'number') {
      setShowOriginal((v) => !v); // an assistive-technology activation has no touch point
      return;
    }
    flipRef.current?.measureInWindow((x, y, w, h) => {
      if (Math.hypot(pageX - (x + w / 2), pageY - (y + h / 2)) <= w / 2) setShowOriginal((v) => !v);
    });
  };

  // Inside the circle after rating: the translation, centred exactly where the German word was,
  // and (for a few seconds) the status line floating just above it. The status line is positioned
  // on top of the circle, out of the layout, so it never nudges the word.
  const revealInside = word ? (
    <>
      <Pressable
        ref={flipRef}
        onPress={flip}
        accessibilityRole="button"
        accessibilityLabel={showOriginal ? 'show the translation' : 'show the original word'}
        style={styles.flipTarget}
      >
        <View style={styles.faceBox} onLayout={(e) => setFaceHeight(e.nativeEvent.layout.height)}>
          {showOriginal ? <WordFace word={word} fade /> : <Translation text={word.en} />}
        </View>
      </Pressable>
      {status ? (
        <View
          pointerEvents="box-none"
          // hangs just above the top of the word, whatever its height: about 10px of air
          style={[styles.statusFloat, { bottom: size / 2 + (faceHeight ? faceHeight / 2 - 16 : 20) }]}
        >
          <UndoToast message={status} onUndo={onUndo} />
        </View>
      ) : null}
    </>
  ) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text
          style={styles.counter}
          accessibilityLabel={`${pileCount} ${pileCount === 1 ? 'word' : 'words'} gathered`}
        >
          {pileCount}
        </Text>
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
                <View style={{ position: 'absolute', top: circleTop, left: circleLeft, width: size, height: size }}>
                  <Circle
                    word={word}
                    size={size}
                    value={rating?.value ?? null}
                    showHint={showHint}
                    reveal={revealed ? revealInside : undefined}
                    onCommit={onCommit}
                  />
                  {burst && burst.id === word.id ? <Fireworks key={burst.n} size={size} /> : null}
                </View>

                {/* The tips teach the gestures once, on the very first word, below the circle. */}
                {showHint ? (
                  <Text style={[styles.hint, { top: circleTop + size + 26 }]}>
                    start anywhere on the ring and draw around. the fuller the circle, the better you know it.
                  </Text>
                ) : null}

                {revealed ? (
                  <View style={[styles.details, { top: circleTop + size + 26 }]}>
                    <RevealDetails word={word} related={related} onTravel={travel} />
                  </View>
                ) : null}

                {revealed && isFirstWord ? (
                  <Text style={[styles.hint, styles.hintBottom]}>tap a word to travel, or swipe up</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_SPACE,
    userSelect: 'none',
  },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: HEADER_HEIGHT },
  counter: { fontFamily: fonts.medium, fontSize: 22, color: colors.accent },
  body: { flex: 1 },
  details: { position: 'absolute', left: 0, right: 0 },
  hint: {
    position: 'absolute',
    left: 4,
    right: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  hintBottom: { bottom: 8 },
  // covers the whole circle; the word sits in the middle of it
  flipTarget: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  faceBox: { paddingVertical: 14, alignItems: 'center' },
  statusFloat: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
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

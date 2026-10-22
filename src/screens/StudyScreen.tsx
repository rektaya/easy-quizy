import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/Text';
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
import { DONT_KNOW, DontKnowButton, dontKnowTop } from '../components/DontKnowButton';
import { SpeakButton, speakTop } from '../components/SpeakButton';
import { VerbForms } from '../components/VerbForms';
import { Button } from '../components/Button';
import { ReminderCard } from '../components/ReminderCard';
import { FlipReveal } from '../components/FlipReveal';
import { Ring } from '../components/Ring';
import { TabHeader } from '../components/TabHeader';
import { AdjustHint, HINT_GAP } from '../components/AdjustHint';
import { WORDS, verbForms } from '../data/words';
import { makeSession } from '../onboarding/batch';
import type { BatchItem } from '../onboarding/batch';
import type { StoredCard } from '../srs/scheduler';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts } from '../theme';

// The circle sits where it does in Explore: a little above the middle of its area. It is placed
// absolutely, so nothing that appears after rating (the example) can move it.
const CIRCLE_LIFT = 52;

/** The hint about the dot on the ring shows once, on the first word ever studied. */
const STUDY_HINT_WORDS = 1;

/** A word rated above this in Study is a small win: a buzz. */
const CELEBRATE_ABOVE = 0.75;

/** Swiping up moves on after a rating, as in Explore: how far, or how fast, a swipe must go. */
const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 700;
const GLIDE_OUT = 260;

type Props = {
  /** How many words the session holds at most (the setting). */
  size: number;
  /** Space to leave at the bottom (the floating tab bar). */
  bottomSpace: number;
  /** Back to the list of words in study. */
  onList: () => void;
};

// A Study session: the reviews that are due, then a few new words from the pile. Every word is tested
// with the Circle, laid out exactly as in Explore: you see the German word, recall what it means, draw
// how well you knew it, and the meaning appears. Each rating goes to FSRS, which decides when the word
// comes back. (The words to study are first seen as a list; tapping one there opens its card.)
export default function StudyScreen({ size: sessionSize, bottomSpace, onList }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready: ratingsReady, ratings } = useRatings();
  const { ready: profileReady, cards, reviewWord, adjustReview } = useProfile();
  const [batch, setBatch] = useState<BatchItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<number | null>(null); // the rating of the word being tested
  const [before, setBefore] = useState<StoredCard | undefined>(undefined); // the word's card as it was before this review, so an adjusted answer can redo the review
  const [drawing, setDrawing] = useState(false); // the cross goes away while a circle is being drawn
  const [german, setGerman] = useState(false); // after rating: the German word is showing in the circle (the loudspeaker is only there then)
  const [body, setBody] = useState({ w: 0, h: 0 }); // the area the circle sits in

  // The batch is picked once, when the saved data has loaded (and again for "keep going").
  const loaded = ratingsReady && profileReady;
  useEffect(() => {
    if (loaded && batch === null) setBatch(makeSession(WORDS, ratings, cards, Date.now(), sessionSize));
  }, [loaded, batch, ratings, cards, sessionSize]);

  // Moving on after a rating is a swipe up, the same motion as in Explore: the word follows the finger,
  // glides away, and the next one rises in from below.
  const goNext = useCallback(() => {
    setValue(null);
    setIndex((i) => i + 1);
  }, []);
  const gy = useSharedValue(0);
  const leave = useSharedValue(0);
  const arrive = useSharedValue(1);
  // 1 while the handle on the ring is held: a drag of the handle is not a swipe to the next word
  const handleHeld = useSharedValue(0);
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

  if (!loaded || batch === null) return <View style={styles.screen} />;

  const word = batch[index]?.word;
  const commit = (v: number) => {
    if (!word) return;
    setValue(v);
    setBefore(cards[word.id]); // so an adjusted answer can redo the review from here
    reviewWord(word.id, v, ratings[word.id]);
    if (v > CELEBRATE_ABOVE) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };
  // After the meaning is shown the answer can be changed with the handle on the ring: when the finger lets go the
  // new answer is the one the schedule uses (the first one stays saved as the confidence).
  const onAdjust = (v: number, final: boolean) => {
    if (!word || !final) return;
    setValue(v);
    adjustReview(word.id, before, v, ratings[word.id]);
  };
  const size = Math.min(width - 48, 320); // the same as in Explore, so drawing feels the same
  const circleTop = Math.max(56, body.h / 2 - size / 2 - CIRCLE_LIFT); // 56: room for the undo plate above

  const shell = [styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }];

  // The batch is done (or there was nothing to study). The closing screen is just a thank-you and the
  // reminder (the tab bar is the way on).
  if (!word) {
    const none = batch.length === 0;
    return (
      <View style={[...shell, styles.centered]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.closing}>
          <Text style={styles.closingTitle}>{none ? 'nothing to study yet' : 'nicely done!'}</Text>
          <Text style={styles.closingBody}>
            {none
              ? 'gather a few more words in explore, then they’ll wait for you here.'
              : 'the key is in daily practice, so come back to your words regularly'}
          </Text>
        </Animated.View>
        {none ? (
          <View style={styles.buttons}>
            <Button label="back to my words" onPress={onList} />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400).delay(500)} style={styles.reminder}>
            <ReminderCard />
          </Animated.View>
        )}
      </View>
    );
  }

  const counter = (
    <View style={styles.counterWrap} accessible accessibilityLabel={`word ${index + 1} of ${batch.length}`}>
      <Ring size={18} stroke={3} segments={[{ value: index, color: colors.textSecondary }]} total={batch.length} />
      <Text style={styles.counter}>{`${index + 1} / ${batch.length}`}</Text>
    </View>
  );

  return (
    <View style={shell}>
      <TabHeader title="study" right={counter} />
      <View style={styles.test} onLayout={(e) => setBody({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {body.h > 0 ? (
          <GestureDetector gesture={swipe}>
            <Animated.View
              style={[StyleSheet.absoluteFill, stageStyle]}
              accessible={value !== null}
              accessibilityLabel={value !== null ? 'swipe up or use the action to move to the next word' : undefined}
              accessibilityActions={value !== null ? [{ name: 'activate', label: 'next word' }] : []}
              onAccessibilityAction={goNext}
            >
              <Circle
                x={(body.w - size) / 2}
                y={circleTop}
                key={word.id}
                word={word}
                size={size}
                value={value}
                showHint={false}
                reveal={value === null ? undefined : <FlipReveal word={word} onShowing={setGerman} />}
                onCommit={commit}
                onDrawing={setDrawing}
                adjust={value !== null ? { max: 1, onAdjust, hold: handleHeld } : undefined}
              />
              <SpeakButton word={word} top={speakTop(circleTop, size)} visible={!drawing && (value === null || german)} />
              <DontKnowButton top={dontKnowTop(circleTop, size, !!word.article)} onPress={() => commit(DONT_KNOW)} visible={value === null && !drawing} />
              {value !== null && (word.example.de || verbForms(word)) ? (
                <Animated.View
                  entering={FadeIn.duration(320).delay(120)}
                  style={[styles.example, { top: circleTop + size + 26 }]}
                >
                  <VerbForms word={word} />
                  <Text style={[styles.exampleDe, styles.exampleText]}>{word.example.de}</Text>
                  <Text style={[styles.exampleEn, styles.exampleText]}>{word.example.en}</Text>
                </Animated.View>
              ) : null}
              {value !== null && Object.keys(cards).length <= STUDY_HINT_WORDS ? (
                <AdjustHint bottom={body.h - circleTop + HINT_GAP} />
              ) : null}
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, userSelect: 'none' },
  centered: { justifyContent: 'center' },
  test: { flex: 1, marginHorizontal: -24 }, // edge to edge, so drawing and swiping work across the whole width
  counterWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  example: { position: 'absolute', left: 28, right: 28, gap: 6 },
  exampleText: { textAlign: 'center' },
  exampleDe: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.text },
  exampleEn: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  closing: { alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  closingTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  closingBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.textSecondary, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', gap: 12, marginTop: 28 },
  reminder: { alignSelf: 'stretch', marginTop: 26 },
});

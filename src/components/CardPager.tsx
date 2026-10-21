import React, { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Word } from '../data/words';
import type { WordStatus } from '../onboarding/status';
import { colors } from '../theme';
import { WordCard } from './WordCard';

// A word's card over the list. Swipe up for the next word of the list and down for the previous one, the same
// motion as moving on in Explore and Study (the card follows the finger). The first card of a visit gives a
// small nudge upwards, to say "swipe". The way out is the cross at the top right of the card (or a tap outside it).
export function CardPager({
  words,
  startIndex,
  onClose,
  statusFor,
  top,
  bottom,
  nudged,
}: {
  words: Word[];
  startIndex: number;
  onClose: () => void;
  statusFor: (id: string) => WordStatus;
  top: number;
  bottom: number;
  nudged: React.MutableRefObject<boolean>;
}) {
  const { height } = useWindowDimensions();
  const dy = useSharedValue(0);
  // the position lives here, not in the list: moving to the next word redraws only this card, so it stays smooth
  const [index, setIndex] = useState(startIndex);
  const [overflow, setOverflow] = useState(false); // the card holds more than fits: it scrolls, and a swipe does not move it
  const hasPrev = index > 0;
  const hasNext = index < words.length - 1;

  React.useEffect(() => {
    if (nudged.current || !hasNext) return;
    nudged.current = true;
    dy.value = withDelay(550, withSequence(withTiming(-26, { duration: 220 }), withTiming(0, { duration: 320 })));
  }, [hasNext, dy, nudged]);

  // dir +1: the next word (the card leaves upwards, the next one rises from below), -1: the previous one
  const go = (dir: number) => {
    setIndex((i) => i + dir);
    // jump to the entry side and glide in, as one animation (so the order is certain)
    dy.value = withSequence(
      withTiming(dir * height * 0.3, { duration: 0 }),
      withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
  };
  const pull = (dir: 1 | -1) => {
    if ((dir === 1 && hasNext) || (dir === -1 && hasPrev)) go(dir);
  };
  const swipe = Gesture.Pan()
    .enabled(!overflow)
    .activeOffsetY([-14, 14])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      'worklet';
      const blocked = (e.translationY < 0 && !hasNext) || (e.translationY > 0 && !hasPrev);
      dy.value = blocked ? e.translationY * 0.25 : e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      const dir = e.translationY < 0 ? 1 : -1;
      const wants = Math.abs(e.translationY) > 80 || Math.abs(e.velocityY) > 650;
      if (wants && ((dir === 1 && hasNext) || (dir === -1 && hasPrev))) {
        dy.value = withTiming(-dir * height * 0.6, { duration: 170, easing: Easing.in(Easing.cubic) }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(go, dir);
        });
      } else {
        dy.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });
  const cardStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.6 * Math.min(1, Math.abs(dy.value) / (height * 0.5)),
    transform: [{ translateY: dy.value }],
  }));

  const word = words[index];
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close the card" accessibilityRole="button" />
      <View style={[styles.cardWrap, { paddingTop: top, paddingBottom: bottom }]} pointerEvents="box-none">
        <GestureDetector gesture={swipe}>
          <Animated.View style={[styles.pagerCard, cardStyle]}>
            <WordCard word={word} status={statusFor(word.id)} fade={false} onOverflow={setOverflow} onPull={pull} onClose={onClose} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.backdrop }, // solid: the list under the card must not show through
  cardWrap: { flex: 1, paddingHorizontal: 24, gap: 12 },
  pagerCard: { flex: 1 },
});

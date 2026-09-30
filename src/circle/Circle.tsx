import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { WordFace } from '../components/WordFace';
import type { Word } from '../data/words';
import { colors } from '../theme';
import { DEFAULT_START_DEG, pointOnRing } from './geometry';
import { ScreenGlow } from './ScreenGlow';
import { StardustRing } from './StardustRing';
import { RING_PAD, useRing } from './useRing';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

const GHOST_END = 0.62;

// SVG strokes start at 3 o'clock; rotate so the ghost's stroke starts at its own start angle.
const ghostRotation = { transform: [{ rotate: `${DEFAULT_START_DEG - 90}deg` }] };

type Props = {
  word: Word;
  size: number;
  /** The committed rating (0..1), or null while the word is still to be rated. */
  value: number | null;
  /** Show the ghost finger that demonstrates the gesture. */
  showHint: boolean;
  /** Shown inside the ring in place of the word (the reveal, after the user has rated). */
  reveal?: React.ReactNode;
  onCommit: (value: number) => void;
};

// The Circle. There is no visible ring: the user draws a circle round the word, and stars appear where
// the finger goes (StardustRing). Only the ghost finger on the very first word shows where to draw. The
// drawing and its haptics are in useRing; what you see is in StardustRing.
export function Circle({ word, size, value, showHint, reveal, onCommit }: Props) {
  const ring = useRing(size, value, onCommit);
  const { c, r, v } = ring;
  const length = 2 * Math.PI * r;
  const ghost = useSharedValue(0);
  // where the circle is on the screen, so that the light of a known word can cover the whole screen
  const box = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const screen = useWindowDimensions();
  // The word glides and grows into place when it arrives, so the circle is measured again once it has
  // settled, and whenever it gets its rating.
  const measure = () => box.current?.measureInWindow((x, y) => setOrigin({ x, y }));
  useEffect(() => {
    const t = setTimeout(measure, 900);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    measure();
  }, [value]);

  useEffect(() => {
    if (showHint && value === null) {
      ghost.value = withRepeat(
        withSequence(
          withDelay(900, withTiming(GHOST_END, { duration: 1600, easing: Easing.inOut(Easing.cubic) })),
          withTiming(GHOST_END, { duration: 500 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(ghost);
      ghost.value = 0;
    }
    return () => cancelAnimation(ghost);
  }, [showHint, value, ghost]);

  const ghostArcProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - ghost.value),
    opacity: ghost.value > 0.004 && !v.dragging.value ? 0.45 : 0,
  }));

  const ghostDot = useAnimatedStyle(() => {
    const p = pointOnRing(ghost.value, c, c, r);
    const fade = interpolate(ghost.value, [0, 0.03, GHOST_END - 0.08, GHOST_END], [0, 1, 1, 0]);
    return {
      opacity: v.dragging.value ? 0 : fade,
      transform: [{ translateX: p.x - 18 }, { translateY: p.y - 18 }],
    };
  });

  return (
    <GestureDetector gesture={ring.gesture}>
      <View
        ref={box}
        style={{ width: size, height: size }}
        collapsable={false}
        onLayout={measure}
      >
        {/* the light of a known word, over the whole screen (the screen's own content is drawn above it) */}
        {origin ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: -origin.x, top: -origin.y }}>
            <ScreenGlow width={screen.width} height={screen.height} cx={origin.x + c} cy={origin.y + c} burst={v.burst} />
          </View>
        ) : null}

        {/* the stars of the drawing (and the light of a known word): drawn a little beyond the circle */}
        <View pointerEvents="none" style={{ position: 'absolute', left: -RING_PAD, top: -RING_PAD }}>
          <StardustRing ring={ring} />
        </View>

        {/* the ghost finger's demonstration arc */}
        <Svg width={size} height={size} style={[StyleSheet.absoluteFill, ghostRotation]} pointerEvents="none">
          <AnimatedSvgCircle
            cx={c}
            cy={c}
            r={r}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${length} ${length}`}
            stroke="#9BC0FF"
            animatedProps={ghostArcProps}
          />
        </Svg>

        <Animated.View pointerEvents="none" style={[styles.ghostDot, ghostDot]}>
          <View style={styles.ghostDotInner} />
        </Animated.View>

        <View pointerEvents={reveal ? 'box-none' : 'none'} style={styles.center}>
          {reveal ?? <WordFace word={word} />}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  ghostDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostDotInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    opacity: 0.55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});

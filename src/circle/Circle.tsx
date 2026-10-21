import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { colors, stars } from '../theme';
import { DEFAULT_START_DEG, TAU, pointOnRing } from './geometry';
import { StardustRing } from './StardustRing';
import { emitKnown } from './knownEvents';
import { HANDLE_HIT, RING_PAD, RING_STROKE, useRing } from './useRing';
import type { AdjustOptions } from './useRing';

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
  /** Told when a drawing starts (true) and when it ends (false). */
  onDrawing?: (drawing: boolean) => void;
  /** Once rated, a handle on the ring lets the answer be changed (how far up it may go, and who is told). Left out: the rating is final. */
  adjust?: AdjustOptions;
  /** Where the circle's box sits inside the area the Circle fills (its parent, which must be positioned and cover the screen area). */
  x: number;
  y: number;
};

// The Circle. There is no visible ring: the user draws a circle round the word, and stars appear where
// the finger goes (StardustRing). Only the ghost finger on the very first word shows where to draw. The
// drawing and its haptics are in useRing; what you see is in StardustRing.
export function Circle({ word, size, value, showHint, reveal, onCommit, onDrawing, adjust, x, y }: Props) {
  // A known word lets stardust float up off the ring and out of the top of the screen (KnownDust, drawn
  // above the whole app). It starts from the circle's place on the screen, measured fresh.
  const onKnown = () => {
    box.current?.measureInWindow((bx, by) => emitKnown({ x: bx + size / 2, y: by + size / 2, r: size / 2 - RING_STROKE }));
  };
  const ring = useRing(size, value, onCommit, x, y, onKnown, onDrawing, adjust);
  const { c, r, v } = ring;
  const length = 2 * Math.PI * r;
  const ghost = useSharedValue(0);
  const box = useRef<View>(null);

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

  // where the handle's touch area sits: on the ring, at the end of the answer (it follows the handle)
  const handleBox = useAnimatedStyle(() => {
    const a = v.startRad.value + v.direction.value * v.progress.value * TAU;
    return {
      opacity: v.handle.value > 0.5 ? 1 : 0, // not there to the touch until it is there to the eye
      transform: [{ translateX: x + c + r * Math.sin(a) - HANDLE_HIT / 2 }, { translateY: y + c - r * Math.cos(a) - HANDLE_HIT / 2 }],
    };
  });

  return (
    <GestureDetector gesture={ring.gesture}>
      {/* the touch area is the whole area the Circle fills (the screen's working area), not just the circle:
          the ring is invisible, so a drawing may start anywhere round the word */}
      <View style={StyleSheet.absoluteFill} collapsable={false}>
      <View
        ref={box}
        style={{ position: 'absolute', left: x, top: y, width: size, height: size }}
        collapsable={false}
      >
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
            stroke={stars.blue}
            strokeDashoffset={length} // hidden until the animation runs: no full ring flashes on the first frame
            opacity={0}
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
      {adjust && value !== null ? (
        <GestureDetector gesture={ring.adjustGesture}>
          <Animated.View style={[styles.handleHit, handleBox]} collapsable={false} accessibilityLabel="change your answer" />
        </GestureDetector>
      ) : null}
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
  handleHit: { position: 'absolute', left: 0, top: 0, width: HANDLE_HIT, height: HANDLE_HIT, borderRadius: HANDLE_HIT / 2 },
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

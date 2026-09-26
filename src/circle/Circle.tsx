import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';
import { WordFace } from '../components/WordFace';
import type { Word } from '../data/words';
import { colors } from '../theme';
import { RING_AMBER, RING_GREEN, RING_RED, layerOpacities } from './color';
import type { Segment } from './geometry';
import {
  DEFAULT_START_DEG,
  KNOW_THRESHOLD,
  MIN_COMMIT,
  TAU,
  accumulate,
  angleAround,
  angleDelta,
  nextZone,
  onRing,
  pointOnRing,
  snapValue,
} from './geometry';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const AnimatedG = Animated.createAnimatedComponent(G);

const STROKE = 14;
const GHOST_END = 0.62;
// The glow round the drawn arc: many wider and fainter copies of it, in the same colours, each only
// a hair wider and a hair fainter than the last, so they blend into one soft halo that fades out with
// distance and no single layer can be seen. The glow layer is bigger than the circle so the halo is not
// cut off at its edge.
// The glow is switched off for now: with it the animation lagged on the phone. Set this to true to
// bring it back.
const RING_GLOW = false;
const GLOW_PAD = 30;
const GLOW_COUNT = 26;
const GLOW_STEPS = Array.from({ length: GLOW_COUNT }, (_, j) => ({
  extra: 2 + j * 1.7, // each copy is a little wider (up to about 46 pixels wider than the arc)...
  alpha: 0.05 * Math.pow(1 - j / GLOW_COUNT, 1.3), // ...and fainter, so the halo is bright at the arc and fades out
}));
const GLOW_COLORS = [RING_RED, RING_AMBER, RING_GREEN] as const;
const CENTER_DEAD_ZONE = 24; // near the exact centre an angle is meaningless, so ignore it

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

// A light tick as you cross from one section into the next, and a firmer one, with the snap,
// as you enter the "know it for sure" section.
function tickSection() {
  Haptics.selectionAsync().catch(() => {});
}
function tickKnow() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

// The glow of one of the three colours: all its copies of the arc in one group, so the fill of the
// arc only has to be animated once for the whole group, and the group as a whole cross-fades with the
// rating like the arc itself. It gets stronger as the ring fills up: a hint at the start, full when
// the ring is complete.
function GlowGroup({
  cx,
  r,
  length,
  display,
  layer,
}: {
  cx: number;
  r: number;
  length: number;
  display: { readonly value: number };
  layer: 0 | 1 | 2;
}) {
  const groupProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - display.value) }));
  const groupStyle = useAnimatedStyle(() => ({
    opacity: layerOpacities(display.value)[layer] * (0.3 + 0.7 * Math.min(1, display.value * 1.6)),
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, groupStyle]}>
      <Svg width={cx * 2} height={cx * 2}>
        <AnimatedG
          animatedProps={groupProps}
          fill="none"
          stroke={GLOW_COLORS[layer]}
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
        >
          {GLOW_STEPS.map((step, i) => (
            <SvgCircle key={i} cx={cx} cy={cx} r={r} strokeWidth={STROKE + step.extra} opacity={step.alpha} />
          ))}
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

export function Circle({ word, size, value, showHint, reveal, onCommit }: Props) {
  const c = size / 2;
  const r = c - STROKE;
  const length = 2 * Math.PI * r;

  const progress = useSharedValue(value ?? 0);
  const locked = useSharedValue(value !== null);
  const dragging = useSharedValue(false);
  const ghost = useSharedValue(0);

  // Where the drawing started (degrees clockwise from the top) and which way it is going.
  // A drawing begins wherever the finger lands on the ring, and can go either way round.
  const startDeg = useSharedValue(DEFAULT_START_DEG);
  const direction = useSharedValue(1); // 1 clockwise, -1 counter-clockwise
  const turned = useSharedValue(0); // running total of the finger's turn, in radians
  const lastAngle = useSharedValue(0);
  const zone = useSharedValue<Segment>(1); // which haptic section the arc is in (1-4)
  const armed = useSharedValue(false);

  // Snap: the last segment always displays as a full ring.
  const display = useDerivedValue(() => snapValue(progress.value));

  useEffect(() => {
    locked.value = value !== null;
    zone.value = value !== null && value >= KNOW_THRESHOLD ? 4 : 1;
    if (value === null) {
      progress.value = withTiming(0, { duration: 220 });
    } else {
      cancelAnimation(progress);
      progress.value = value;
    }
  }, [value, locked, zone, progress]);

  useEffect(() => {
    if (showHint && value === null) {
      ghost.value = withRepeat(
        withSequence(
          withDelay(
            900,
            withTiming(GHOST_END, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
          ),
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

  // Once the word is rated the ring is locked, so swipes fall through to the screen behind it.
  const pan = Gesture.Pan()
    .enabled(value === null)
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      armed.value = !locked.value && onRing(e.x, e.y, c, c, r);
      if (armed.value) {
        const a = angleAround(e.x, e.y, c, c);
        startDeg.value = (a * 180) / Math.PI;
        lastAngle.value = a;
        turned.value = 0;
        direction.value = 1;
      }
    })
    .onStart(() => {
      'worklet';
      if (!armed.value) return;
      dragging.value = true;
      zone.value = 1;
    })
    .onUpdate((e) => {
      'worklet';
      if (!armed.value) return;
      if (Math.hypot(e.x - c, e.y - c) < CENTER_DEAD_ZONE) return;
      const a = angleAround(e.x, e.y, c, c);
      turned.value = accumulate(turned.value, angleDelta(lastAngle.value, a));
      lastAngle.value = a;
      direction.value = turned.value < 0 ? -1 : 1;
      const p = Math.min(1, Math.abs(turned.value) / TAU);
      progress.value = p;

      const z = nextZone(p, zone.value);
      if (z !== zone.value) {
        zone.value = z;
        scheduleOnRN(z === 4 ? tickKnow : tickSection);
      }
    })
    .onFinalize((_e, success) => {
      'worklet';
      const wasArmed = armed.value;
      armed.value = false;
      if (!wasArmed || !dragging.value) return;
      dragging.value = false;
      const p = progress.value;
      if (success && p >= MIN_COMMIT) {
        const v = snapValue(p);
        progress.value = v;
        locked.value = true;
        scheduleOnRN(onCommit, v);
      } else {
        // A tap (or a cancelled drag) does nothing: the ring just empties again.
        zone.value = 1;
        progress.value = withTiming(0, { duration: 220 });
      }
    });

  // The arc is drawn starting at 3 o'clock going clockwise; turn the whole layer so it starts
  // where the finger did, and flip it when the drawing goes the other way round.
  const arcLayer = useAnimatedStyle(() => ({
    transform: [{ rotate: `${startDeg.value - 90}deg` }, { scaleY: direction.value }],
  }));

  const redProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - display.value),
    opacity: layerOpacities(display.value)[0],
  }));
  const amberProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - display.value),
    opacity: layerOpacities(display.value)[1],
  }));
  const greenProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - display.value),
    opacity: layerOpacities(display.value)[2],
  }));

  const ghostArcProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - ghost.value),
    opacity: ghost.value > 0.004 && !dragging.value ? 0.35 : 0,
  }));

  const ghostDot = useAnimatedStyle(() => {
    const p = pointOnRing(ghost.value, c, c, r);
    const fade = interpolate(ghost.value, [0, 0.03, GHOST_END - 0.08, GHOST_END], [0, 1, 1, 0]);
    return {
      opacity: dragging.value ? 0 : fade,
      transform: [{ translateX: p.x - 18 }, { translateY: p.y - 18 }],
    };
  });

  const arc = (stroke: string, props: ReturnType<typeof useAnimatedProps>) => (
    <AnimatedSvgCircle
      cx={c}
      cy={c}
      r={r}
      strokeWidth={STROKE}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${length} ${length}`}
      stroke={stroke}
      animatedProps={props}
    />
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }} collapsable={false}>
        {/* the empty track */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <SvgCircle cx={c} cy={c} r={r} stroke={colors.track} strokeWidth={STROKE} fill="none" />
        </Svg>

        {/* the glow: wider, fainter copies of the arc, turned with it */}
        {RING_GLOW ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -GLOW_PAD, top: -GLOW_PAD, width: size + 2 * GLOW_PAD, height: size + 2 * GLOW_PAD },
            arcLayer,
          ]}
        >
          {([0, 1, 2] as const).map((layer) => (
            <GlowGroup key={layer} cx={c + GLOW_PAD} r={r} length={length} display={display} layer={layer} />
          ))}
        </Animated.View>
        ) : null}

        {/* the drawn arc: red, amber and green layers that cross-fade with the rating */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, arcLayer]}>
          <Svg width={size} height={size}>
            {arc(RING_RED, redProps)}
            {arc(RING_AMBER, amberProps)}
            {arc(RING_GREEN, greenProps)}
          </Svg>
        </Animated.View>

        {/* the ghost finger's demonstration arc */}
        <Svg width={size} height={size} style={[StyleSheet.absoluteFill, ghostRotation]} pointerEvents="none">
          {arc(colors.accent, ghostArcProps)}
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
    paddingHorizontal: 40,
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

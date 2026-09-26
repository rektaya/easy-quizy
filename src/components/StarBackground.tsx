import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ambientStars, shuffled } from '../onboarding/sky';
import { useProfile } from '../state/profile';
import { colors } from '../theme';

const CELL = 36; // the sky has room for one small star per cell of this size (most cells)
// The first stars are bright and a bit bigger, so each one is noticed; as the sky fills up they settle
// to a dim, small level that stays out of the way of the content.
const SETTLE_AT = 80; // number of stars at which they have settled
const DIM_EARLY = 1.15;
const DIM_SETTLED = 0.55;
const SIZE_EARLY = 1.5;
const SIZE_SETTLED = 0.9;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// A star that has just appeared: it announces itself with a soft ring that spreads and fades.
function Ripple({ x, y }: { x: number; y: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
  }, [t]);
  const ring = useAnimatedProps(() => ({ r: 3 + 22 * t.value, opacity: 0.75 * (1 - t.value) }));
  const glow = useAnimatedProps(() => ({ r: 2.6 + 3 * (1 - t.value), opacity: 0.95 * (1 - t.value) }));
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedCircle cx={x} cy={y} fill="none" stroke={colors.text} strokeWidth={1.2} animatedProps={ring} />
      <AnimatedCircle cx={x} cy={y} fill={colors.text} animatedProps={glow} />
    </Svg>
  );
}

// The paper of every screen: a night sky that starts empty and fills with small stars as you learn.
// Every word you rate, whatever the rating, lights one more star, so the further you get the more
// stars there are. They are the same evenly scattered small stars as the sky on the Map, small and
// dim so the background stays quiet, and they never take touches.
export function StarBackground() {
  const { width, height } = useWindowDimensions();
  const { answers } = useProfile();
  const count = answers.length;

  // every place a star can appear, in a scrambled order so the sky fills up all over, not from a corner
  const field = useMemo(() => shuffled(ambientStars(width, height, [], CELL), 7), [width, height]);
  const shown = Math.min(count, field.length);
  const settle = Math.min(1, shown / SETTLE_AT); // 0 = just begun, 1 = the sky is full
  const dim = DIM_EARLY + (DIM_SETTLED - DIM_EARLY) * settle;
  const grow = SIZE_EARLY + (SIZE_SETTLED - SIZE_EARLY) * settle;

  const [fresh, setFresh] = useState<{ key: number; x: number; y: number } | null>(null);
  const before = useRef(count);
  useEffect(() => {
    if (count > before.current && count <= field.length) {
      const s = field[count - 1];
      setFresh({ key: count, x: s.x, y: s.y });
      const timer = setTimeout(() => setFresh(null), 1400);
      before.current = count;
      return () => clearTimeout(timer);
    }
    before.current = count;
  }, [count, field]);

  const stars = useMemo(
    () => (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        {field.slice(0, shown).map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r * grow} fill={colors.text} opacity={Math.min(1, s.o * dim)} />
        ))}
      </Svg>
    ),
    [field, shown, dim, grow],
  );
  return (
    <>
      {stars}
      {fresh ? <Ripple key={fresh.key} x={fresh.x} y={fresh.y} /> : null}
    </>
  );
}

/** A screen on the starry paper. The screens inside are transparent, so the stars show through. */
export function Starry({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.fill}>
      <StarBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });

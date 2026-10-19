import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, Points, RadialGradient, useClock, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { random } from '../onboarding/sky';

const DOTS = 240;
const HEIGHT = 30;
/** Room on both sides of the track for the glow, so that it is never cut off at the start or the end. */
const PAD = 24; // equal to the screen's side margin: the band starts where the content starts

type Dust = { s: number; dy: number; big: boolean; phase: number };

// The progress of the first-run screens, at the top: the circle's stardust laid out flat, as a band of stars (not a
// single row): the stars up to the current step shine (cream, with the warm glow of a "good" answer), the rest are dim
// points, and a soft light rides on the front. It fills smoothly as the screens change.
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const p = useSharedValue(step / total);
  useEffect(() => {
    p.value = withTiming(step / total, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [step, total, p]);
  const clock = useClock();
  const dots = useMemo<Dust[]>(() => {
    const rnd = random(31);
    return Array.from({ length: DOTS }, (_, i) => ({
      s: (i + 0.5) / DOTS,
      dy: (rnd() + rnd() + rnd() - 1.5) * 5, // clustered round the middle, a few stars further out (a thin band, two or three stars deep)
      big: rnd() < 0.35,
      phase: rnd() * 6.283,
    }));
  }, []);

  // where every star is now (they drift a little), and whether the progress has reached it
  const all = useDerivedValue(() => {
    const time = clock.value / 1000;
    return dots.map((d) => ({
      x: PAD + d.s * w + Math.sin(time * 0.6 + d.phase * 1.3) * 1.2,
      y: HEIGHT / 2 + d.dy + Math.sin(time * 0.8 + d.phase) * 1.1,
      lit: d.s <= p.value,
      big: d.big,
    }));
  });
  const usePick = (lit: boolean, big: boolean | null) =>
    useDerivedValue(() => all.value.filter((d) => d.lit === lit && (big === null || d.big === big)).map((d) => ({ x: d.x, y: d.y })));
  const litBig = usePick(true, true);
  const litSmall = usePick(true, false);
  const dim = usePick(false, null);
  const twinkleA = useDerivedValue(() => 0.8 + 0.2 * Math.sin(clock.value / 480));
  const twinkleB = useDerivedValue(() => 0.8 + 0.2 * Math.sin(clock.value / 480 + 3.1));
  const glow = useDerivedValue(() => 0.55 * (0.8 + 0.2 * Math.sin(clock.value / 480 + 1.7)));
  const headC = useDerivedValue(() => vec(PAD + p.value * w, HEIGHT / 2));

  return (
    <View
      pointerEvents="none"
      style={[styles.track, { top: Math.max(0, insets.top + 1) }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width - 2 * PAD)}
      accessible
      accessibilityLabel={`step ${step} of ${total}`}
    >
      {w > 0 ? (
        <Canvas style={{ width: w + 2 * PAD, height: HEIGHT }}>
          <Points points={dim} mode="points" style="stroke" strokeCap="round" strokeWidth={1.8} color="rgba(255,255,255,0.2)" />
          <Points points={litBig} mode="points" style="stroke" strokeCap="round" strokeWidth={8} color="rgb(255,150,55)" opacity={glow}>
            <BlurMask blur={4.5} style="normal" />
          </Points>
          <Points points={litSmall} mode="points" style="stroke" strokeCap="round" strokeWidth={6.5} color="rgb(255,150,55)" opacity={glow}>
            <BlurMask blur={4} style="normal" />
          </Points>
          <Points points={litBig} mode="points" style="stroke" strokeCap="round" strokeWidth={3.2} color="rgb(255,240,214)" opacity={twinkleA} />
          <Points points={litSmall} mode="points" style="stroke" strokeCap="round" strokeWidth={2.4} color="rgb(255,238,208)" opacity={twinkleB} />
          <Circle c={headC} r={14}>
            <RadialGradient c={headC} r={14} colors={['rgba(255,255,255,0.9)', 'rgba(255,150,55,0.45)', 'rgba(255,150,55,0)']} positions={[0, 0.3, 1]} />
          </Circle>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // the track is wider than the band by PAD on each side (the band itself starts at the screen's 24 px margin)
  track: { position: 'absolute', left: 0, right: 0, height: HEIGHT, marginHorizontal: 0 },
});

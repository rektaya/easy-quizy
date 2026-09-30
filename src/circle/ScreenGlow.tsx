import React from 'react';
import { Canvas, Circle, Line, RadialGradient, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

// "A star lit up": what a known word does to the whole screen. A small star ignites at the centre of
// the circle (a bright point with short rays, gone within half a second), and a warm wave of light spreads
// from it across the whole screen and fades out. The screen's own content (the words, the buttons) is
// drawn above this layer, so nothing gets harder to read. `burst` runs 0 -> 1 when the word is marked known.

const ease = (t: number) => {
  'worklet';
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

export function ScreenGlow({
  width,
  height,
  cx,
  cy,
  burst,
}: {
  /** The size of the whole screen, and where the circle's centre is on it. */
  width: number;
  height: number;
  cx: number;
  cy: number;
  burst: SharedValue<number>;
}) {
  const reach = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) * 1.05;

  // the wave: a soft disc of light that grows to cover the screen, brightest at its edge, then fades
  const waveR = useDerivedValue(() => Math.max(1, reach * ease(burst.value / 0.42)));
  const waveOpacity = useDerivedValue(() => (burst.value <= 0 ? 0 : ease(burst.value / 0.05) * (1 - ease((burst.value - 0.36) / 0.52))));

  // the star: a bright point with a halo and short rays that flares and is gone
  const star = useDerivedValue(() => (burst.value <= 0 ? 0 : ease(burst.value / 0.07) * (1 - ease((burst.value - 0.16) / 0.26))));
  const haloR = useDerivedValue(() => 18 + 40 * ease(burst.value / 0.12));
  const ray = useDerivedValue(() => 14 + 32 * ease(burst.value / 0.12));
  const p1 = useDerivedValue(() => vec(cx - ray.value, cy));
  const p2 = useDerivedValue(() => vec(cx + ray.value, cy));
  const p3 = useDerivedValue(() => vec(cx, cy - ray.value));
  const p4 = useDerivedValue(() => vec(cx, cy + ray.value));
  const coreR = useDerivedValue(() => 3 + 4 * ease(burst.value / 0.07));

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Circle cx={cx} cy={cy} r={waveR} opacity={waveOpacity}>
        <RadialGradient
          c={vec(cx, cy)}
          r={waveR}
          colors={['rgba(255,190,90,0.14)', 'rgba(255,190,90,0.22)', 'rgba(255,214,130,0.42)', 'rgba(255,200,110,0)']}
          positions={[0, 0.55, 0.86, 1]}
        />
      </Circle>
      <Circle cx={cx} cy={cy} r={haloR} opacity={star}>
        <RadialGradient c={vec(cx, cy)} r={haloR} colors={['rgba(255,244,215,0.9)', 'rgba(255,170,70,0.35)', 'rgba(255,150,50,0)']} positions={[0, 0.3, 1]} />
      </Circle>
      <Line p1={p1} p2={p2} color="rgba(255,228,170,1)" style="stroke" strokeWidth={1.3} strokeCap="round" opacity={star} />
      <Line p1={p3} p2={p4} color="rgba(255,228,170,1)" style="stroke" strokeWidth={1.3} strokeCap="round" opacity={star} />
      <Circle cx={cx} cy={cy} r={coreR} color="rgb(255,250,236)" opacity={star} />
    </Canvas>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Points } from '@shopify/react-native-skia';
import Animated, { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { KNOWN_MS, onKnownWord } from '../circle/knownEvents';
import type { KnownPoint } from '../circle/knownEvents';
import { random } from '../onboarding/sky';
import { alpha, stars } from '../theme';

// What a known word does: stars come loose from its ring in waves and drift up like fireflies, all the way
// out of the top of the screen. It is drawn above the whole app, on a canvas that exists only while the
// stardust is on its way.
const WAVES = 12;
const PER_WAVE = 14;
const DURATION = KNOWN_MS;

type Mote = { ang: number; drift: number; speed: number; phase: number };
type Wave = { delay: number; motes: Mote[]; size: number };

const ease = (t: number) => {
  'worklet';
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

type Burst = KnownPoint & { id: number };

export function KnownDust() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seq = React.useRef(0);
  useEffect(
    () =>
      onKnownWord((p) => {
        seq.current += 1;
        const id = seq.current;
        setBursts((l) => [...l, { id, ...p }]);
      }),
    [],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((b) => (
        <DustBurst key={b.id} from={b} onDone={() => setBursts((l) => l.filter((x) => x.id !== b.id))} />
      ))}
    </View>
  );
}

function DustBurst({ from, onDone }: { from: Burst; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const waves = useMemo<Wave[]>(() => {
    const rnd = random(from.id * 97 + 311);
    return Array.from({ length: WAVES }, (_, w) => ({
      delay: (w / WAVES) * 0.3,
      size: 3.2 + rnd() * 2.6,
      motes: Array.from({ length: PER_WAVE }, (): Mote => ({
        ang: rnd() * Math.PI * 2,
        drift: (rnd() - 0.5) * 70,
        speed: 1 + rnd() * 0.4,
        phase: rnd() * 6.283,
      })),
    }));
  }, [from.id]);

  useEffect(() => {
    t.value = withTiming(1, { duration: DURATION, easing: Easing.linear }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(onDone);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {waves.map((w, i) => (
        <DustWave key={i} t={t} from={from} wave={w} />
      ))}
    </Canvas>
  );
}

function DustWave({ t, from, wave }: { t: SharedValue<number>; from: Burst; wave: Wave }) {
  // Every mote climbs steadily and is clear of the top of the screen by 80% of its life (the faster ones
  // sooner), so none hovers at the edge: the last one is gone well before the stardust ends.
  const reach = from.y + 60;
  const life = useDerivedValue(() => Math.min(1, Math.max(0, (t.value - wave.delay) / 0.6)));
  const points = useDerivedValue(() => {
    const l = life.value;
    return wave.motes.map((m) => ({
      x: from.x + from.r * Math.sin(m.ang) + m.drift * l + Math.sin(l * 8 + m.phase) * 7,
      y: from.y - from.r * Math.cos(m.ang) - reach * m.speed * Math.pow(l / 0.8, 1.15),
    }));
  });
  const opacity = useDerivedValue(() => ease(life.value / 0.1)); // they appear at once and are never faded: they leave the screen
  return (
    <>
      <Points points={points} mode="points" style="stroke" strokeCap="round" strokeWidth={wave.size * 3.4} color={alpha(stars.ember, 0.55)} opacity={opacity}>
        <BlurMask blur={7} style="normal" />
      </Points>
      <Points points={points} mode="points" style="stroke" strokeCap="round" strokeWidth={wave.size} color={stars.cream} opacity={opacity} />
    </>
  );
}

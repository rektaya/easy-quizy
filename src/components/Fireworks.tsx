import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// A celebration for knowing a word: a few small firework bursts blooming over the circle.
// Each burst is a ring of little streaks that fly outward, sag a little, and fade.

const COLORS = ['#3FB950', '#F2B01E', '#E85D0C', '#8ED081', '#FFC94D'];
const PARTICLES = 14;
const BURST_MS = 900;

// Burst centres are relative to the circle's middle, as a fraction of its size.
const BURSTS = [
  { x: -0.27, y: -0.28, delay: 0, reach: 76 },
  { x: 0.29, y: -0.2, delay: 140, reach: 70 },
  { x: -0.02, y: 0.02, delay: 280, reach: 92 },
  { x: -0.24, y: 0.29, delay: 420, reach: 66 },
  { x: 0.26, y: 0.27, delay: 560, reach: 72 },
];
const TOTAL_MS = 560 + BURST_MS + 50;

type BurstSpec = (typeof BURSTS)[number];

function Streak({
  t,
  burst,
  index,
  burstIndex,
  size,
}: {
  t: SharedValue<number>;
  burst: BurstSpec;
  index: number;
  burstIndex: number;
  size: number;
}) {
  // Slightly uneven angles, speeds and lengths, so a burst looks thrown rather than stamped.
  const jitter = Math.sin((index + 1) * 12.9898 + burstIndex * 78.233);
  const angle = (index / PARTICLES) * Math.PI * 2 + jitter * 0.12;
  const speed = 0.78 + 0.34 * ((Math.sin(index * 4.1 + burstIndex) + 1) / 2);
  const color = COLORS[(index + burstIndex) % COLORS.length];
  const cx = size / 2 + burst.x * size;
  const cy = size / 2 + burst.y * size;

  const style = useAnimatedStyle(() => {
    const local = Math.min(1, Math.max(0, (t.value - burst.delay) / BURST_MS));
    const eased = 1 - Math.pow(1 - local, 3);
    const dist = burst.reach * speed * eased;
    const sag = 24 * local * local;
    // quick fade in, hold, then a long fade out
    const opacity = local <= 0 ? 0 : local < 0.12 ? local / 0.12 : Math.max(0, 1 - (local - 0.5) / 0.5);
    return {
      opacity,
      transform: [
        { translateX: cx + Math.cos(angle) * dist },
        { translateY: cy + Math.sin(angle) * dist + sag },
        { rotate: `${(angle * 180) / Math.PI - 90}deg` },
        { scaleY: 1 - 0.55 * local },
      ],
    };
  });

  return <Animated.View style={[styles.streak, { backgroundColor: color }, style]} />;
}

export function Fireworks({ size }: { size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(TOTAL_MS, { duration: TOTAL_MS, easing: Easing.linear });
  }, [t]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      {BURSTS.flatMap((burst, burstIndex) =>
        Array.from({ length: PARTICLES }, (_, index) => (
          <Streak key={`${burstIndex}-${index}`} t={t} burst={burst} index={index} burstIndex={burstIndex} size={size} />
        )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
  // A small rounded streak, centred on its own origin so it can be positioned by its middle.
  streak: { position: 'absolute', left: -1.5, top: -6, width: 3, height: 12, borderRadius: 2, opacity: 0 },
});

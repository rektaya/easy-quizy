import React, { useMemo } from 'react';
import { BlurMask, Canvas, Circle, Group, Points, RadialGradient, useClock, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { random } from '../onboarding/sky';
import { RING_PAD } from './useRing';
import type { Ring } from './useRing';

const DOTS = 210;

// The stardust Circle. There is no ring until you draw one: you draw along an invisible circle and stars
// appear where your finger goes, each settling in from slightly outside and then drifting and twinkling in
// its own way. The colour never changes (the warm white and orange of the stars on the Map); what grows
// with the rating is how much they shine: a short arc is a few faint, small stars, a full ring is a bright
// glowing one. A known word makes the ring flare and glow (KnownGlow), and stardust floats up out of the screen (see components/KnownDust).

type Dust = { s: number; jitter: number; big: boolean; fly: number; phase: number };
type Placed = { x: number; y: number; lit: boolean };
type Shared<T> = SharedValue<T>;

const ease = (t: number) => {
  'worklet';
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// How strongly a known word's celebration glows, 0..1, over the burst (0 -> 1): it rises at once, holds while
// the stardust is leaving the screen, and is gone by the time the last star has left. After that the ring is
// just a full golden ring, as it stays for as long as the word is shown.
function celebration(b: number): number {
  'worklet';
  if (b <= 0 || b >= 1) return 0;
  return ease(b / 0.1) * (1 - ease((b - 0.78) / 0.14));
}

// How much a rating shines, 0..1, by the four hidden segments: "don't know" is barely a glimmer, "know" is
// a blaze, and the steps in between are clearly different from each other.
const SHINE_STEPS: [number, number][] = [
  [0, 0.09],
  [0.3, 0.24],
  [0.6, 0.5],
  [0.9, 0.85],
  [1, 1],
];
function shineOf(p: number): number {
  'worklet';
  for (let i = 1; i < SHINE_STEPS.length; i++) {
    const [x1, y1] = SHINE_STEPS[i];
    if (p <= x1) {
      const [x0, y0] = SHINE_STEPS[i - 1];
      return y0 + ((p - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 1;
}
// A colour along a ramp of [position, r, g, b] stops.
function ramp(stops: number[][], t: number, alpha = 1): string {
  'worklet';
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const a = stops[i - 1];
      const b = stops[i];
      const k = (t - a[0]) / (b[0] - a[0]);
      return `rgba(${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)},${Math.round(a[3] + (b[3] - a[3]) * k)},${alpha})`;
    }
  }
  const z = stops[stops.length - 1];
  return `rgba(${z[1]},${z[2]},${z[3]},${alpha})`;
}
// the stars go from a clear blue (don't know), through an icy blue-white (hard), to a warm cream (good),
// to a golden white (know); the glow from a soft blue to orange-gold
const CORE_RAMP = [
  [0, 110, 165, 255],
  [0.24, 150, 195, 255],
  [0.5, 205, 225, 255],
  [0.7, 255, 236, 205],
  [1, 255, 244, 220],
];
const HALO_RAMP = [
  [0, 70, 130, 255],
  [0.3, 90, 150, 255],
  [0.55, 230, 140, 80],
  [0.8, 255, 150, 55],
  [1, 255, 150, 55],
];

// the ring of a word that is not known at all (the cross): a deep blue
const DARK_CORE = 'rgba(64,104,216,1)';
const DARK_HALO = 'rgba(36,68,186,1)';

export function StardustRing({ ring }: { ring: Ring }) {
  const { c, r, size, v } = ring;
  const clock = useClock();
  const dots = useMemo<Dust[]>(() => {
    const rnd = random(77);
    return Array.from({ length: DOTS }, (_, i) => ({
      s: (i + 0.5) / DOTS,
      jitter: (rnd() - 0.5) * 9,
      big: rnd() < 0.3,
      fly: 0.4 + rnd() * 0.9,
      phase: rnd() * 6.283,
    }));
  }, []);

  // where every dot is right now
  const all = useDerivedValue<Placed[]>(() => {
    // the ring is drawn up to where the finger stopped; let go early and it carries on by itself to the end
    const p = v.display.value + (1 - v.display.value) * v.finish.value;
    const startA = v.startRad.value;
    const dir = v.direction.value;
    const time = clock.value / 1000;
    return dots.map((d) => {
      const lit = d.s <= p;
      const a = startA + dir * d.s * Math.PI * 2 + Math.sin(time * 0.5 + d.phase * 1.7) * 0.012;
      // the dots nearest the finger are still arriving; once the ring is complete they have all settled
      // (when a ring finishes itself they catch up gradually, so there is no jump when it reaches the end)
      const settle = v.display.value < 1 ? Math.exp(-(p - d.s) * 15) * (1 - ease(v.finish.value)) : 0;
      const rad = r + d.jitter * 0.55 + Math.sin(time * 0.7 + d.phase) * 1.8 + settle * 15 * d.fly;
      return { x: c + rad * Math.sin(a), y: c - rad * Math.cos(a), lit };
    });
  });

  // how much the stars shine: faint for a short arc, bright for a full ring, with a flare when a word is known
  const shine = useDerivedValue(() => {
    const flare = v.burst.value > 0 && v.burst.value < 1 ? Math.sin(Math.PI * Math.min(1, v.burst.value / 0.45)) * 0.45 : 0;
    return (v.dark.value ? 0.3 : shineOf(v.display.value)) + flare;
  });
  const coreColor = useDerivedValue(() => (v.dark.value ? DARK_CORE : ramp(CORE_RAMP, shine.value)));
  const haloColor = useDerivedValue(() => (v.dark.value ? DARK_HALO : ramp(HALO_RAMP, shine.value)));
  const coreBig = useDerivedValue(() => Math.min(1, (0.7 + 0.3 * shine.value) * (0.72 + 0.28 * Math.sin(clock.value / 480))));
  const coreSmall = useDerivedValue(() => Math.min(1, (0.7 + 0.3 * shine.value) * (0.72 + 0.28 * Math.sin(clock.value / 480 + 3.1))));
  const haloBig = useDerivedValue(() => Math.min(1, (0.22 + 0.55 * Math.pow(shine.value, 1.6)) * (0.75 + 0.25 * Math.sin(clock.value / 480))));
  const haloSmall = useDerivedValue(() => Math.min(1, (0.22 + 0.55 * Math.pow(shine.value, 1.6)) * (0.75 + 0.25 * Math.sin(clock.value / 480 + 3.1))));
  const sizeBig = useDerivedValue(() => 3.3 + 2.4 * shine.value);
  const sizeSmall = useDerivedValue(() => 2.4 + 1.9 * shine.value);
  const haloW = useDerivedValue(() => 5 + 15 * shine.value + 9 * celebration(v.burst.value));

  return (
    <Canvas style={{ width: size + 2 * RING_PAD, height: size + 2 * RING_PAD }} pointerEvents="none">
      <Group transform={[{ translateX: RING_PAD }, { translateY: RING_PAD }]}>
        {[true, false].map((big) => (
          <Halo key={`h${big}`} dots={dots} all={all} big={big} opacity={big ? haloBig : haloSmall} width={haloW} color={haloColor} />
        ))}
        {[true, false].map((big) => (
          <Core key={`c${big}`} dots={dots} all={all} big={big} opacity={big ? coreBig : coreSmall} width={big ? sizeBig : sizeSmall} color={coreColor} />
        ))}
        <KnownGlow c={c} r={r} v={v} />
        <Head c={c} r={r} v={v} />
      </Group>
    </Canvas>
  );
}

function useLit(dots: Dust[], all: Shared<Placed[]>, big: boolean) {
  return useDerivedValue(() => {
    const pts = all.value;
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < dots.length; i++) if (dots[i].big === big && pts[i].lit) out.push({ x: pts[i].x, y: pts[i].y });
    return out;
  });
}

// the soft glow round the stars of one size
function Halo({ dots, all, big, opacity, width, color }: { dots: Dust[]; all: Shared<Placed[]>; big: boolean; opacity: Shared<number>; width: Shared<number>; color: Shared<string> }) {
  const points = useLit(dots, all, big);
  return (
    <Points points={points} mode="points" style="stroke" strokeCap="round" strokeWidth={width} color={color} opacity={opacity}>
      <BlurMask blur={big ? 7 : 6} style="normal" />
    </Points>
  );
}

// the bright centres of the stars of one size
function Core({ dots, all, big, opacity, width, color }: { dots: Dust[]; all: Shared<Placed[]>; big: boolean; opacity: Shared<number>; width: Shared<number>; color: Shared<string> }) {
  const points = useLit(dots, all, big);
  return <Points points={points} mode="points" style="stroke" strokeCap="round" strokeWidth={width} color={color} opacity={opacity} />;
}

// a glow at the finger's end while drawing
function Head({ c, r, v }: { c: number; r: number; v: Ring['v'] }) {
  // the glow rides on the front of the stars: where the finger is, then where the ring finishes itself
  const front = useDerivedValue(() => v.display.value + (1 - v.display.value) * v.finish.value);
  const x = useDerivedValue(() => c + r * Math.sin(v.startRad.value + v.direction.value * front.value * Math.PI * 2));
  const y = useDerivedValue(() => c - r * Math.cos(v.startRad.value + v.direction.value * front.value * Math.PI * 2));
  const rad = useDerivedValue(() => 14 + 12 * v.speed.value + 12 * v.pulse.value);
  // the glow is the colour of the stars it runs along
  const headColors = useDerivedValue(() => {
    if (v.dark.value) return ['rgba(160,190,255,0.9)', 'rgba(46,84,200,0.5)', 'rgba(46,84,200,0)'];
    const sh = shineOf(v.display.value);
    return ['rgba(255,255,255,0.95)', ramp(HALO_RAMP, sh, 0.5), ramp(HALO_RAMP, sh, 0)];
  });
  const opacity = useDerivedValue(() => {
    if (v.display.value < 0.004) return 0;
    if (v.dragging.value) return 1;
    return v.finish.value > 0 && v.finish.value < 1 ? 0.85 * (1 - ease((v.finish.value - 0.7) / 0.3)) : 0;
  });
  return (
    <Circle cx={x} cy={y} r={rad} opacity={opacity}>
      <RadialGradient
        c={useDerivedValue(() => vec(x.value, y.value))}
        r={rad}
        colors={headColors}
        positions={[0, 0.3, 1]}
      />
    </Circle>
  );
}


// A known word glows: a soft orange-gold light all round the ring while the stardust floats away, which
// fades once the last star has left. The ring then settles to its ordinary golden look.
function KnownGlow({ c, r, v }: { c: number; r: number; v: Ring['v'] }) {
  const opacity = useDerivedValue(() => (v.display.value < 1 ? 0 : celebration(v.burst.value)));
  return (
    <>
      <Circle cx={c} cy={c} r={r} style="stroke" strokeWidth={34} color="rgba(255,140,50,0.55)" opacity={opacity}>
        <BlurMask blur={20} style="normal" />
      </Circle>
      <Circle cx={c} cy={c} r={r} style="stroke" strokeWidth={14} color="rgba(255,205,130,0.6)" opacity={opacity}>
        <BlurMask blur={9} style="normal" />
      </Circle>
    </>
  );
}

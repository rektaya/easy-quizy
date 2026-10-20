import React, { useMemo } from 'react';
import { BlurMask, Canvas, Circle, Group, Points, RadialGradient, useClock, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { random } from '../onboarding/sky';
import { RING_PAD } from './useRing';
import { TAU } from './geometry';
import type { Ring } from './useRing';
import { CORE_RAMP, HALO_RAMP, ramp, shineOf } from './shine';

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

// How strongly a known word's celebration glows, 0..1, over the burst (0 -> 1, the time the stardust takes to leave
// the screen): it rises at once and dies away quickly, in about a third of that time, while the stardust is still on
// its way. After that the ring is just a full golden ring, as it stays for as long as the word is shown.
function celebration(b: number): number {
  'worklet';
  if (b <= 0 || b >= 1) return 0;
  return ease(b / 0.05) * (1 - ease((b - 0.1) / 0.2));
}

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
    const flare = v.burst.value > 0 && v.burst.value < 1 ? Math.sin(Math.PI * Math.min(1, v.burst.value / 0.22)) * 0.45 : 0;
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
        <Handle c={c} r={r} v={v} core={coreColor} halo={haloColor} />
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

// The handle of a rating: a small dot on the ring where the answer ends, in the colour of the stars (so it takes the
// colour of the rating). It is only drawn (the touch area is a view of its own, see Circle); it grows a little while
// it is held, and pulses once when it appears.
function Handle({ c, r, v, core, halo }: { c: number; r: number; v: Ring['v']; core: Shared<string>; halo: Shared<string> }) {
  const angle = useDerivedValue(() => v.startRad.value + v.direction.value * v.progress.value * TAU);
  const x = useDerivedValue(() => c + r * Math.sin(angle.value));
  const y = useDerivedValue(() => c - r * Math.cos(angle.value));
  const haloR = useDerivedValue(() => 21 + 10 * v.handlePulse.value + (v.adjusting.value ? 5 : 0));
  const haloOpacity = useDerivedValue(() => v.handle.value * (0.22 + 0.3 * v.handlePulse.value + (v.adjusting.value ? 0.12 : 0)));
  const dot = useDerivedValue(() => (v.adjusting.value ? 16 : 13.5)); // wider than the glow of the ring at its brightest, so it is never lost in it
  return (
    <>
      <Circle cx={x} cy={y} r={haloR} color={halo} opacity={haloOpacity} />
      <Circle cx={x} cy={y} r={dot} color={core} opacity={v.handle} />
      <Circle cx={x} cy={y} r={dot} style="stroke" strokeWidth={2.5} color={halo} opacity={v.handle} />
    </>
  );
}

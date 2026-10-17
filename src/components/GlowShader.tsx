import React from 'react';
import { Canvas, Group, Points, Rect, Shader, Skia, useClock } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

// One shader draws every star and every word point on the Map. It runs on the GPU (Metal on an
// iPhone), so each point can twinkle and breathe for free. The shader only knows how to draw one
// glowing point; the Map decides where they go and how lit they are.

const SOURCE = Skia.RuntimeEffect.Make(`
uniform float2 center;
uniform float radius;   // core radius, in px
uniform float lit;      // 0..1, how strongly it shines
uniform float rays;     // 0..1, strength of the four rays
uniform float haloK;    // scales the halo and the rays
uniform float ring;     // 1 draws a hollow ring instead (a word that is only gathered)
uniform float dull;     // 1 draws a dim, quiet dot (nothing lit yet)
uniform float steady;   // 1: a dull dot does not flicker (every untouched theme looks the same)
uniform float3 tint;    // colour of the halo
uniform float3 coreColor; // colour of the bright core
uniform float time;
uniform float phase;    // each point twinkles in its own rhythm

half4 main(float2 p) {
  float2 d = p - center;
  float dist = length(d);

  if (dull > 0.5) {
    float flick = mix(0.7 + 0.3 * sin(time * 1.3 + phase), 0.85, steady);
    float a = (1.0 - smoothstep(radius - 1.0, radius, dist)) * 0.95 * flick;
    return half4(half3(0.56, 0.64, 0.73) * half(a), half(a));
  }

  float twinkle = 1.0 + 0.4 * sin(time * 2.6 + phase) + 0.22 * sin(time * 5.3 + phase * 2.3);
  float breathe = 0.5 + 0.5 * sin(time * 1.1 + phase);

  if (ring > 0.5) {
    float r = radius * 1.6;
    float line = (1.0 - smoothstep(0.3, 1.3, abs(dist - r))) * (0.65 + 0.35 * twinkle * 0.8);
    float haze = exp(-pow(dist / (radius * 3.2), 2.0)) * 0.3 * (0.5 + 0.5 * breathe);
    float a = clamp(line * 0.75 + haze, 0.0, 1.0);
    float3 c = float3(0.94, 0.96, 1.0) * line * 0.75 + tint * haze;
    return half4(half3(min(c, float3(a))), half(a));
  }

  float haloR = radius * (4.0 + 7.0 * lit) * haloK;
  float halo = exp(-pow(dist / haloR, 1.4) * 3.2) * (0.25 + 0.75 * lit) * (0.55 + 0.45 * breathe);

  float rayLen = radius * (2.5 + 7.0 * lit) * haloK * (0.5 + 0.5 * twinkle);
  float rx = exp(-abs(d.y) * 1.5) * exp(-abs(d.x) / rayLen * 2.4);
  float ry = exp(-abs(d.x) * 1.5) * exp(-abs(d.y) / rayLen * 2.4);
  float ray = (rx + ry) * rays * (0.45 + 0.55 * lit) * twinkle;

  float core = (1.0 - smoothstep(radius * 0.55, radius, dist)) * (0.7 + 0.3 * lit) * (0.8 + 0.2 * twinkle);

  float3 c = tint * halo + float3(1.0, 0.78, 0.34) * ray + coreColor * core;
  float a = 1.0 - (1.0 - clamp(halo, 0.0, 1.0)) * (1.0 - clamp(ray, 0.0, 1.0)) * (1.0 - clamp(core, 0.0, 1.0));
  return half4(half3(clamp(c, float3(0.0), float3(a))), half(a));
}
`)!;

export type Glow = {
  x: number;
  y: number;
  radius: number;
  lit?: number;
  rays?: number;
  haloK?: number;
  ring?: boolean;
  dull?: boolean;
  /** A dull dot that does not flicker. */
  steady?: boolean;
  /** halo colour, each 0..1 */
  tint?: [number, number, number];
  /** colour of the bright core (a warm white by default) */
  core?: [number, number, number];
  phase?: number;
  /** Sit on a turning sphere: its centre and radius, a unit vector (where on the sphere), spin speed (rad/s) and tilt. */
  sphere?: { cx: number; cy: number; R: number; u: [number, number, number]; w: number; tilt: number };
};

/** Where a point of the unit sphere is after the sphere has turned by `angle` and leans by `tilt`. */
function turn(u: [number, number, number], angle: number, tilt: number) {
  'worklet';
  const th = angle;
  const x1 = u[0] * Math.cos(th) + u[2] * Math.sin(th);
  const z1 = -u[0] * Math.sin(th) + u[2] * Math.cos(th);
  const y2 = u[1] * Math.cos(tilt) - z1 * Math.sin(tilt);
  const z2 = u[1] * Math.sin(tilt) + z1 * Math.cos(tilt);
  return { x: x1, y: y2, z: z2 }; // z > 0 is the side facing the viewer
}

function GlowPoint({ g, clock, tilt }: { g: Glow; clock: SharedValue<number>; tilt?: Tilt }) {
  const lit = g.lit ?? 1;
  const haloK = g.haloK ?? 1;
  const reach = g.dull ? g.radius * 2 : g.ring ? g.radius * 4 : g.radius * 12 * haloK + 6;
  const sp = g.sphere;
  // a point on the sphere is drawn at the origin of a group that the clock carries round
  const cx = sp ? 0 : g.x;
  const cy = sp ? 0 : g.y;
  const uniforms = useDerivedValue(() => ({
    center: [cx, cy],
    radius: g.radius,
    lit,
    rays: g.rays ?? 0,
    haloK,
    ring: g.ring ? 1 : 0,
    dull: g.dull ? 1 : 0,
    steady: g.steady ? 1 : 0,
    tint: g.tint ?? [0.97, 0.35, 0.19],
    coreColor: g.core ?? [1, 0.96, 0.86],
    time: clock.value / 1000,
    phase: g.phase ?? 0,
  }));
  const transform = useDerivedValue(() => {
    if (!sp) return [];
    const q = turn(sp.u, spin(sp.w, clock.value, tilt), lean(sp.tilt, tilt));
    // the near side is bigger and brighter than the far side
    const near = 0.5 + 0.5 * q.z;
    return [{ translateX: sp.cx + sp.R * q.x }, { translateY: sp.cy + sp.R * q.y }, { scale: 0.6 + 0.4 * near }];
  });
  const opacity = useDerivedValue(() => {
    if (!sp) return 1;
    const q = turn(sp.u, spin(sp.w, clock.value, tilt), lean(sp.tilt, tilt));
    return 0.3 + 0.7 * (0.5 + 0.5 * q.z);
  });
  const rect = (
    <Rect x={cx - reach} y={cy - reach} width={reach * 2} height={reach * 2}>
      <Shader source={SOURCE} uniforms={uniforms} />
    </Rect>
  );
  return sp ? (
    <Group transform={transform} opacity={opacity}>
      {rect}
    </Group>
  ) : (
    rect
  );
}

export type Tilt = { x: SharedValue<number>; y: SharedValue<number> };

// How far a full tilt of the phone turns and leans the sphere, in radians.
const TILT_YAW = 0.9;
const TILT_LEAN = 0.5;

function spin(w: number, clockMs: number, tilt?: Tilt) {
  'worklet';
  return (w * clockMs) / 1000 + (tilt ? tilt.x.value * TILT_YAW : 0);
}

function lean(base: number, tilt?: Tilt) {
  'worklet';
  return base + (tilt ? tilt.y.value * TILT_LEAN : 0);
}

/** Evenly spread points on a unit sphere (a Fibonacci spiral). */
export function sphereUnits(n: number, offset = 0.5): [number, number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + offset)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.399963;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
}

// The fine dust that gives the sphere its shape: many tiny dots, the near ones brighter than the far ones.
function SphereDust({ spec, units, clock, tilt }: { spec: { cx: number; cy: number; R: number; w: number; tilt: number }; units: [number, number, number][]; clock: SharedValue<number>; tilt?: Tilt }) {
  const project = (front: boolean) => {
    'worklet';
    const angle = spin(spec.w, clock.value, tilt);
    const lean_ = lean(spec.tilt, tilt);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < units.length; i++) {
      const q = turn(units[i], angle, lean_);
      if (q.z > 0 === front) out.push({ x: spec.cx + spec.R * q.x, y: spec.cy + spec.R * q.y });
    }
    return out;
  };
  const near = useDerivedValue(() => project(true));
  const far = useDerivedValue(() => project(false));
  return (
    <>
      <Points points={far} mode="points" color="rgba(191,212,255,0.4)" style="stroke" strokeWidth={1.5} strokeCap="round" />
      <Points points={near} mode="points" color="rgba(232,240,255,0.92)" style="stroke" strokeWidth={2.3} strokeCap="round" />
    </>
  );
}

// A transparent canvas of the given size with a glowing point for each entry, and optionally the dust
// of a turning sphere under them. Touches pass through.
export function GlowCanvas({
  width,
  height,
  points,
  dust,
  tilt,
}: {
  width: number;
  height: number;
  points: Glow[];
  dust?: { cx: number; cy: number; R: number; w: number; tilt: number; units: [number, number, number][] };
  /** The phone's tilt (-1..1): the sphere turns a little further and leans with it. */
  tilt?: Tilt;
}) {
  const clock = useClock();
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {dust ? <SphereDust spec={dust} units={dust.units} clock={clock} tilt={tilt} /> : null}
      {points.map((g, i) => (
        <GlowPoint key={i} g={g} clock={clock} tilt={tilt} />
      ))}
    </Canvas>
  );
}

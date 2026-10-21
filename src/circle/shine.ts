import { rgbOf, stars } from '../theme';

// The shine of a rating (and of the stars of the week in Profile): how much it shines, and the colours of the star and
// of its glow along the way, from a clear blue for "nothing" to a golden blaze.

// How much a rating shines, 0..1, by the four hidden segments: "don't know" is barely a glimmer, "know" is
// a blaze, and the steps in between are clearly different from each other.
export const SHINE_STEPS: [number, number][] = [
  [0, 0.09],
  [0.3, 0.24],
  [0.6, 0.5],
  [0.9, 0.85],
  [1, 1],
];
export function shineOf(p: number): number {
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
export function ramp(stops: number[][], t: number, alpha = 1): string {
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
export const CORE_RAMP = [
  [0, ...rgbOf(stars.blue)],
  [0.24, 150, 195, 255],
  [0.5, ...rgbOf(stars.ice)],
  [0.7, 255, 236, 205],
  [1, ...rgbOf(stars.cream)],
];
export const HALO_RAMP = [
  [0, 70, 130, 255],
  [0.3, 90, 150, 255],
  [0.55, 230, 140, 80],
  [0.8, ...rgbOf(stars.ember)],
  [1, ...rgbOf(stars.ember)],
];

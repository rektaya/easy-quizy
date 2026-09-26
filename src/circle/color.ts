// The arc's color is the rating signal itself: red (don't know) -> amber -> green (know it).
//
// SVG stroke colors can't be animated reliably across platforms, so the arc is drawn as three
// stacked layers (red, amber, green) whose opacities cross-fade with the rating. Only length and
// opacity are animated, which every platform handles.

export const RING_RED = '#E5484D';
export const RING_AMBER = '#F2B01E';
export const RING_GREEN = '#3FB950';

/** Opacity of the [red, amber, green] layers for a displayed progress (0..1). */
export function layerOpacities(progress: number): readonly [number, number, number] {
  'worklet';
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0.004) return [0, 0, 0]; // nothing drawn yet, and no dot from the round cap
  if (p < 0.5) return [1, p * 2, 0]; // red fading into amber
  return [0, 1, (p - 0.5) * 2]; // amber fading into green
}

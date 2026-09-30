// Where the screen may look onto the Map's sky. The sky (`world`) is bigger than the screen (`stage`).
// `pan` is where the sky's top-left corner sits in the sky's own pixels, and the whole picture is scaled
// by `scale` around the middle of the screen (1 = close, less = pulled back to see more of the sky).

/** How far the pinch can pull back: the whole sky just fits the screen. */
export function minScale(stageW: number, stageH: number, worldW: number, worldH: number): number {
  'worklet';
  return Math.min(1, stageW / worldW, stageH / worldH);
}

/** The range `pan` may take along one axis at this scale. If the sky is smaller than the screen on that axis, it is centred (lo == hi). */
export function panRange(scale: number, stage: number, world: number): [number, number] {
  'worklet';
  const c = stage / 2;
  const hi = c * (1 - 1 / scale); // the sky's edge must not come in from the near side
  const lo = c / scale - world + c; // nor from the far side
  if (lo > hi) return [(lo + hi) / 2, (lo + hi) / 2];
  return [lo, hi];
}

export function clampPan(pan: number, scale: number, stage: number, world: number): number {
  'worklet';
  const [lo, hi] = panRange(scale, stage, world);
  return Math.min(hi, Math.max(lo, pan));
}

/**
 * Where a pinch settles when the fingers lift: the map only rests at two distances, close up (1) and the
 * whole sky (`lowest`), never in between. A pinch that has covered about a fifth of the way from where it
 * started flips to the other distance; a smaller one springs back to where it started.
 */
export function snapScale(scale: number, start: number, lowest: number): number {
  'worklet';
  const range = 1 - lowest;
  if (range <= 0) return 1;
  const startedClose = start > (1 + lowest) / 2;
  if (startedClose) return scale <= 1 - 0.2 * range ? lowest : 1;
  return scale >= lowest + 0.2 * range ? 1 : lowest;
}

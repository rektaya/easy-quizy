// Pure gesture math for the Circle. Every function is a worklet so it can run on the
// UI thread during a drag; the directive is inert when called from plain JS/tests.

export const TAU = Math.PI * 2;

/**
 * Where the ghost-finger demo starts, in degrees clockwise from 12 o'clock, and the
 * orientation of a ring that is restored from a saved rating. Real drawings start
 * wherever the finger lands on the ring.
 */
export const DEFAULT_START_DEG = 65;

/** A drawing may start anywhere around the word, but not on its very centre (the angle is unstable there). */
export const DRAW_MIN = 30;
/** How far beyond the ring a touch may land and still start a drawing. */
export const DRAW_REACH = 500;

/** The last 10% of the arc is the "know it for sure" segment. */
export const KNOW_THRESHOLD = 0.9;

/**
 * The top of the "know it, still want to study" segment. After the meaning is shown, an answer in Explore can
 * be changed down freely, but not up into "known" (seeing the meaning makes every word look familiar).
 */
export const GOOD_MAX = KNOW_THRESHOLD - 0.01;

/** The most a first answer of `confidence` may be raised to when it is adjusted in Explore: its own height, or "good" at least. */
export function adjustCeiling(confidence: number): number {
  'worklet';
  return Math.max(confidence, GOOD_MAX);
}

/** The value the cross under the word gives: "I don't know this word at all". Its ring is drawn by itself, in dark blue. */
export const DONT_KNOW = 0.03;
export function isDontKnow(value: number): boolean {
  'worklet';
  return Math.abs(value - DONT_KNOW) < 1e-9;
}

/** Releasing with less than this fill is treated as a tap and ignored. */
export const MIN_COMMIT = 0.03;

export type Segment = 1 | 2 | 3 | 4;
export type Grade = 'again' | 'hard' | 'good' | 'easy';

/** Hidden segments: 30% / 30% / 30% / 10%. */
export function segmentOf(value: number): Segment {
  'worklet';
  if (value >= KNOW_THRESHOLD) return 4;
  if (value >= 0.6) return 3;
  if (value >= 0.3) return 2;
  return 1;
}

const GRADES: Record<Segment, Grade> = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };

export function gradeOf(value: number): Grade {
  return GRADES[segmentOf(value)];
}

export function isKnown(value: number): boolean {
  'worklet';
  return value >= KNOW_THRESHOLD;
}

/** Magnetic snap: anything in the last segment displays (and is stored) as a full ring. */
export function snapValue(value: number): number {
  'worklet';
  return value >= KNOW_THRESHOLD ? 1 : value;
}

const BOUNDARIES = [0.3, 0.6, KNOW_THRESHOLD] as const;
const HYSTERESIS = 0.015;

/**
 * Which section the arc is in, with a little hysteresis: it takes a small step back past a
 * boundary to leave a section again, so a finger resting on the line does not buzz.
 */
export function nextZone(progress: number, previous: Segment): Segment {
  'worklet';
  let z: number = previous;
  while (z < 4 && progress >= BOUNDARIES[z - 1]) z++;
  while (z > 1 && progress < BOUNDARIES[z - 2] - HYSTERESIS) z--;
  return z as Segment;
}

/** Point on the ring for a given progress (0..1) drawn clockwise from the default start. */
export function pointOnRing(progress: number, cx: number, cy: number, r: number) {
  'worklet';
  const a = ((DEFAULT_START_DEG + progress * 360) * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** Angle of a point around the centre, clockwise from 12 o'clock, in radians (-PI, PI]. */
export function angleAround(x: number, y: number, cx: number, cy: number): number {
  'worklet';
  return Math.atan2(x - cx, -(y - cy));
}

/** Shortest signed turn from one angle to another, in radians. Positive is clockwise. */
export function angleDelta(from: number, to: number): number {
  'worklet';
  let d = to - from;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Adds a turn to the running total, never going beyond one full circle either way. */
export function accumulate(total: number, delta: number): number {
  'worklet';
  return Math.max(-TAU, Math.min(TAU, total + delta));
}

/**
 * Whether a touch may start a drawing. The ring is invisible, so it is not enough to ask people to
 * land on it: any touch round the word counts, and the arc is measured by the angle around the centre.
 */
export function canStartDraw(x: number, y: number, cx: number, cy: number, r: number): boolean {
  'worklet';
  const d = Math.hypot(x - cx, y - cy);
  return d >= DRAW_MIN && d <= r + DRAW_REACH;
}

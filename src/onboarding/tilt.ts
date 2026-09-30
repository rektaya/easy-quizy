// How the phone's tilt becomes a gentle nudge of the Map. The tilt is measured against where the phone
// was held a moment ago (the zero slowly follows the phone), so it works lying down or held up, and
// the result is smoothed, so the sky never jitters.

export type TiltState = {
  /** The orientation the tilt is measured from (radians), and whether it has been set yet. */
  baseRoll: number;
  basePitch: number;
  started: boolean;
  /** The smoothed nudge, each from -1 to 1: x to the right, y towards you. */
  x: number;
  y: number;
};

export const TILT_START: TiltState = { baseRoll: 0, basePitch: 0, started: false, x: 0, y: 0 };

/** A tilt of this many radians (about 26 degrees) is the strongest nudge. */
export const TILT_RANGE = 0.45;
const FOLLOW = 0.004; // how fast the zero follows the phone, per reading
const SMOOTH = 0.14; // how fast the nudge catches up with the tilt, per reading

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

/** One sensor reading in, the next state out. */
export function tiltStep(s: TiltState, roll: number, pitch: number): TiltState {
  'worklet';
  if (!s.started) return { baseRoll: roll, basePitch: pitch, started: true, x: 0, y: 0 };
  const baseRoll = s.baseRoll + (roll - s.baseRoll) * FOLLOW;
  const basePitch = s.basePitch + (pitch - s.basePitch) * FOLLOW;
  const tx = clamp((roll - baseRoll) / TILT_RANGE, -1, 1);
  const ty = clamp((pitch - basePitch) / TILT_RANGE, -1, 1);
  return { baseRoll, basePitch, started: true, x: s.x + (tx - s.x) * SMOOTH, y: s.y + (ty - s.y) * SMOOTH };
}

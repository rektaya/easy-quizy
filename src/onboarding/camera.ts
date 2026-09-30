// "Camera mode" on the Map: the phone is a camera pointed at the sky. Where the back of the phone
// points decides which part of the map is on screen.

/** Turning the phone this far (radians, 120 degrees) sideways scrolls across the whole width of the sky. */
export const SWEEP_X = (Math.PI * 2) / 3;
/** Raising the phone this far (120 degrees) from where the camera was switched on takes you from the bottom of the sky to the top. */
export const SWEEP_Y = (Math.PI * 2) / 3;

/**
 * The direction the back of the phone points in, from the rotation quaternion (device to world, with
 * x east, y north, z up). `az` is the compass direction in radians, `el` how far above the horizon.
 */
export function lookDirection(qx: number, qy: number, qz: number, qw: number): { az: number; el: number } {
  'worklet';
  // the camera looks along the device's -z axis: rotate (0, 0, -1) by the quaternion
  const fx = -2 * qy * qw - 2 * qx * qz;
  const fy = 2 * qx * qw - 2 * qy * qz;
  const fz = -1 + 2 * qx * qx + 2 * qy * qy;
  return { az: Math.atan2(fx, fy), el: Math.asin(Math.max(-1, Math.min(1, fz))) };
}

/** An angle brought into -PI..PI, so turning past north does not jump. */
export function wrapAngle(a: number): number {
  'worklet';
  const t = Math.PI * 2;
  return a - t * Math.round(a / t);
}

/**
 * How far the camera has moved since it was switched on. Sideways, in the sky's pixels: turning right
 * moves the view right (the sky's offset goes the other way, so `dx` is added to it). Up-and-down is
 * one-sided, because the sky is above you: `lift` is how far up the sky you are looking, 0 (the bottom
 * of the map, where you start) to 1 (the top), and looking lower than where you started changes nothing.
 * `rangeX` is how many pixels the sky can scroll sideways.
 */
export function viewOffset(
  az: number,
  el: number,
  baseAz: number,
  baseEl: number,
  rangeX: number,
): { dx: number; lift: number } {
  'worklet';
  return {
    dx: (wrapAngle(az - baseAz) / SWEEP_X) * rangeX,
    lift: Math.min(1, Math.max(0, (el - baseEl) / SWEEP_Y)),
  };
}

/** The starting elevation that makes looking in direction `el` mean being `lift` of the way up the sky. */
export function baseElFor(el: number, lift: number): number {
  'worklet';
  return el - lift * SWEEP_Y;
}

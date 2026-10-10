import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  MIN_COMMIT,
  TAU,
  accumulate,
  angleAround,
  angleDelta,
  canStartDraw,
  nextZone,
  snapValue,
} from './geometry';
import type { Segment } from './geometry';

// The Circle gesture: start anywhere round the word and draw either way round; hidden 30/30/30/10
// segments with haptic ticks; a snap in the last 10%. It draws nothing itself: it exposes everything the
// animation (StardustRing) reacts to, as shared values.

export const RING_STROKE = 14;
/** Room round the ring that the animation may draw in (the glow of the stars spills past the circle). */
export const RING_PAD = 36;

export type Ring = ReturnType<typeof useRing>;

function tickSection() {
  Haptics.selectionAsync().catch(() => {});
}
function tickKnow() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * `value` is the committed rating (0..1) or null while the word is still to be rated. Once it is set the
 * ring is locked and swipes fall through to the screen behind it.
 */
export function useRing(
  size: number,
  value: number | null,
  onCommit: (value: number) => void,
  /** Where the circle's box sits inside the area the gesture listens to. */
  ox = 0,
  oy = 0,
) {
  const c = size / 2;
  const r = c - RING_STROKE;

  const progress = useSharedValue(0); // what the finger has drawn, 0..1
  const display = useDerivedValue(() => snapValue(progress.value)); // the last 10% shows as a full ring
  const locked = useSharedValue(false);
  const dragging = useSharedValue(false);
  const armed = useSharedValue(false);
  const startRad = useSharedValue(0); // where the drawing began, clockwise from 12 o'clock
  const direction = useSharedValue(1); // 1 clockwise, -1 the other way
  const turned = useSharedValue(0);
  const lastAngle = useSharedValue(0);
  const zone = useSharedValue<Segment>(1);
  const speed = useSharedValue(0); // how fast the finger is going round, 0..1, fading when it stops
  const pulse = useSharedValue(0); // 1 the moment a 30/60/90% line is crossed, then fading to 0
  const burst = useSharedValue(0); // 0 while idle; runs 0 -> 1 when a word is marked known
  const finish = useSharedValue(0); // 0 while idle; runs 0 -> 1 when a ring is let go before the end: it then completes itself

  useFrameCallback(() => {
    speed.value = speed.value * 0.9;
  });

  const gesture = Gesture.Pan()
    .enabled(value === null)
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      armed.value = !locked.value && canStartDraw(e.x - ox, e.y - oy, c, c, r);
      if (armed.value) {
        const a = angleAround(e.x - ox, e.y - oy, c, c);
        startRad.value = a;
        lastAngle.value = a;
        turned.value = 0;
        direction.value = 1;
      }
    })
    .onStart(() => {
      'worklet';
      if (!armed.value) return;
      finish.value = 0; // a drawing started during an undo takes over from it
      progress.value = 0;
      dragging.value = true;
      zone.value = 1;
    })
    .onUpdate((e) => {
      'worklet';
      if (!armed.value) return;
      if (Math.hypot(e.x - ox - c, e.y - oy - c) < 24) return;
      const a = angleAround(e.x - ox, e.y - oy, c, c);
      const delta = angleDelta(lastAngle.value, a);
      turned.value = accumulate(turned.value, delta);
      lastAngle.value = a;
      direction.value = turned.value < 0 ? -1 : 1;
      progress.value = Math.min(1, Math.abs(turned.value) / TAU);
      speed.value = Math.max(speed.value, Math.min(1, (Math.abs(delta) * 60) / 8));

      const z = nextZone(progress.value, zone.value);
      if (z !== zone.value) {
        zone.value = z;
        pulse.value = 1;
        pulse.value = withTiming(0, { duration: 650 });
        scheduleOnRN(z === 4 ? tickKnow : tickSection);
      }
    })
    .onFinalize((_e, success) => {
      'worklet';
      const wasArmed = armed.value;
      armed.value = false;
      if (!wasArmed || !dragging.value) return;
      dragging.value = false;
      const p = progress.value;
      if (success && p >= MIN_COMMIT) {
        const v = snapValue(p);
        progress.value = v;
        locked.value = true;
        if (v >= 0.9) {
          burst.value = 0;
          burst.value = withTiming(1, { duration: 2200 });
        } else {
          finish.value = 0;
          finish.value = withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) });
        }
        scheduleOnRN(onCommit, v);
      } else {
        zone.value = 1;
        progress.value = withTiming(0, { duration: 220 });
      }
    });

  // Undo: the ring is drawn backwards, slowly and at one even speed all the way round. A ring that
  // completed itself first draws back its self-made part, then what the finger had drawn; each part gets
  // the time that is its share of the whole circle, so the front never speeds up or slows down.
  const reset = () => {
    const FULL_TURN_MS = 1200; // time for a whole circle to unwind
    const drawn = progress.value; // what the finger drew (a "know" ring counts as 1)
    const made = finish.value; // how much of the rest the ring had completed by itself, 0..1
    const madeMs = FULL_TURN_MS * (1 - drawn) * made;
    const drawnMs = FULL_TURN_MS * drawn;
    locked.value = false;
    burst.value = 0;
    pulse.value = 0;
    zone.value = 1;
    if (made > 0) {
      finish.value = withTiming(0, { duration: madeMs, easing: Easing.linear });
      progress.value = withDelay(madeMs, withTiming(0, { duration: drawnMs, easing: Easing.linear }));
    } else {
      progress.value = withTiming(0, { duration: drawnMs, easing: Easing.linear });
    }
  };

  // Keep the ring in step with the committed rating. A rating that is already there when the ring appears
  // (restored) is shown at rest, without the animation; a rating the finger has just made is left alone
  // (the ring is already locked and animating); and when the rating goes away (undo) the ring empties.
  useEffect(() => {
    if (value === null) {
      if (locked.value) reset();
    } else if (!locked.value) {
      progress.value = value;
      locked.value = true;
      if (value >= 0.9) burst.value = 1;
      else finish.value = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // The shared values are kept together in `v`, apart from the gesture and `reset`: a worklet may only
  // capture things it can copy to the UI thread, and a gesture is not one of them. So the animations
  // capture `v`, never the whole ring.
  const v = { progress, display, locked, dragging, startRad, direction, speed, pulse, burst, finish };
  return { size, c, r, v, gesture, reset };
}

/** Red -> amber -> green along 0..1, as [r, g, b] in 0..255. The colour of a rating. */
export function ratingColor(s: number): [number, number, number] {
  'worklet';
  const red = [229, 72, 77];
  const amber = [242, 176, 30];
  const green = [63, 185, 80];
  const t = Math.min(1, Math.max(0, s));
  const [a, b, k] = t < 0.5 ? [red, amber, t * 2] : [amber, green, (t - 0.5) * 2];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function rgba(c: [number, number, number], alpha: number): string {
  'worklet';
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
}

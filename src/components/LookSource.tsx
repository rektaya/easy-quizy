import { SensorType, useAnimatedReaction, useAnimatedSensor, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { baseElFor, lookDirection, viewOffset } from '../onboarding/camera';
import { clampPan, panRange } from '../onboarding/viewport';

type Props = {
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  scale: SharedValue<number>;
  /** While true (a theme is open) the camera pauses and starts again from wherever it is when it resumes. */
  paused: SharedValue<boolean>;
  stage: { w: number; h: number };
  world: { w: number; h: number };
};

// Camera mode: where the back of the phone points moves the view across the sky. It draws nothing.
// The sky is above you, so the view starts at the BOTTOM of the map (it glides there when the mode is
// switched on) and you have to raise the phone to climb; looking lower than you started changes nothing.
// The sensor only runs while this is mounted. The view follows with a little easing, so it glides.
export function LookSource({ panX, panY, scale, paused, stage, world }: Props) {
  const { sensor } = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
  const base = useSharedValue({ started: false, resumed: false, az: 0, el: 0, panX: 0 });
  const rangeX = Math.max(0, world.w - stage.w);
  const rangeY = Math.max(0, world.h - stage.h);

  useAnimatedReaction(
    () => sensor.value,
    (s) => {
      if (paused.value) {
        base.value = { ...base.value, started: false, resumed: true };
        return;
      }
      const { az, el } = lookDirection(s.qx, s.qy, s.qz, s.qw);
      const [lo, hi] = panRange(scale.value, stage.h, world.h);
      if (!base.value.started) {
        // the first time, the view heads for the bottom of the sky; after a theme was open it stays where it is
        const lift = base.value.resumed && hi > lo ? (panY.value - lo) / (hi - lo) : 0;
        base.value = { started: true, resumed: base.value.resumed, az, el: baseElFor(el, lift), panX: panX.value };
        return;
      }
      const { dx, lift } = viewOffset(az, el, base.value.az, base.value.el, rangeX);
      const tx = clampPan(base.value.panX - dx, scale.value, stage.w, world.w);
      const ty = lo + lift * (hi - lo);
      panX.value += (tx - panX.value) * 0.18;
      panY.value += (ty - panY.value) * 0.18;
    },
    [rangeX, stage.w, stage.h, world.w, world.h],
  );
  return null;
}

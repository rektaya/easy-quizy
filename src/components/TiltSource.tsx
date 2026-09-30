import { SensorType, useAnimatedReaction, useAnimatedSensor, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { TILT_START, tiltStep } from '../onboarding/tilt';
import type { TiltState } from '../onboarding/tilt';

// Reads the phone's rotation and writes a smoothed nudge (-1..1) into `x` and `y`. It draws nothing.
// The sensor only runs while this is mounted, so the Map mounts it only while it is on screen.
export function TiltSource({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  const { sensor } = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
  const state = useSharedValue<TiltState>(TILT_START);
  useAnimatedReaction(
    () => sensor.value,
    (v) => {
      const next = tiltStep(state.value, v.roll, v.pitch);
      state.value = next;
      x.value = next.x;
      y.value = next.y;
    },
    [],
  );
  return null;
}

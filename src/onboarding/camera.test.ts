import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SWEEP_X, SWEEP_Y, baseElFor, lookDirection, viewOffset, wrapAngle } from './camera.ts';

const close = (a: number, b: number, msg = '') => assert.ok(Math.abs(a - b) < 1e-9, `${msg} ${a} vs ${b}`);

test('a phone lying face up looks straight down; held upright and facing north it looks at the horizon', () => {
  const flat = lookDirection(0, 0, 0, 1);
  close(flat.el, -Math.PI / 2, 'flat');
  // stood up by a quarter turn about the east axis, the back faces north
  const s = Math.SQRT1_2;
  const up = lookDirection(s, 0, 0, s);
  close(up.el, 0, 'upright');
  close(up.az, 0, 'north');
});

test('turning the phone about the vertical moves the compass direction', () => {
  const s = Math.SQRT1_2;
  // upright facing north, then turned a quarter turn to the right (clockwise seen from above)
  const half = Math.PI / 4;
  const yaw = { w: Math.cos(-half), z: Math.sin(-half) }; // rotation about the up axis
  // compose yaw * upright
  const qw = yaw.w * s;
  const qx = yaw.w * s;
  const qy = yaw.z * s;
  const qz = yaw.z * s;
  const d = lookDirection(qx, qy, qz, qw);
  close(d.el, 0, 'still on the horizon');
  close(Math.abs(wrapAngle(d.az)), Math.PI / 2, 'a quarter turn');
});

test('angles wrap, and the view moves the way the camera turns', () => {
  close(wrapAngle(Math.PI * 2 + 0.3), 0.3);
  close(wrapAngle(-Math.PI * 2 - 0.3), -0.3);
  close(viewOffset(SWEEP_X / 2, 0, 0, 0, 400).dx, 200, 'half the sweep, half the range');
  close(viewOffset(Math.PI - 0.05, 0, -Math.PI + 0.05, 0, 400).dx, (-0.1 / SWEEP_X) * 400, 'across north');
});

test('the sky is above you: you start at the bottom, raising the phone climbs, lowering it does nothing', () => {
  assert.equal(viewOffset(0, 0, 0, 0, 400).lift, 0, 'at the start you are at the bottom');
  assert.equal(viewOffset(0, -0.8, 0, 0, 400).lift, 0, 'looking lower changes nothing');
  close(viewOffset(0, SWEEP_Y / 2, 0, 0, 400).lift, 0.5, 'halfway up');
  assert.equal(viewOffset(0, SWEEP_Y * 2, 0, 0, 400).lift, 1, 'never past the top');
  // resuming from a view that is 40% of the way up keeps that view
  const base = baseElFor(0.3, 0.4);
  close(viewOffset(0, 0.3, 0, base, 400).lift, 0.4, 'same view');
});

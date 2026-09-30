import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TILT_RANGE, TILT_START, tiltStep } from './tilt.ts';

test('the first reading is the zero, whatever the phone is doing', () => {
  const s = tiltStep(TILT_START, 1.2, -0.7);
  assert.equal(s.x, 0);
  assert.equal(s.y, 0);
  assert.equal(s.started, true);
});

test('tilting moves the nudge smoothly, never past 1, and in the right direction', () => {
  let s = tiltStep(TILT_START, 0, 0);
  s = tiltStep(s, TILT_RANGE * 3, -TILT_RANGE * 3);
  assert.ok(s.x > 0 && s.x < 0.3, 'it eases in, not a jump');
  assert.ok(s.y < 0 && s.y > -0.3);
  for (let i = 0; i < 200; i++) s = tiltStep(s, TILT_RANGE * 3, -TILT_RANGE * 3);
  assert.ok(s.x <= 1 && s.y >= -1, 'it never passes 1');
});

test('holding the phone still slowly brings the nudge back to zero', () => {
  let s = tiltStep(TILT_START, 0, 0);
  for (let i = 0; i < 40; i++) s = tiltStep(s, 0.3, 0);
  const early = s.x;
  assert.ok(early > 0.3);
  for (let i = 0; i < 1500; i++) s = tiltStep(s, 0.3, 0);
  assert.ok(Math.abs(s.x) < 0.05, `still at ${s.x}`);
});

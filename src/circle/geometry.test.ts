import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_START_DEG,
  TAU,
  accumulate,
  angleAround,
  angleDelta,
  gradeOf,
  isKnown,
  nextZone,
  canStartDraw,
  pointOnRing,
  segmentOf,
  snapValue,
  GOOD_MAX,
  adjustCeiling,
} from './geometry.ts';

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('segments split 30/30/30/10', () => {
  assert.equal(segmentOf(0), 1);
  assert.equal(segmentOf(0.299), 1);
  assert.equal(segmentOf(0.3), 2);
  assert.equal(segmentOf(0.599), 2);
  assert.equal(segmentOf(0.6), 3);
  assert.equal(segmentOf(0.899), 3);
  assert.equal(segmentOf(0.9), 4);
  assert.equal(segmentOf(1), 4);
});

test('segments map onto scheduler grades', () => {
  assert.equal(gradeOf(0.1), 'again');
  assert.equal(gradeOf(0.4), 'hard');
  assert.equal(gradeOf(0.7), 'good');
  assert.equal(gradeOf(0.95), 'easy');
});

test('only the last segment counts as known and snaps to a full ring', () => {
  assert.equal(isKnown(0.89), false);
  assert.equal(isKnown(0.9), true);
  assert.equal(snapValue(0.89), 0.89);
  assert.equal(snapValue(0.92), 1);
});

test('angles are measured clockwise from 12 o clock', () => {
  near(angleAround(100, 0, 100, 100), 0); // top
  near(angleAround(200, 100, 100, 100), Math.PI / 2); // right
  near(angleAround(100, 200, 100, 100), Math.PI); // bottom
  near(angleAround(0, 100, 100, 100), -Math.PI / 2); // left
});

test('turning across the bottom of the circle does not jump', () => {
  // from just before 6 o clock (3.0 rad) to just after it (-3.0 rad) is a small clockwise step
  near(angleDelta(3.0, -3.0), TAU - 6.0);
  assert.ok(angleDelta(3.0, -3.0) > 0);
  // and back again is a small counter-clockwise step
  assert.ok(angleDelta(-3.0, 3.0) < 0);
});

test('a full lap in either direction adds up to one circle, wherever it starts', () => {
  for (const startDeg of [0, 65, 200, 310]) {
    for (const sign of [1, -1]) {
      let total = 0;
      let last = (startDeg * Math.PI) / 180;
      const steps = 72;
      for (let i = 1; i <= steps; i++) {
        const a = last + sign * (TAU / steps);
        // convert back to a touch point on the ring, then read its angle again
        const x = 100 + 80 * Math.sin(a);
        const y = 100 - 80 * Math.cos(a);
        const seen = angleAround(x, y, 100, 100);
        total = accumulate(total, angleDelta(last, seen));
        last = seen;
      }
      near(Math.abs(total), TAU, 1e-6);
      assert.equal(Math.sign(total), sign, `start ${startDeg} direction ${sign}`);
    }
  }
});

test('the running total never goes beyond one full circle', () => {
  assert.equal(accumulate(TAU - 0.01, 1), TAU);
  assert.equal(accumulate(-TAU + 0.01, -1), -TAU);
  near(accumulate(TAU, -0.5), TAU - 0.5); // backing off from a full circle works straight away
});

test('a touch starts a drawing anywhere round the word, not only on the ring', () => {
  const c = 150;
  const r = 146;
  assert.equal(canStartDraw(c, c - r, c, c, r), true); // on the ring
  assert.equal(canStartDraw(c, c - r + 30, c, c, r), true); // a little inside
  assert.equal(canStartDraw(c + 50, c, c, c, r), true); // on the word itself, still fine
  assert.equal(canStartDraw(c, c - r - 40, c, c, r), true); // outside the ring
  assert.equal(canStartDraw(c + 5, c, c, c, r), false); // the exact centre: no stable angle
  assert.equal(canStartDraw(c, c - r - 800, c, c, r), false); // far away
});

test('haptic sections tick at 30 60 and 90 percent', () => {
  assert.equal(nextZone(0.1, 1), 1);
  assert.equal(nextZone(0.3, 1), 2);
  assert.equal(nextZone(0.61, 2), 3);
  assert.equal(nextZone(0.9, 3), 4);
  assert.equal(nextZone(0.5, 4), 2); // a jump back crosses the boundaries in between
});

test('a finger resting on a boundary does not flicker between sections', () => {
  let z = nextZone(0.301, 1); // just crossed into section 2
  assert.equal(z, 2);
  z = nextZone(0.295, z); // wobbles back a hair: still section 2
  assert.equal(z, 2);
  z = nextZone(0.28, z); // clearly back: leaves section 2
  assert.equal(z, 1);
});

test('the ghost demo starts at the default start angle', () => {
  const { x, y } = pointOnRing(0, 100, 100, 80);
  near(x, 100 + 80 * Math.sin((DEFAULT_START_DEG * Math.PI) / 180));
  assert.ok(y < 100);
});

test('after the meaning is shown, an answer can be raised to good at most, or back to where it was', () => {
  assert.equal(segmentOf(GOOD_MAX), 3);
  assert.equal(isKnown(snapValue(GOOD_MAX)), false);
  assert.equal(adjustCeiling(0.2), GOOD_MAX);
  assert.equal(adjustCeiling(0.95), 0.95); // a word first drawn as known can be put back
});

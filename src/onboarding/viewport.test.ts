import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampPan, minScale, panRange, snapScale } from './viewport.ts';

test('close up, the sky fills the screen and pan stays inside it', () => {
  assert.deepEqual(panRange(1, 400, 840), [-440, 0]);
  assert.equal(clampPan(50, 1, 400, 840), 0);
  assert.equal(clampPan(-900, 1, 400, 840), -440);
});

test('pulled all the way back the whole sky is on screen, centred', () => {
  const s = minScale(400, 800, 840, 1520); // 0.476: limited by the width
  assert.ok(Math.abs(s - 400 / 840) < 1e-9);
  const [lo, hi] = panRange(s, 400, 840);
  assert.ok(Math.abs(lo - hi) < 1e-6, 'no room to move sideways');
  const [vlo, vhi] = panRange(s, 800, 1520); // taller than the picture: centred too, or a little play
  assert.ok(vlo <= vhi + 1e-6 || Math.abs(vlo - vhi) < 1e-6);
});

test('between the two there is always some room, and the sky edge never comes inside the screen', () => {
  for (const s of [1, 0.9, 0.7, 0.55]) {
    const [lo, hi] = panRange(s, 400, 840);
    for (const p of [lo, hi, (lo + hi) / 2]) {
      const left = 200 + s * (p - 200); // where the sky's left edge lands on screen
      const right = 200 + s * (p + 840 - 200);
      if (840 * s >= 400) assert.ok(left <= 1e-6 && right >= 400 - 1e-6, `scale ${s}: ${left}..${right}`);
    }
  }
  assert.equal(minScale(400, 800, 300, 300), 1, 'never zooms in past 1');
});

test('the map only rests close up or fully pulled back, and a pinch of about a fifth of the way flips it', () => {
  const low = 0.4;
  assert.equal(snapScale(0.9, 1, low), 1, 'a small pinch springs back');
  assert.equal(snapScale(0.85, 1, low), low, 'a real pinch from close goes to the whole sky');
  assert.equal(snapScale(low, 1, low), low);
  assert.equal(snapScale(0.45, low, low), low, 'a small spread springs back');
  assert.equal(snapScale(0.55, low, low), 1, 'a real spread from far goes close');
  assert.equal(snapScale(1, low, low), 1);
  assert.equal(snapScale(0.7, 1, 1), 1, 'nothing to snap to when the sky fits');
  for (const s of [0.41, 0.6, 0.8, 0.99]) for (const start of [1, low]) assert.ok([1, low].includes(snapScale(s, start, low)), 'only ever one of the two');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampPan, minScale, panRange } from './viewport.ts';

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

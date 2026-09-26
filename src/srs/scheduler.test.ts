import assert from 'node:assert/strict';
import { test } from 'node:test';
import { firstStudy, isDue, reviewCard, seedCard, whenLabel } from './scheduler.ts';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 26, 10);

test('a word rated near green is seeded with a longer first interval than one near red', () => {
  const red = seedCard(0.1, T0);
  const amber = seedCard(0.5, T0);
  const green = seedCard(0.8, T0);
  assert.ok(red.due < amber.due && amber.due < green.due, 'later and later');
  assert.ok(red.stability < green.stability);
});

test('a card survives being saved as JSON', () => {
  const card = seedCard(0.5, T0);
  assert.deepEqual(JSON.parse(JSON.stringify(card)), card);
  reviewCard(JSON.parse(JSON.stringify(card)), 0.7, T0 + 3 * DAY); // and still reviews
});

test('a card is due only once its day has come', () => {
  const card = seedCard(0.5, T0);
  assert.equal(isDue(card, T0 + 1000), false);
  assert.equal(isDue(card, card.due), true);
  assert.equal(isDue(card, card.due + DAY), true);
});

test('remembering it when due pushes the next review far out, forgetting it brings it back close', () => {
  const card = seedCard(0.5, T0);
  const good = reviewCard(card, 0.7, card.due);
  const again = reviewCard(card, 0.05, card.due);
  assert.ok(good.due - card.due > 2 * (card.due - T0), 'interval grows');
  assert.ok(again.due < good.due);
  assert.ok(again.lapses >= 0);
});

test('the first Study builds on the Explore rating', () => {
  const low = firstStudy(0.1, T0, 0.5, T0 + 1000);
  const high = firstStudy(0.8, T0, 0.5, T0 + 1000);
  assert.ok(high.stability > low.stability, 'a higher Explore rating still counts after Study');
});

test('when-labels read naturally', () => {
  assert.equal(whenLabel(T0, T0), 'now');
  assert.equal(whenLabel(T0 + DAY / 2, T0), 'tomorrow');
  assert.equal(whenLabel(T0 + 5 * DAY, T0), 'in 5 days');
  assert.equal(whenLabel(T0 + 21 * DAY, T0), 'in 3 weeks');
  assert.equal(whenLabel(T0 + 90 * DAY, T0), 'in 3 months');
});

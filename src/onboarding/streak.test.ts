import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityByDay, currentStreak, dayKey, weekOf } from './streak.ts';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 10, 21, 15); // a Wednesday

test('a day counts for every word rated or reviewed, and an old card counts once on its last review', () => {
  const by = activityByDay(
    { a: { at: at(2026, 10, 20) }, b: { at: at(2026, 10, 20, 18) } },
    [{ id: 'a', at: at(2026, 10, 21) }],
    { a: { lastReview: at(2026, 10, 21) }, c: { lastReview: at(2026, 10, 18) }, d: { lastReview: null } },
  );
  assert.equal(by['2026-10-20'], 2);
  assert.equal(by['2026-10-21'], 1); // the review is in the log, so its card is not counted twice
  assert.equal(by['2026-10-18'], 1);
});

test('the streak counts the days in a row up to today, and still stands before anything is done today', () => {
  const days = (...d: number[]) => Object.fromEntries(d.map((x) => [dayKey(at(2026, 10, x)), 1]));
  assert.equal(currentStreak(days(19, 20, 21), NOW), 3);
  assert.equal(currentStreak(days(19, 20), NOW), 2, 'nothing yet today');
  assert.equal(currentStreak(days(17, 18, 20, 21), NOW), 2, 'a gap breaks it');
  assert.equal(currentStreak(days(17, 18), NOW), 0, 'two days without work');
  assert.equal(currentStreak({}, NOW), 0);
});

test('the week starts on Monday and knows today, the days to come and the days worked', () => {
  const week = weekOf({ [dayKey(at(2026, 10, 19))]: 4, [dayKey(at(2026, 10, 21))]: 1 }, NOW);
  assert.equal(week.length, 7);
  assert.deepEqual(week.map((d) => d.key), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
  assert.deepEqual(week.map((d) => d.done), [true, false, true, false, false, false, false]);
  assert.equal(week.findIndex((d) => d.today), 2);
  assert.deepEqual(week.map((d) => d.future), [false, false, false, true, true, true, true]);
  // on a Sunday the week still starts on the Monday before
  assert.equal(weekOf({}, at(2026, 10, 25))[0].key, '2026-10-19');
});

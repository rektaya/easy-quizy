import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayKey, dayProgress, exploreByDay, studyByDay, weekOf } from './streak.ts';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 10, 21, 15); // a Wednesday

test('only reviews in Study count, and an old card counts once on its last review', () => {
  const by = studyByDay(
    [{ id: 'a', at: at(2026, 10, 20) }, { id: 'b', at: at(2026, 10, 20, 18) }, { id: 'a', at: at(2026, 10, 21) }],
    { a: { lastReview: at(2026, 10, 21) }, c: { lastReview: at(2026, 10, 18) }, d: { lastReview: null } },
  );
  assert.equal(by['2026-10-20'], 2);
  assert.equal(by['2026-10-21'], 1); // the review is in the log, so its card is not counted twice
  assert.equal(by['2026-10-18'], 1);
});

test('the week starts on Monday and knows today, the days to come and the days studied', () => {
  const week = weekOf({ [dayKey(at(2026, 10, 19))]: 4, [dayKey(at(2026, 10, 21))]: 1 }, NOW);
  assert.equal(week.length, 7);
  assert.deepEqual(week.map((d) => d.key), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
  assert.deepEqual(week.map((d) => d.done), [true, false, true, false, false, false, false]);
  assert.equal(week.findIndex((d) => d.today), 2);
  assert.deepEqual(week.map((d) => d.future), [false, false, false, true, true, true, true]);
  // on a Sunday the week still starts on the Monday before
  assert.equal(weekOf({}, at(2026, 10, 25))[0].key, '2026-10-19');
});

test('the goal of a day is the words of a session: nothing, part of it, all of it, and more than it', () => {
  assert.equal(dayProgress(0, 20), 0);
  assert.equal(dayProgress(5, 20), 0.25);
  assert.equal(dayProgress(20, 20), 1);
  assert.equal(dayProgress(35, 20), 1);
  assert.equal(dayProgress(3, 0), 0);
});

test('words met in Explore light a day too, for half as much, and never to gold without studying', () => {
  assert.equal(dayProgress(0, 20, 5), 0.125); // only meeting a quarter of the goal
  assert.equal(dayProgress(0, 20, 20), 0.5); // meeting the whole goal is the middle of the scale
  assert.equal(dayProgress(0, 20, 200), 0.5, 'no more than the middle without studying');
  assert.equal(dayProgress(10, 20, 20), 1, 'half studied and all met is a full day');
  assert.equal(dayProgress(20, 20, 0), 1);
  assert.equal(dayProgress(5, 20, 10), 0.5); // a quarter studied, half the goal met
});

test('the words met are counted for the day they were rated', () => {
  const by = exploreByDay({ a: { at: at(2026, 10, 20) }, b: { at: at(2026, 10, 20, 18) }, c: { at: at(2026, 10, 21) } });
  assert.equal(by['2026-10-20'], 2);
  assert.equal(by['2026-10-21'], 1);
});

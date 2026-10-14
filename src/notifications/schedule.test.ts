import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextTimeOfDay, planReminder, reminderText } from './schedule.ts';

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

test('the next time of day is today when it has not passed yet, otherwise tomorrow', () => {
  assert.equal(nextTimeOfDay(at(2026, 10, 14, 10), 19, 0), at(2026, 10, 14, 19));
  assert.equal(nextTimeOfDay(at(2026, 10, 14, 20), 19, 0), at(2026, 10, 15, 19));
});

test('with enough new words waiting the reminder is at the next chosen time', () => {
  const now = at(2026, 10, 14, 10);
  assert.deepEqual(planReminder(now, 19, 0, 7, []), { at: at(2026, 10, 14, 19), count: 7 });
});

test('a few new words are not worth a reminder, a review that is due is', () => {
  const now = at(2026, 10, 14, 10);
  assert.equal(planReminder(now, 19, 0, 2, []), null);
  assert.deepEqual(planReminder(now, 19, 0, 2, [at(2026, 10, 14, 8)]), { at: at(2026, 10, 14, 19), count: 1 });
});

test('with nothing ready yet it waits for the first day a review falls due', () => {
  const now = at(2026, 10, 14, 10);
  const plan = planReminder(now, 19, 0, 0, [at(2026, 10, 17, 3), at(2026, 10, 20, 9)]);
  assert.deepEqual(plan, { at: at(2026, 10, 17, 19), count: 1 });
});

test('when nothing will ever be ready there is no reminder, and the text counts the words', () => {
  assert.equal(planReminder(at(2026, 10, 14, 10), 19, 0, 0, []), null);
  assert.equal(reminderText(1).body, '1 word is waiting for you');
  assert.equal(reminderText(12).body, '12 words are waiting for you');
});

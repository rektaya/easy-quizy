import type { StoredCard } from '../srs/scheduler.ts';
import type { Rating } from '../state/ratings';

// The days the user worked with their words: a day counts when at least one word was rated in Explore or reviewed in
// Study. From that: how many days in a row (the streak), which days of this week, and how many words today.

export type ReviewLogEntry = { id: string; at: number };
type Day = string;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A calendar day on the phone's clock, "2026-10-19". */
export function dayKey(ms: number): Day {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** How many words were worked with on each day. A word studied before the log existed counts once, on the day of its last review. */
export function activityByDay(
  ratings: Record<string, Pick<Rating, 'at'>>,
  reviews: ReviewLogEntry[],
  cards: Record<string, Pick<StoredCard, 'lastReview'>>,
): Record<Day, number> {
  const out: Record<Day, number> = {};
  const add = (ms: number) => {
    const k = dayKey(ms);
    out[k] = (out[k] ?? 0) + 1;
  };
  for (const r of Object.values(ratings)) add(r.at);
  const logged = new Set(reviews.map((r) => r.id));
  for (const r of reviews) add(r.at);
  for (const [id, c] of Object.entries(cards)) if (!logged.has(id) && c.lastReview !== null) add(c.lastReview);
  return out;
}

/** The days in a row, up to today. Before anything is done today the streak still stands (it counts from yesterday), so it is not 0 all morning. */
export function currentStreak(byDay: Record<Day, number>, now: number): number {
  let day = now;
  if (!byDay[dayKey(day)]) day -= DAY_MS;
  let n = 0;
  while (byDay[dayKey(day)]) {
    n += 1;
    day -= DAY_MS;
  }
  return n;
}

export type WeekDay = { key: Day; letter: string; today: boolean; future: boolean; done: boolean };

const LETTERS = ['m', 't', 'w', 't', 'f', 's', 's'];

/** The seven days of this week, Monday first. */
export function weekOf(byDay: Record<Day, number>, now: number): WeekDay[] {
  const today = new Date(now);
  const sinceMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - sinceMonday, 12);
  return LETTERS.map((letter, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12);
    const key = dayKey(d.getTime());
    return { key, letter, today: key === dayKey(now), future: d.getTime() > now && key !== dayKey(now), done: !!byDay[key] };
  });
}

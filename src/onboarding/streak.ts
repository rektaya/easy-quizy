import type { StoredCard } from '../srs/scheduler.ts';

// The days the user studied: a day counts when at least one word was reviewed in Study (the repeating is what the
// schedule rests on; rating words in Explore is only meeting them). From that: which days of this week, and how many.
// There is no streak that burns down: a missed day just stays empty.

export type ReviewLogEntry = { id: string; at: number };
type Day = string;

/** A calendar day on the phone's clock, "2026-10-19". */
export function dayKey(ms: number): Day {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** How many words were reviewed on each day. A word studied before the log existed counts once, on the day of its last review. */
export function studyByDay(
  reviews: ReviewLogEntry[],
  cards: Record<string, Pick<StoredCard, 'lastReview'>>,
): Record<Day, number> {
  const out: Record<Day, number> = {};
  const add = (ms: number) => {
    const k = dayKey(ms);
    out[k] = (out[k] ?? 0) + 1;
  };
  const logged = new Set(reviews.map((r) => r.id));
  for (const r of reviews) add(r.at);
  for (const [id, c] of Object.entries(cards)) if (!logged.has(id) && c.lastReview !== null) add(c.lastReview);
  return out;
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

/** How many words were met (rated in Explore) on each day. */
export function exploreByDay(ratings: Record<string, { at: number }>): Record<Day, number> {
  const out: Record<Day, number> = {};
  for (const r of Object.values(ratings)) {
    const k = dayKey(r.at);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * How much of the goal of a day was done (0..1; the goal is the words of a session). Studying counts in full: the words
 * reviewed in Study against the goal. Meeting words in Explore counts for half as much, and a day of only exploring never
 * goes past the middle of the scale (it is never a golden day): the golden star is for studying.
 */
export function dayProgress(reviewed: number, goal: number, explored = 0): number {
  if (goal <= 0) return 0;
  const studied = Math.min(1, reviewed / goal);
  const met = 0.5 * Math.min(1, explored / goal);
  const total = Math.min(1, studied + met);
  return reviewed > 0 ? total : Math.min(total, 0.5);
}

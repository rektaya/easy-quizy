import { Rating, createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';
import type { Card, Grade as FsrsGrade } from 'ts-fsrs';
import { gradeOf } from '../circle/geometry.ts';
import type { Grade } from '../circle/geometry';

// Spaced repetition with FSRS. It keeps three numbers per word (stability, difficulty and when it
// is due) and works out from each rating when to show the word again.
//
// Two choices: intervals are whole days (no minutes-long "learning steps", since a session is a
// small batch and words come back on later days), and there is no fuzz, so results are repeatable.
const scheduler = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: false }));

const RATING: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** A card as it is saved on the device: plain numbers, so it survives JSON. */
export type StoredCard = {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: number | null;
};

const toStored = (c: Card): StoredCard => ({
  due: c.due.getTime(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsedDays: c.elapsed_days,
  scheduledDays: c.scheduled_days,
  learningSteps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  lastReview: c.last_review ? c.last_review.getTime() : null,
});

const fromStored = (c: StoredCard): Card => ({
  due: new Date(c.due),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsedDays,
  scheduled_days: c.scheduledDays,
  learning_steps: c.learningSteps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last_review: c.lastReview === null ? undefined : new Date(c.lastReview),
});

/** Rate a card (a Circle value, 0..1) at a moment in time. */
export function reviewCard(card: StoredCard, value: number, now: number): StoredCard {
  const result = scheduler.next(fromStored(card), new Date(now), RATING[gradeOf(value)]);
  return toStored(result.card);
}

/**
 * A word's very first card, seeded from how the user rated it in Explore: a word drawn near green
 * starts with a longer first interval than one drawn near red (Anki starts every card the same).
 */
export function seedCard(exploreValue: number, exploreAt: number): StoredCard {
  const empty = createEmptyCard(new Date(exploreAt));
  return reviewCard(toStored(empty), exploreValue, exploreAt);
}

/** The first Study of a word: the Explore rating seeds the card, then the Study rating reviews it. */
export function firstStudy(exploreValue: number, exploreAt: number, studyValue: number, now: number): StoredCard {
  return reviewCard(seedCard(exploreValue, exploreAt), studyValue, now);
}

export const isDue = (card: StoredCard, now: number) => card.due <= now;

/** "later today", "tomorrow", "in 5 days"... for when something is next due. */
export function whenLabel(due: number, now: number): string {
  const days = Math.ceil((due - now) / DAY_MS);
  if (days <= 0) return 'now';
  if (days === 1) return 'tomorrow';
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}

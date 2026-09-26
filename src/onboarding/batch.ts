import type { Word } from '../data/words';
import { isDue } from '../srs/scheduler.ts';
import type { StoredCard } from '../srs/scheduler.ts';
import type { Rating } from '../state/ratings';

/** New words per Study batch. */
export const NEW_PER_BATCH = 5;
/** Reviews per Study batch. */
export const REVIEWS_PER_BATCH = 10;
/** When this many gathered words are waiting to be studied, Explore pauses until some are learned. */
export const EXPLORE_LOCK_AT = 20;

type Ratings = Record<string, Rating>;
type Cards = Record<string, StoredCard>;

export type BatchItem = { word: Word; isNew: boolean };

/** Gathered words that have never been studied: the pile waiting for a Study session. */
export function waitingWords(words: Word[], ratings: Ratings, cards: Cards): Word[] {
  return words.filter((w) => ratings[w.id] && !ratings[w.id].known && !cards[w.id]);
}

/** Studied words whose review day has come, the most overdue first. */
export function dueWords(words: Word[], ratings: Ratings, cards: Cards, now: number): Word[] {
  return words
    .filter((w) => ratings[w.id] && cards[w.id] && isDue(cards[w.id], now))
    .sort((a, b) => cards[a.id].due - cards[b.id].due);
}

/**
 * A Study batch: the reviews that are due (up to 10), then a few new words from the pile (up to
 * 5, the ones rated lowest first: the ones the user most needs).
 */
export function makeBatch(
  words: Word[],
  ratings: Ratings,
  cards: Cards,
  now: number,
  limits = { reviews: REVIEWS_PER_BATCH, fresh: NEW_PER_BATCH },
): BatchItem[] {
  const reviews = dueWords(words, ratings, cards, now).slice(0, limits.reviews);
  const fresh = waitingWords(words, ratings, cards)
    .sort((a, b) => ratings[a.id].value - ratings[b.id].value)
    .slice(0, limits.fresh);
  return [
    ...reviews.map((word) => ({ word, isNew: false })),
    ...fresh.map((word) => ({ word, isNew: true })),
  ];
}

/** When the next review comes up, if nothing is due yet. */
export function nextDue(words: Word[], ratings: Ratings, cards: Cards): number | null {
  const dues = words.filter((w) => ratings[w.id] && cards[w.id]).map((w) => cards[w.id].due);
  return dues.length ? Math.min(...dues) : null;
}

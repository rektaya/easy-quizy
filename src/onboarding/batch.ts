import type { Word } from '../data/words';
import { isDue } from '../srs/scheduler.ts';
import type { StoredCard } from '../srs/scheduler.ts';
import type { Rating } from '../state/ratings';
import { MIN_PILE_TO_STUDY } from './calibration.ts';

/** New words per Study batch. */
export const NEW_PER_BATCH = 5;
/** Reviews per Study batch. */
export const REVIEWS_PER_BATCH = 10;
/** The sizes of a Study session the user can choose (the words of one session: reviews and new words together). */
export const SESSION_WORDS = [10, 20, 40] as const;
export type SessionWords = (typeof SESSION_WORDS)[number];
export const DEFAULT_SESSION_WORDS: SessionWords = 20;
/** About how long a session of each size takes (a word takes five or six seconds: draw, read, swipe). */
export const SESSION_MINUTES: Record<SessionWords, string> = { 10: 'about 1 min', 20: 'about 2 min', 40: 'about 4 min' };
/** The share of a session that is kept for new words when many reviews are due. */
const FRESH_SHARE = 0.4;

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
 * 5, the ones rated lowest first: the ones the user most needs). With no review due, a session
 * waits until MIN_PILE_TO_STUDY new words have gathered: fewer is not worth a session.
 */
export function makeBatch(
  words: Word[],
  ratings: Ratings,
  cards: Cards,
  now: number,
  limits: { reviews: number; fresh: number; minFresh?: number } = { reviews: REVIEWS_PER_BATCH, fresh: NEW_PER_BATCH },
): BatchItem[] {
  const reviews = dueWords(words, ratings, cards, now).slice(0, limits.reviews);
  const fresh = waitingWords(words, ratings, cards)
    .sort((a, b) => ratings[a.id].value - ratings[b.id].value)
    .slice(0, limits.fresh);
  if (reviews.length === 0 && fresh.length < (limits.minFresh ?? MIN_PILE_TO_STUDY)) return [];
  return [
    ...reviews.map((word) => ({ word, isNew: false })),
    ...fresh.map((word) => ({ word, isNew: true })),
  ];
}

/**
 * A session of `total` words: the due reviews first (most overdue first), but the new words keep their share (40%)
 * when many reviews are due, and take all the room the reviews leave when few are. It is a ceiling, not a promise:
 * with fewer words waiting the session is shorter. With nothing due, it waits for enough new words (see makeBatch).
 */
export function makeSession(words: Word[], ratings: Ratings, cards: Cards, now: number, total: number): BatchItem[] {
  const share = Math.round(total * FRESH_SHARE);
  const waiting = waitingWords(words, ratings, cards).length;
  const due = dueWords(words, ratings, cards, now).length;
  const fresh = Math.min(waiting, Math.max(share, total - due));
  return makeBatch(words, ratings, cards, now, { reviews: Math.max(0, total - fresh), fresh });
}

/** When the next review comes up, if nothing is due yet. */
export function nextDue(words: Word[], ratings: Ratings, cards: Cards): number | null {
  const dues = words.filter((w) => ratings[w.id] && cards[w.id]).map((w) => cards[w.id].due);
  return dues.length ? Math.min(...dues) : null;
}

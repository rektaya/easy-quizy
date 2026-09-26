import type { Word } from '../data/words';
import type { StudyResult } from '../state/profile';
import type { Rating } from '../state/ratings';

export const BATCH_SIZE = 5;
/** When this many gathered words are waiting to be studied, Explore pauses until some are learned. */
export const EXPLORE_LOCK_AT = 20;

type Ratings = Record<string, Rating>;
type Studied = Record<string, StudyResult>;

/** Gathered words that have not been studied yet: the pile waiting for a Study session. */
export function waitingWords(words: Word[], ratings: Ratings, studied: Studied): Word[] {
  return words.filter((w) => ratings[w.id] && !ratings[w.id].known && !studied[w.id]);
}

/**
 * A small batch from the pile for a Study session: waiting words, the ones rated lowest first
 * (the ones the user most needs).
 */
export function makeBatch(words: Word[], ratings: Ratings, studied: Studied, size = BATCH_SIZE): Word[] {
  return waitingWords(words, ratings, studied)
    .sort((a, b) => ratings[a.id].value - ratings[b.id].value)
    .slice(0, size);
}

import type { Word } from '../data/words';
import type { StoredCard } from '../srs/scheduler';
import type { Rating } from '../state/ratings';

// Where a gathered word stands in learning, from how firm its FSRS card is. Stability is the number
// of days the memory is expected to last; each successful review pushes it out.
export type Status = 'new' | 'shaky' | 'getting' | 'solid' | 'learned';

export const STATUS_ORDER: Status[] = ['new', 'shaky', 'getting', 'solid', 'learned'];
export const STATUS_LABEL: Record<Status, string> = {
  new: 'new',
  shaky: 'shaky',
  getting: 'getting there',
  solid: 'solid',
  learned: 'learned',
};

export function statusOf(card: StoredCard | undefined): Status {
  if (!card) return 'new';
  if (card.stability < 3) return 'shaky';
  if (card.stability < 10) return 'getting';
  if (card.stability < 21) return 'solid';
  return 'learned';
}

/**
 * A word that has not been studied yet has no card, so how well the user said they know it (the circle they drew,
 * or the answer when adding a word) stands in for it: an empty ring is new, a little is shaky, more is getting
 * there, almost full is solid. Once the word is studied, its card takes over.
 */
export function statusOfRating(value: number): Status {
  if (value < 0.25) return 'new';
  if (value < 0.5) return 'shaky';
  if (value < 0.75) return 'getting';
  return 'solid';
}

export type Summary = {
  /** Words gathered for study (everything rated below the "know" segment, and not removed). */
  gathered: number;
  counts: Record<Status, number>;
  /** Words the user marked as known while exploring. */
  knownBefore: number;
};

export function summarize(
  words: Word[],
  ratings: Record<string, Rating>,
  cards: Record<string, StoredCard>,
): Summary {
  const counts: Record<Status, number> = { new: 0, shaky: 0, getting: 0, solid: 0, learned: 0 };
  let gathered = 0;
  let knownBefore = 0;
  for (const w of words) {
    const r = ratings[w.id];
    if (!r) continue;
    if (r.known) knownBefore++;
    else {
      gathered++;
      counts[cards[w.id] ? statusOf(cards[w.id]) : statusOfRating(r.value)]++;
    }
  }
  return { gathered, counts, knownBefore };
}

/** A word's status as the user sees it: "unseen" is a word never explored (it has no rating at all). */
export type WordStatus = Status | 'unseen';

export function wordStatus(
  id: string,
  ratings: Record<string, Rating>,
  cards: Record<string, StoredCard>,
): WordStatus {
  const r = ratings[id];
  if (!r) return 'unseen';
  // a word marked known in Explore has no card; it counts as learned
  if (cards[id]) return statusOf(cards[id]);
  return r.known ? 'learned' : statusOfRating(r.value);
}

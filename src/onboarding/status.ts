import type { Word } from '../data/words';
import type { StudyResult } from '../state/profile';
import type { Rating } from '../state/ratings';

// Where a gathered word stands in learning. Until real scheduling (FSRS) exists, this comes from
// the latest Circle rating the word got in Study.
export type Status = 'new' | 'shaky' | 'getting' | 'solid' | 'learned';

export const STATUS_ORDER: Status[] = ['new', 'shaky', 'getting', 'solid', 'learned'];
export const STATUS_LABEL: Record<Status, string> = {
  new: 'new',
  shaky: 'shaky',
  getting: 'getting there',
  solid: 'solid',
  learned: 'learned',
};

export function statusOf(study: StudyResult | undefined): Status {
  if (!study) return 'new';
  if (study.value < 0.3) return 'shaky';
  if (study.value < 0.6) return 'getting';
  if (study.value < 0.9) return 'solid';
  return 'learned';
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
  studied: Record<string, StudyResult>,
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
      counts[statusOf(studied[w.id])]++;
    }
  }
  return { gathered, counts, knownBefore };
}

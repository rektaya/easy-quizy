import { CORE, CORE_TIERS } from './words.core.ts';
import { CORE_LINKS, GENERATED } from './words.generated.ts';

export type Word = {
  id: string;
  lemma: string;
  article?: 'der' | 'die' | 'das';
  plural?: string;
  en: string;
  example: { de: string; en: string };
  /** Word-family words (for later; not all are in the dataset). */
  family: string[];
  /** Ids of other words in the dataset this one is associated with: the paths you can travel. */
  related: string[];
  /**
   * Position on the difficulty ladder used by the adaptive calibration:
   * 1 = about the 500 most common words, 2 = to ~1,500, 3 = to ~3,000,
   * 4 = to ~5,000, 5 = to ~8,000, 6 = rarer or formal. An estimate by hand,
   * to be checked against a real frequency list.
   */
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  /** Theme the word belongs to (only words from words.raw.txt have one). */
  theme?: string;
};

// The hand-written core words come first, in trail order (Feierabend is the first word for
// everyone), then the generated list. Core words also link into the generated list.
export const WORDS: Word[] = [
  ...CORE.map((w) => ({
    ...w,
    tier: CORE_TIERS[w.id],
    related: [...w.related, ...(CORE_LINKS[w.id] ?? [])],
  })),
  ...GENERATED,
];

import type { Word } from '../data/words';

// Adaptive calibration: the first words a new user sees are picked to find where their
// knowledge ends on the difficulty ladder (tiers 1-6). Each rating moves the estimate up
// (rated as known) or down (rated as unknown), in big steps at first and smaller ones as it
// settles, a bit like a binary search. Every later rating in Explore keeps refining it. It
// tolerates inconsistent answers because it only ever moves a fraction of the way.

export const CALIBRATION_WORDS = 15;
/** Study needs at least this many gathered words to be worth a session. */
export const MIN_PILE_TO_STUDY = 3;
/** Safety stop: never calibrate for more than this many words. */
export const MAX_CALIBRATION_WORDS = 30;

export type Answer = { id: string; tier: number; value: number };

const START_LEVEL = 3;
const START_STEP = 1.6;
const SHRINK = 0.82;
// The steps stop shrinking here, so the estimate keeps adapting after calibration is over.
const MIN_STEP = 0.3;
const NEUTRAL = 0.45; // a rating around here says nothing about the level

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The level estimate (a position on the ladder, 1-6, fractions allowed) after these answers. */
export function estimateLevel(answers: Answer[]): number {
  let level = START_LEVEL;
  let step = START_STEP;
  for (const a of answers) {
    const signal = clamp((a.value - NEUTRAL) / (1 - NEUTRAL), -1, 1);
    level = clamp(level + step * signal, 1, 6);
    step = Math.max(MIN_STEP, step * SHRINK);
  }
  return level;
}

export function targetTier(level: number): Word['tier'] {
  return clamp(Math.round(level), 1, 6) as Word['tier'];
}

/** Calibration ends after 15 words, once enough are gathered to study (or at the safety stop). */
export function isCalibrationDone(answered: number, pileCount: number): boolean {
  if (answered >= MAX_CALIBRATION_WORDS) return true;
  return answered >= CALIBRATION_WORDS && pileCount >= MIN_PILE_TO_STUDY;
}

/**
 * The next calibration word. The first is always the first in the list (Feierabend). After
 * that: the unrated word closest to the estimated level. Ties go to a theme the user has not
 * met yet, so the words are spread across topics and read the level, not one area of knowledge.
 * (Similar-word links are not used here: they would keep the words in one thematic zone.)
 */
export function pickCalibrationWord(
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  _current?: Word | null,
): Word | null {
  const unrated = words.filter((w) => !isRated(w.id));
  if (unrated.length === 0) return null;
  if (answers.length === 0) return unrated[0];

  const target = targetTier(estimateLevel(answers));
  const themeOf = new Map(words.map((w) => [w.id, w.theme ?? 'core']));
  const seen = new Set(answers.map((a) => themeOf.get(a.id)));
  const score = (w: Word) => Math.abs(w.tier - target) * 2 + (seen.has(w.theme ?? 'core') ? 1 : 0);

  let best = unrated[0];
  for (const w of unrated) if (score(w) < score(best)) best = w;
  return best;
}

/**
 * The next word in Explore: it keeps the level estimate in mind, so words are not too easy and
 * not too hard. A word associated with the current one wins if it sits at (or next to) the
 * target tier, so it still feels like wandering; otherwise the unrated word closest to the
 * target tier, preferring the current word's theme.
 */
export function pickExploreWord(
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  current: Word | null,
): Word | null {
  const unrated = words.filter((w) => !isRated(w.id));
  if (unrated.length === 0) return null;

  const target = targetTier(estimateLevel(answers));
  const dist = (w: Word) => Math.abs(w.tier - target);

  const near = exploreChips(current, words, isRated, answers, 1);
  if (near[0]) return near[0];

  let best = unrated[0];
  for (const w of unrated) {
    const better =
      dist(w) < dist(best) ||
      (dist(w) === dist(best) && !!current?.theme && w.theme === current.theme && best.theme !== current.theme);
    if (better) best = w;
  }
  return best;
}

/** Similar words worth offering: unrated, within one tier of the level estimate, closest first. */
export function exploreChips(
  word: Word | null,
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  limit = 3,
): Word[] {
  if (!word) return [];
  const target = targetTier(estimateLevel(answers));
  const byId = new Map(words.map((w) => [w.id, w]));
  return word.related
    .map((id) => byId.get(id))
    .filter((w): w is Word => !!w && !isRated(w.id) && Math.abs(w.tier - target) <= 1)
    .sort((a, b) => Math.abs(a.tier - target) - Math.abs(b.tier - target))
    .slice(0, limit);
}

/**
 * Where "explore from here" starts: the unrated word in that theme closest to the user's level
 * (so the first word of the area is neither too easy nor too hard), or null if the whole area
 * has been explored.
 */
export function pickThemeWord(
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  themeId: string,
): Word | null {
  const target = targetTier(estimateLevel(answers));
  let best: Word | null = null;
  for (const w of words) {
    if (w.theme !== themeId || isRated(w.id)) continue;
    if (!best || Math.abs(w.tier - target) < Math.abs(best.tier - target)) best = w;
  }
  return best;
}

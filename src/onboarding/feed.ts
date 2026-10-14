import type { Word } from '../data/words';
import { estimateLevel, targetTier } from './calibration.ts';
import type { Answer } from './calibration.ts';

// How Explore chooses the next word, in three ways ("explore by ..."), shaped by a few simple filters.
// Every way keeps to the user's level (a word that is too easy or too hard is not offered), never offers
// a word that was rated or deleted, and has no randomness: the same ratings give the same trail.
export type FeedBy = 'association' | 'theme' | 'usefulness';
export type PosFilter = 'all' | 'noun' | 'verb' | 'other';

export type FeedOptions = {
  by: FeedBy;
  /** The theme to stay in, for `by: 'theme'` (when null: the theme of the word on screen). */
  theme: string | null;
  /** -1 easier, 0 at the user's level, 1 harder. */
  level: -1 | 0 | 1;
  pos: PosFilter;
  /** Themes the user likes: words from them are preferred (when there are any at the right level). */
  interests: string[];
};

export const DEFAULT_FEED: FeedOptions = { by: 'association', theme: null, level: 0, pos: 'all', interests: [] };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function targetOf(answers: Answer[], opts: FeedOptions): number {
  return clamp(targetTier(estimateLevel(answers)) + opts.level, 1, 6);
}

function eligible(words: Word[], isRated: (id: string) => boolean, opts: FeedOptions): Word[] {
  return words.filter((w) => !isRated(w.id) && (opts.pos === 'all' || w.pos === opts.pos));
}

/** The words of the themes the user likes, if there are any among these; otherwise all of them. */
function liked(list: Word[], opts: FeedOptions): Word[] {
  if (opts.interests.length === 0) return list;
  const inside = list.filter((w) => !!w.theme && opts.interests.includes(w.theme));
  return inside.length > 0 ? inside : list;
}

/** The nearest to the target level first, then the more common word, then the order in the list. */
function byFit(target: number) {
  return (a: Word, b: Word) => Math.abs(a.tier - target) - Math.abs(b.tier - target) || a.rank - b.rank;
}

/** The themes of a word on screen, for "by theme": the chosen one, or the word's own. */
function themeOf(current: Word | null, opts: FeedOptions): string | undefined {
  return opts.theme ?? current?.theme;
}

/**
 * Whether the word on screen already suits these settings (so changing a setting need not change the word):
 * the right part of speech, the chosen theme, and a level within one tier of the target. "Usefulness" is an
 * order, not a filter, so there the word has to be the one it would offer first.
 */
export function fitsFeed(
  word: Word,
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  opts: FeedOptions,
): boolean {
  if (opts.pos !== 'all' && word.pos !== opts.pos) return false;
  if (Math.abs(word.tier - targetOf(answers, opts)) > 1) return false;
  if (opts.by === 'theme') return !opts.theme || word.theme === opts.theme;
  if (opts.by === 'usefulness') return pickFeedWord(words, isRated, answers, null, opts)?.id === word.id;
  return true;
}

/** The words offered under the circle (and the first choice for swiping up). */
export function feedChips(
  word: Word | null,
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  opts: FeedOptions,
  limit = 3,
): Word[] {
  if (!word) return [];
  const target = targetOf(answers, opts);
  const ok = eligible(words, isRated, opts).filter((w) => w.id !== word.id);

  if (opts.by === 'usefulness') {
    return liked(ok.filter((w) => w.tier <= target + 1), opts)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  const byId = new Map(ok.map((w) => [w.id, w]));
  const related = word.related
    .map((id) => byId.get(id))
    .filter((w): w is Word => !!w && Math.abs(w.tier - target) <= 1);

  if (opts.by === 'theme') {
    const theme = themeOf(word, opts);
    const inTheme = related.filter((w) => w.theme === theme).sort(byFit(target));
    if (inTheme.length >= limit) return inTheme.slice(0, limit);
    const more = ok.filter((w) => w.theme === theme && !inTheme.includes(w)).sort(byFit(target));
    return [...inTheme, ...more].slice(0, limit);
  }

  return liked(related, opts).sort(byFit(target)).slice(0, limit);
}

/** The next word when the user swipes up (or the first word of Explore). */
export function pickFeedWord(
  words: Word[],
  isRated: (id: string) => boolean,
  answers: Answer[],
  current: Word | null,
  opts: FeedOptions,
): Word | null {
  const ok = eligible(words, isRated, opts);
  if (ok.length === 0) return null;
  const target = targetOf(answers, opts);

  if (opts.by === 'usefulness') {
    const fit = liked(ok.filter((w) => w.tier <= target + 1), opts);
    if (fit.length > 0) return fit.sort((a, b) => a.rank - b.rank)[0];
  }

  if (opts.by === 'theme') {
    const theme = themeOf(current, opts);
    const inTheme = ok.filter((w) => w.theme === theme);
    if (inTheme.length > 0) return inTheme.sort(byFit(target))[0];
  }

  const near = feedChips(current, words, isRated, answers, { ...opts, by: 'association' }, 1)[0];
  if (near) return near;
  // nothing linked is left at the right level: the word nearest to it, preferring the theme on screen
  const pool = liked(ok, opts);
  const sameTheme = (w: Word) => (!!current?.theme && w.theme === current.theme ? 0 : 1);
  return pool.sort((a, b) => Math.abs(a.tier - target) - Math.abs(b.tier - target) || sameTheme(a) - sameTheme(b) || a.rank - b.rank)[0];
}

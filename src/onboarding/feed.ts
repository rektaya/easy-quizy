import type { Word } from '../data/words';
import { difficultyRank, estimateLevel, rankOfLevel } from './calibration.ts';
import type { Answer } from './calibration.ts';

// How Explore chooses the next word, in four ways, shaped by a few simple filters. Every way keeps to the
// user's level (a word that is too easy or too hard is not offered; how hard a word is comes from its real place on
// the frequency list, not from its tier, which is too coarse and has outliers) and never offers a word that was rated or
// deleted. Three of them have no randomness (the same ratings give the same trail); "free" is the one that does.
export type FeedBy = 'association' | 'theme' | 'usefulness' | 'free';
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

/** How far from the target a word may be and still fit, on a log scale of the frequency rank (about one tier: a factor of 2.7). */
const FIT = 1;

/** The level the words should fit, as a place on the frequency list (log scale): the estimate, moved a tier by easier / harder. */
function targetOf(answers: Answer[], opts: FeedOptions): number {
  return Math.log(rankOfLevel(clamp(estimateLevel(answers) + opts.level, 1, 6)));
}

const away = (w: Word, target: number) => Math.abs(Math.log(difficultyRank(w)) - target);
const fits = (w: Word, target: number) => away(w, target) <= FIT;
/** For "usefulness" (the most common words first): not far above the target, and not hopelessly easy either (about 7 times more common than the level). */
const notTooHard = (w: Word, target: number) => {
  const r = Math.log(difficultyRank(w));
  return r <= target + FIT && r >= target - 2 * FIT;
};

function eligible(words: Word[], isRated: (id: string) => boolean, opts: FeedOptions): Word[] {
  return words.filter((w) => !isRated(w.id) && (opts.pos === 'all' || w.pos === opts.pos));
}

/** The words of the themes the user likes, if there are any among these; otherwise all of them. */
function liked(list: Word[], opts: FeedOptions): Word[] {
  if (opts.interests.length === 0) return list;
  const inside = list.filter((w) => !!w.theme && opts.interests.includes(w.theme));
  return inside.length > 0 ? inside : list;
}

/** `limit` words picked at random from the list (a partial shuffle). */
function sample(list: Word[], limit: number, random: () => number): Word[] {
  const pool = [...list];
  const out: Word[] = [];
  while (out.length < limit && pool.length > 0) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

/** The nearest to the target level first, then the more common word, then the order in the list. */
function byFit(target: number) {
  return (a: Word, b: Word) => away(a, target) - away(b, target) || a.rank - b.rank;
}

/** The themes of a word on screen, for "by theme": the chosen one, or the word's own. */
function themeOf(current: Word | null, opts: FeedOptions): string | undefined {
  return opts.theme ?? current?.theme;
}

/**
 * Whether the word on screen already suits these settings (so changing a setting need not change the word):
 * the right part of speech, the chosen theme, and a level within about one tier of the target. "Usefulness" is an
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
  if (!fits(word, targetOf(answers, opts))) return false;
  if (opts.by === 'theme') return !opts.theme || word.theme === opts.theme;
  if (opts.by === 'free') return true;
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
  random: () => number = Math.random,
): Word[] {
  if (!word) return [];
  const target = targetOf(answers, opts);
  const ok = eligible(words, isRated, opts).filter((w) => w.id !== word.id);

  if (opts.by === 'free') return sample(liked(ok.filter((w) => fits(w, target)), opts), limit, random);

  if (opts.by === 'usefulness') {
    return liked(ok.filter((w) => notTooHard(w, target)), opts)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  const byId = new Map(ok.map((w) => [w.id, w]));
  const related = word.related
    .map((id) => byId.get(id))
    .filter((w): w is Word => !!w && fits(w, target));

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
  random: () => number = Math.random,
): Word | null {
  const ok = eligible(words, isRated, opts);
  if (ok.length === 0) return null;
  const target = targetOf(answers, opts);

  if (opts.by === 'free') {
    const pool = liked(ok.filter((w) => fits(w, target) && w.id !== current?.id), opts);
    if (pool.length > 0) return pool[Math.floor(random() * pool.length)];
  }

  if (opts.by === 'usefulness') {
    const fit = liked(ok.filter((w) => notTooHard(w, target)), opts);
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
  return pool.sort((a, b) => away(a, target) - away(b, target) || sameTheme(a) - sameTheme(b) || a.rank - b.rank)[0];
}

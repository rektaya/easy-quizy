import type { Theme, Word } from '../data/words';
import { THEME_LINKS } from '../data/themeLinks.ts';
import type { StoredCard } from '../srs/scheduler';
import type { Rating } from '../state/ratings';

// What the Map shows: every word is a star, grouped into a cluster per theme.

/** A star's state: unexplored (dim), gathered (outline), learning (glow), known (solid). */
export type StarState = 'unexplored' | 'gathered' | 'learning' | 'known';

/** A word counts as known once it was marked known in Explore, or its card lasts 21+ days. */
const KNOWN_STABILITY = 21;

export function starState(rating: Rating | undefined, card: StoredCard | undefined): StarState {
  if (!rating) return 'unexplored';
  if (rating.known) return 'known';
  if (!card) return 'gathered';
  return card.stability >= KNOWN_STABILITY ? 'known' : 'learning';
}

export type Cluster = Theme & { words: Word[] };

/** One cluster per theme, in the themes' order. */
export function buildClusters(themes: Theme[], words: Word[]): Cluster[] {
  return themes
    .map((t) => ({ ...t, words: words.filter((w) => w.theme === t.id) }))
    .filter((c) => c.words.length > 0);
}

export type ClusterStats = Record<StarState, number> & { total: number };

export function clusterStats(
  cluster: Cluster,
  ratings: Record<string, Rating>,
  cards: Record<string, StoredCard>,
): ClusterStats {
  const stats: ClusterStats = { unexplored: 0, gathered: 0, learning: 0, known: 0, total: cluster.words.length };
  for (const w of cluster.words) stats[starState(ratings[w.id], cards[w.id])]++;
  return stats;
}

const STATE_RANK: Record<StarState, number> = { known: 0, learning: 1, gathered: 2, unexplored: 3 };

/**
 * The state of each point when a cluster is opened up: one per word, the most learned first (so
 * they sit at the bright core), or an even sample of them when the theme has more than `max` words.
 */
export function zoomStates(
  cluster: Cluster,
  ratings: Record<string, Rating>,
  cards: Record<string, StoredCard>,
  max = 48,
): StarState[] {
  const all = cluster.words
    .map((w) => starState(ratings[w.id], cards[w.id]))
    .sort((a, b) => STATE_RANK[a] - STATE_RANK[b]);
  if (all.length <= max) return all;
  return Array.from({ length: max }, (_, i) => all[Math.floor((i * all.length) / max)]);
}

export type ThemeLink = { a: number; b: number; weight: number };

/**
 * Which themes are connected: two themes are linked when words of one are related to words of the
 * other (the same paths you travel in Explore). Every theme keeps its few strongest links, so the
 * sky reads as a web, not as a hairball. `a` and `b` are indexes into `clusters`.
 */
export function themeLinks(clusters: Cluster[], words: Word[], perTheme = 2): ThemeLink[] {
  const index = new Map(clusters.map((c, i) => [c.id, i]));
  const themeOf = new Map(words.map((w) => [w.id, w.theme]));
  const counts = new Map<string, number>();
  for (const w of words) {
    const a = w.theme ? index.get(w.theme) : undefined;
    if (a === undefined) continue;
    for (const r of w.related) {
      const t = themeOf.get(r);
      const b = t ? index.get(t) : undefined;
      if (b === undefined || b === a) continue;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const all = [...counts.entries()].map(([key, weight]) => {
    const [a, b] = key.split(':').map(Number);
    return { a, b, weight };
  });
  const kept = new Set<string>();
  for (let i = 0; i < clusters.length; i++) {
    all
      .filter((l) => l.a === i || l.b === i)
      .sort((x, y) => y.weight - x.weight || x.a - y.a || x.b - y.b)
      .slice(0, perTheme)
      .forEach((l) => kept.add(`${l.a}:${l.b}`));
  }
  return all.filter((l) => kept.has(`${l.a}:${l.b}`)).sort((x, y) => x.a - y.a || x.b - y.b);
}

/**
 * The links the Map uses: the hand-made neighbours of src/data/themeLinks.ts. `a` and `b` are indexes into
 * `clusters`; a pair that names a theme that does not exist is skipped.
 */
export function curatedLinks(clusters: Cluster[]): ThemeLink[] {
  const index = new Map(clusters.map((c, i) => [c.id, i]));
  const out: ThemeLink[] = [];
  for (const [x, y, weight] of THEME_LINKS) {
    const a = index.get(x);
    const b = index.get(y);
    if (a === undefined || b === undefined || a === b) continue;
    out.push({ a: Math.min(a, b), b: Math.max(a, b), weight });
  }
  return out;
}

export type ZoomWord = { id: string; state: StarState };

/** Like `zoomStates`, but each point also says which word it is, so related words can be joined. */
export function zoomWords(
  cluster: Cluster,
  ratings: Record<string, Rating>,
  cards: Record<string, StoredCard>,
  max = 48,
): ZoomWord[] {
  const all = cluster.words
    .map((w) => ({ id: w.id, state: starState(ratings[w.id], cards[w.id]) }))
    .sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state]);
  if (all.length <= max) return all;
  return Array.from({ length: max }, (_, i) => all[Math.floor((i * all.length) / max)]);
}

/** How a theme's star looks: a dark star, a plain yellow point, or a glowing star (`t` is 0..1, how strongly). */
export type StarLook = { kind: 'dull' } | { kind: 'spark' } | { kind: 'glow'; t: number };

/** Below this share of a theme's words taken, its star stays dark. */
export const SPARK_AT = 0.01;
/** From here the star starts to glow. */
export const GLOW_AT = 0.1;

// share of the theme taken -> how strongly the star glows, by steps (a share of 0.1 is barely a glow,
// a full theme is a full blaze)
const GLOW_STEPS: [number, number][] = [
  [GLOW_AT, 0.12],
  [0.25, 0.35],
  [0.5, 0.62],
  [0.75, 0.85],
  [1, 1],
];

/**
 * What a theme's star looks like from how many of its words the user has taken (met and rated), a share
 * that stays meaningful however many words a theme holds. Under 1% the star is still dark; from 1% to
 * 10% it is a plain yellow point with no glow; then it glows more and more, up to full at all words.
 */
export function starLook(stats: ClusterStats): StarLook {
  if (stats.total === 0) return { kind: 'dull' };
  const share = (stats.total - stats.unexplored) / stats.total;
  if (share < SPARK_AT) return { kind: 'dull' };
  if (share < GLOW_AT) return { kind: 'spark' };
  for (let i = 1; i < GLOW_STEPS.length; i++) {
    const [x1, y1] = GLOW_STEPS[i];
    if (share <= x1) {
      const [x0, y0] = GLOW_STEPS[i - 1];
      return { kind: 'glow', t: y0 + ((share - x0) / (x1 - x0)) * (y1 - y0) };
    }
  }
  return { kind: 'glow', t: 1 };
}

/** One number for how lit a star is (0 dark, a little for a yellow point, up to 1), for threads and names. */
export function levelOf(look: StarLook): number {
  return look.kind === 'dull' ? 0 : look.kind === 'spark' ? 0.06 : look.t;
}

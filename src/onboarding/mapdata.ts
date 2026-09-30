import type { Theme, Word } from '../data/words';
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

/**
 * How brightly a cluster glows, 0..1: how much of it has been learned. A known word counts in
 * full, a word being studied a bit over half, and one merely gathered a little. This is a share,
 * so it stays meaningful however many words a theme holds.
 */
export function glowOf(stats: ClusterStats): number {
  if (stats.total === 0) return 0;
  const learned = stats.known + 0.6 * stats.learning + 0.2 * stats.gathered;
  return Math.min(1, learned / stats.total);
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

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

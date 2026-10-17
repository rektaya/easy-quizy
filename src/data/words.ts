import { CORE, CORE_TIERS, CORE_WORD_THEME, MERGED_THEMES } from './words.core.ts';
import { CORE_LINKS, GENERATED, THEMES as GENERATED_THEMES } from './words.generated.ts';
import { RANK } from './words.rank.ts';

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
  /** Id of the theme (a cluster on the Map) the word belongs to. */
  theme?: string;
  /** How common the word is: its place in a frequency list (1 = the most common). */
  rank: number;
  /** noun (has an article), verb (the meaning starts with "to"), or other (adjectives, adverbs). */
  pos: PartOfSpeech;
};

export type PartOfSpeech = 'noun' | 'verb' | 'other';

/** The parts of speech a user can pick when adding a word. The list keeps three kinds: adjectives, adverbs and the rest are "other". */
export type WordKind = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
export const WORD_KINDS: { key: WordKind; label: string }[] = [
  { key: 'noun', label: 'noun' },
  { key: 'verb', label: 'verb' },
  { key: 'adjective', label: 'adjective' },
  { key: 'adverb', label: 'adverb' },
  { key: 'other', label: 'other' },
];

/** A word as written in the data files: rank and part of speech are worked out when the list is assembled. */
export type RawWord = Omit<Word, 'rank' | 'pos'>;

// The hand-written core words come first, in trail order (Feierabend is the first word for
// everyone), then the generated list. Core words also link into the generated list.

const partOfSpeech = (w: RawWord): PartOfSpeech => (w.article ? 'noun' : /^to\b/i.test(w.en) ? 'verb' : 'other');

export const WORDS: Word[] = ([
  ...CORE.map((w) => ({
    ...w,
    tier: CORE_TIERS[w.id],
    theme: CORE_WORD_THEME[w.id],
    related: [...w.related, ...(CORE_LINKS[w.id] ?? [])],
  })),
  ...GENERATED,
] as RawWord[]).map((w) => ({ ...w, rank: RANK[w.id] ?? 60000, pos: partOfSpeech(w) }));

/** A word the user added (see the plus in Study). Stored on the phone, and joins the list when the app loads. */
export type OwnWord = {
  id: string;
  /** What the user typed for the German word; an article at the start (der, die, das) is taken as the article. */
  german: string;
  english: string;
  exampleDe: string;
  exampleEn: string;
  theme?: string;
  /** noun, verb, adjective, adverb or other. Left out: worked out from the article and the meaning. */
  kind?: WordKind;
};

/** Makes a word of the list out of one the user added. */
export function ownToWord(o: OwnWord): Word {
  const m = o.german.trim().match(/^(der|die|das)\s+(.+)$/i);
  const article = m ? (m[1].toLowerCase() as 'der' | 'die' | 'das') : undefined;
  const lemma = (m ? m[2] : o.german).trim();
  const w: RawWord = {
    id: o.id,
    lemma,
    article,
    en: o.english.trim(),
    example: { de: o.exampleDe.trim(), en: o.exampleEn.trim() },
    family: [],
    related: [],
    tier: 3,
    theme: o.theme,
  };
  const pos: PartOfSpeech = o.kind ? (o.kind === 'noun' || o.kind === 'verb' ? o.kind : 'other') : partOfSpeech(w);
  return { ...w, rank: 30000, pos };
}

/** What the user typed in the "german word" field: an article in front is split off, the rest is the word. */
export function parseGerman(input: string): { article?: 'der' | 'die' | 'das'; lemma: string } {
  const m = input.trim().match(/^(der|die|das)\s+(.+)$/i);
  return m ? { article: m[1].toLowerCase() as 'der' | 'die' | 'das', lemma: m[2].trim() } : { lemma: input.trim() };
}

/** Words of the list that match what is being typed: the exact word first, then words that begin with it. */
export function findByGerman(input: string, limit = 3): Word[] {
  const { article, lemma } = parseGerman(input);
  const bare = (x: string) => x.toLowerCase().replace(/^sich\s+/, ''); // "sich ernähren" is found by "ernähren" too
  const q = bare(lemma);
  if (q.length < 2) return [];
  const exact: Word[] = [];
  const starts: Word[] = [];
  for (const w of WORDS) {
    const l = bare(w.lemma);
    if (l === q && (!article || !w.article || w.article === article)) exact.push(w);
    else if (l.startsWith(q)) starts.push(w);
    if (exact.length + starts.length > 40) break;
  }
  return [...exact, ...starts.sort((a, b) => a.lemma.length - b.lemma.length)].slice(0, limit);
}

/** Adds the user's own words to the list (once each). The list is shared, so every screen sees them. */
export function registerOwnWords(list: OwnWord[]) {
  for (const o of list) {
    if (WORD_BY_ID.has(o.id)) continue;
    const w = ownToWord(o);
    WORDS.push(w);
    WORD_BY_ID.set(w.id, w);
  }
}

/** Every word by its id (the words of the list, in the same order). */
export const WORD_BY_ID: Map<string, Word> = new Map(WORDS.map((w) => [w.id, w]));

/** How common a word is, in plain words (from its place in the frequency list). */
export function commonness(rank: number): string {
  if (rank <= 500) return 'one of the 500 most common words';
  if (rank <= 1000) return 'one of the 1,000 most common words';
  if (rank <= 2000) return 'one of the 2,000 most common words';
  if (rank <= 5000) return 'one of the 5,000 most common words';
  if (rank <= 12000) return 'a fairly common word';
  return 'a less common word';
}

export type Theme = { id: string; de: string; en: string };

/** Every theme, in Map order. */
export const THEMES: Theme[] = [...GENERATED_THEMES];

/** A theme id from an older version (one of the small topics that were merged) becomes the id of the topic that took it over. */
export function currentTheme(id: string | null | undefined): string | null {
  if (!id) return null;
  const now = MERGED_THEMES[id] ?? id;
  return THEMES.some((t) => t.id === now) ? now : null;
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORDS } from '../data/words.ts';
import { DEFAULT_FEED, feedChips, fitsFeed, pickFeedWord } from './feed.ts';
import type { FeedOptions } from './feed.ts';

const none = () => false;
const opts = (patch: Partial<FeedOptions>): FeedOptions => ({ ...DEFAULT_FEED, ...patch });
const answers = [{ id: 'feierabend', tier: 3, value: 0.5 }]; // the level stays about where it starts, tier 3

test('by theme stays in the theme', () => {
  const theme = 'Tiere';
  let current = pickFeedWord(WORDS, none, answers, null, opts({ by: 'theme', theme }))!;
  const seen = new Set<string>();
  for (let i = 0; i < 15; i++) {
    assert.equal(current.theme, theme);
    seen.add(current.id);
    current = pickFeedWord(WORDS, (id) => seen.has(id), answers, current, opts({ by: 'theme', theme }))!;
  }
  assert.equal(seen.size, 15, 'no word comes twice');
});

test('by usefulness offers the most common words first, but not words that are far too hard', () => {
  const o = opts({ by: 'usefulness' });
  const first = pickFeedWord(WORDS, none, answers, null, o)!;
  assert.ok(first.tier <= 4);
  const ok = WORDS.filter((w) => w.tier <= 4);
  assert.equal(first.rank, Math.min(...ok.map((w) => w.rank)));
  const chips = feedChips(first, WORDS, (id) => id === first.id, answers, o);
  assert.deepEqual(chips.map((w) => w.rank), [...chips.map((w) => w.rank)].sort((a, b) => a - b));
});

test('the part of speech filter is respected, in every way of exploring', () => {
  for (const by of ['association', 'theme', 'usefulness'] as const) {
    const o = opts({ by, pos: 'verb', theme: 'Sprechen und Mitteilen' });
    const w = pickFeedWord(WORDS, none, answers, null, o)!;
    assert.equal(w.pos, 'verb', by);
    for (const c of feedChips(w, WORDS, none, answers, o)) assert.equal(c.pos, 'verb');
  }
});

test('easier and harder move the target tier', () => {
  const easy = pickFeedWord(WORDS, none, answers, null, opts({ by: 'usefulness', level: -1 }))!;
  const hard = pickFeedWord(WORDS, none, answers, null, opts({ by: 'association', level: 1 }))!;
  assert.ok(hard.tier >= 3, `harder gave tier ${hard.tier}`);
  assert.ok(easy.tier <= 3);
});

test('liked themes are preferred when there are words at the right level, and a rated word never comes back', () => {
  const o = opts({ interests: ['Tiere'] });
  const w = pickFeedWord(WORDS, none, answers, null, o)!;
  assert.equal(w.theme, 'Tiere');
  assert.notEqual(pickFeedWord(WORDS, (id) => id === w.id, answers, w, o)!.id, w.id);
  // when the liked themes are used up the feed carries on elsewhere instead of stopping
  const used = (id: string) => WORDS.find((x) => x.id === id)?.theme === 'Tiere';
  assert.ok(pickFeedWord(WORDS, used, answers, null, o));
});

test('a word on screen is kept when it already fits the new settings, and changed when it does not', () => {
  const noun = pickFeedWord(WORDS, none, answers, null, opts({ pos: 'noun' }))!;
  assert.equal(fitsFeed(noun, WORDS, none, answers, opts({ pos: 'noun' })), true);
  assert.equal(fitsFeed(noun, WORDS, none, answers, opts({ pos: 'verb' })), false);
  assert.equal(fitsFeed(noun, WORDS, none, answers, opts({ by: 'theme', theme: noun.theme ?? null })), true);
  assert.equal(fitsFeed(noun, WORDS, none, answers, opts({ by: 'theme', theme: 'Tiere' })), noun.theme === 'Tiere');
  const hard = WORDS.find((w) => w.tier === 6)!;
  assert.equal(fitsFeed(hard, WORDS, none, answers, opts({})), false, 'far above the level');
});

test('free picks any word at the user level, differently each time, and never the one on screen', () => {
  const o = opts({ by: 'free' });
  const seen = new Set<string>();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let current = pickFeedWord(WORDS, none, answers, null, o, rnd)!;
  for (let i = 0; i < 12; i++) {
    seen.add(current.id);
    const next = pickFeedWord(WORDS, none, answers, current, o, rnd)!;
    assert.notEqual(next.id, current.id);
    assert.ok(Math.abs(next.tier - 3) <= 1, `tier ${next.tier} is far from the level`);
    current = next;
  }
  assert.ok(seen.size > 6, 'the words vary');
  assert.equal(feedChips(current, WORDS, none, answers, o, 3, rnd).length, 3);
});

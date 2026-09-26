import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORDS } from '../data/words.ts';
import {
  CALIBRATION_WORDS,
  estimateLevel,
  exploreChips,
  isCalibrationDone,
  pickCalibrationWord,
  pickExploreWord,
} from './calibration.ts';
import type { Answer } from './calibration.ts';

// A pretend user who knows every word up to tier `level` and none above it.
function simulate(level: number, count = CALIBRATION_WORDS) {
  const answers: Answer[] = [];
  const rated = new Set<string>();
  let current = null as (typeof WORDS)[number] | null;
  for (let i = 0; i < count; i++) {
    const w = pickCalibrationWord(WORDS, (id) => rated.has(id), answers, current);
    assert.ok(w, 'always finds a next word');
    rated.add(w.id);
    answers.push({ id: w.id, tier: w.tier, value: w.tier <= level ? 1 : 0.1 });
    current = w;
  }
  return { answers, level: estimateLevel(answers) };
}

test('the first word is Feierabend for everyone', () => {
  assert.equal(pickCalibrationWord(WORDS, () => false, [], null)?.id, 'feierabend');
});

test('the estimate lands within one tier of where a consistent user really is', () => {
  for (let truth = 1; truth <= 6; truth++) {
    const { level } = simulate(truth);
    assert.ok(Math.abs(level - truth) <= 1, `user at tier ${truth} was estimated at ${level.toFixed(2)}`);
  }
});

test('knowing everything climbs to the top, knowing nothing sinks to the bottom', () => {
  assert.ok(simulate(6).level >= 5);
  assert.ok(simulate(0).level <= 2);
});

test('the words picked never repeat', () => {
  const { answers } = simulate(3, 30);
  assert.equal(new Set(answers.map((a) => a.id)).size, answers.length);
});

test('later words sit near the estimated level', () => {
  const { answers } = simulate(5);
  const lastFive = answers.slice(-5).map((a) => a.tier);
  assert.ok(Math.min(...lastFive) >= 4, `last picks were tiers ${lastFive.join(',')}`);
});

test('inconsistent answers keep the estimate from swinging wildly', () => {
  const answers: Answer[] = [];
  for (let i = 0; i < 12; i++) answers.push({ id: `w${i}`, tier: 3, value: i % 2 ? 1 : 0.1 });
  const level = estimateLevel(answers);
  assert.ok(level > 2 && level < 4, `estimate was ${level.toFixed(2)}`);
});

test('calibration ends after 15 words once 3 are gathered, and never runs past 30', () => {
  assert.equal(isCalibrationDone(14, 10), false);
  assert.equal(isCalibrationDone(15, 10), true);
  assert.equal(isCalibrationDone(15, 1), false, 'too few gathered: keep going');
  assert.equal(isCalibrationDone(30, 0), true, 'safety stop');
});

test('calibration words are spread across themes, not kept in one zone', () => {
  const { answers } = simulate(3);
  const themeOf = new Map(WORDS.map((w) => [w.id, w.theme ?? 'core']));
  const themes = new Set(answers.map((a) => themeOf.get(a.id)));
  assert.ok(themes.size >= 8, `15 words came from only ${themes.size} themes`);
});

test('Explore keeps to the level after calibration: no very easy words for an advanced user', () => {
  const { answers } = simulate(5);
  const rated = new Set(answers.map((a) => a.id));
  let current = WORDS.find((w) => w.id === answers.at(-1)!.id)!;
  const tiers: number[] = [];
  for (let i = 0; i < 20; i++) {
    const w = pickExploreWord(WORDS, (id) => rated.has(id), answers, current);
    assert.ok(w);
    rated.add(w.id);
    answers.push({ id: w.id, tier: w.tier, value: w.tier <= 5 ? 1 : 0.1 });
    tiers.push(w.tier);
    current = w;
  }
  assert.ok(Math.min(...tiers) >= 4, `Explore picked tiers ${tiers.join(',')}`);
});

test('similar-word chips only offer words near the level', () => {
  const answers: Answer[] = Array.from({ length: 6 }, (_, i) => ({ id: `x${i}`, tier: 5, value: 1 }));
  const word = WORDS.find((w) => w.id === 'arbeit')!; // a tier-1 word linking to easy words
  const chips = exploreChips(word, WORDS, () => false, answers);
  for (const c of chips) assert.ok(c.tier >= 4, `${c.id} is tier ${c.tier}`);
});

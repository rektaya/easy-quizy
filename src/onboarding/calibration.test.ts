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
function simulate(level: number, count = CALIBRATION_WORDS, seed = 7) {
  let s = (seed * 2654435761) % 4294967296;
  const random = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; // the same words every time the test runs
  const answers: Answer[] = [];
  const rated = new Set<string>();
  let current = null as (typeof WORDS)[number] | null;
  for (let i = 0; i < count; i++) {
    const w = pickCalibrationWord(WORDS, (id) => rated.has(id), answers, current, random);
    assert.ok(w, 'always finds a next word');
    rated.add(w.id);
    answers.push({ id: w.id, tier: w.tier, value: w.tier <= level ? 1 : 0.1 });
    current = w;
  }
  return { answers, level: estimateLevel(answers) };
}

test('the first test word comes from the middle of the ladder, and it is not always the same word', () => {
  const firsts = new Set<string>();
  for (let seed = 1; seed <= 12; seed++) {
    let s = (seed * 2654435761) % 4294967296;
    const random = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const w = pickCalibrationWord(WORDS, (id) => id === WORDS[0].id, [], null, random);
    assert.equal(w?.tier, 3);
    firsts.add(w!.id);
  }
  assert.ok(firsts.size >= 6, `only ${firsts.size} different first words in 12 tests`);
});

test('two tests of the same kind of user do not show the same words', () => {
  const a = simulate(3, CALIBRATION_WORDS, 1).answers.map((x) => x.id);
  const b = simulate(3, CALIBRATION_WORDS, 2).answers.map((x) => x.id);
  const shared = a.filter((id) => b.includes(id)).length;
  assert.ok(shared <= 4, `${shared} of 15 words were the same in both tests`);
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

test('after a "don\'t know" the next word is easier, never harder or a rare outlier', () => {
  for (const knowsBelow of [800, 1500, 3000, 6000]) {
    for (let seed = 1; seed <= 6; seed++) {
      let st = (seed * 2654435761) % 4294967296;
      const random = () => (st = (st * 1664525 + 1013904223) % 4294967296) / 4294967296;
      const answers: Answer[] = [];
      const rated = new Set<string>([WORDS[0].id]);
      let previous: { rank: number; unknown: boolean } | null = null;
      for (let i = 0; i < CALIBRATION_WORDS; i++) {
        const w = pickCalibrationWord(WORDS, (id) => rated.has(id), answers, null, random)!;
        if (previous?.unknown) assert.ok(w.rank <= previous.rank, `rank ${w.rank} came after a "don't know" on rank ${previous.rank} (knows below ${knowsBelow}, seed ${seed}, word ${i + 1})`);
        const unknown = w.rank >= knowsBelow;
        answers.push({ id: w.id, tier: w.tier, value: unknown ? 0.03 : 0.95 });
        rated.add(w.id);
        previous = { rank: w.rank, unknown };
      }
    }
  }
});

test('words that are not on the frequency list are left out of the test', () => {
  const rated = new Set<string>([WORDS[0].id]);
  const answers: Answer[] = [];
  for (let i = 0; i < 30; i++) {
    const w = pickCalibrationWord(WORDS, (id) => rated.has(id), answers, null)!;
    assert.ok(w.rank < 50000, `${w.id} has rank ${w.rank}`);
    rated.add(w.id);
    answers.push({ id: w.id, tier: w.tier, value: i % 3 === 0 ? 0.95 : 0.03 });
  }
});

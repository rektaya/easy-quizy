import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORDS } from './words.ts';

test('every word links to at least two other real words, never itself', () => {
  const ids = new Set(WORDS.map((w) => w.id));
  assert.equal(ids.size, WORDS.length, 'ids are unique');
  for (const w of WORDS) {
    assert.ok(w.related.length >= 2, `${w.id} has too few related words`);
    for (const r of w.related) {
      assert.ok(ids.has(r), `${w.id} links to unknown id "${r}"`);
      assert.notEqual(r, w.id, `${w.id} links to itself`);
    }
    assert.equal(new Set(w.related).size, w.related.length, `${w.id} has duplicate links`);
  }
});

test('every word can be reached by travelling from the first word', () => {
  const byId = new Map(WORDS.map((w) => [w.id, w]));
  const seen = new Set([WORDS[0].id]);
  const queue = [WORDS[0].id];
  while (queue.length) {
    for (const r of byId.get(queue.shift()!)!.related) {
      if (!seen.has(r)) {
        seen.add(r);
        queue.push(r);
      }
    }
  }
  const unreachable = WORDS.filter((w) => !seen.has(w.id)).map((w) => w.id);
  assert.deepEqual(unreachable, []);
});

test('every word has a difficulty tier, and each tier has enough words to calibrate on', () => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const w of WORDS) {
    assert.ok([1, 2, 3, 4, 5, 6].includes(w.tier), `${w.id} has a bad tier`);
    counts[w.tier]++;
  }
  for (let t = 1; t <= 6; t++) assert.ok(counts[t] >= 40, `tier ${t} has only ${counts[t]} words`);
});

test('every word has a German example that contains its lemma or a form of it', () => {
  for (const w of WORDS) {
    assert.ok(w.example.de.length > 10 && w.example.en.length > 5, `${w.id} has a thin example`);
  }
});

test('from any theme you can reach both an easier and a harder word within one step', () => {
  const byId = new Map(WORDS.map((w) => [w.id, w]));
  const themed = WORDS.filter((w) => w.theme);
  for (const w of themed) {
    const tiers = w.related.map((r) => byId.get(r)!.tier);
    const easierOrHarder = tiers.some((t) => t !== w.tier);
    assert.ok(easierOrHarder, `${w.id} only links to words of its own tier`);
  }
});

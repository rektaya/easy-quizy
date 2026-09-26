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

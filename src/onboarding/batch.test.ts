import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORDS } from '../data/words.ts';
import { firstStudy, reviewCard, seedCard } from '../srs/scheduler.ts';
import { dueWords, makeBatch, makeSession, nextDue, waitingWords } from './batch.ts';
import { statusOf, statusOfRating, summarize, wordStatus } from './status.ts';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 26, 10);
const rating = (value: number) => ({ value, known: value >= 0.9, at: T0 });

const ratings = {
  feierabend: rating(0.5),
  arbeit: rating(0.1),
  buero: rating(0.95), // known: never in the pile
  kollege: rating(0.2),
  termin: rating(0.05),
  zug: rating(0.7),
};

test('a batch is the due reviews first, then new words, lowest-rated first', () => {
  const cards = { termin: seedCard(0.05, T0) }; // studied once; due in about a day
  const now = T0 + 2 * DAY;
  const batch = makeBatch(WORDS, ratings, cards, now, { reviews: 10, fresh: 3 });
  assert.deepEqual(
    batch.map((b) => [b.word.id, b.isNew]),
    [['termin', false], ['arbeit', true], ['kollege', true], ['feierabend', true]],
  );
});

test('a word that is not due yet stays out of the batch', () => {
  const cards = { termin: seedCard(0.05, T0) };
  const batch = makeBatch(WORDS, ratings, cards, T0 + 1000);
  assert.ok(!batch.some((b) => b.word.id === 'termin'));
});

test('waiting words are gathered ones never studied; known and studied ones are not', () => {
  const cards = { termin: seedCard(0.05, T0) };
  assert.deepEqual(
    waitingWords(WORDS, ratings, cards).map((w) => w.id).sort(),
    ['arbeit', 'feierabend', 'kollege', 'zug'],
  );
});

test('the next review is the earliest due date', () => {
  const soon = seedCard(0.05, T0);
  const later = seedCard(0.8, T0);
  assert.equal(nextDue(WORDS, ratings, { termin: later, arbeit: soon }), soon.due);
  assert.equal(nextDue(WORDS, ratings, {}), null);
});

test('the dashboard counts words by how firm they are, and keeps known words out of the pile', () => {
  const firm = reviewCard(reviewCard(seedCard(0.8, T0), 0.8, T0 + 8 * DAY), 0.8, T0 + 30 * DAY);
  const cards = { arbeit: firm, kollege: firstStudy(0.2, T0, 0.1, T0 + 1000) };
  const s = summarize(WORDS, ratings, cards);
  assert.equal(s.gathered, 5);
  assert.equal(s.knownBefore, 1);
  assert.equal(statusOf(cards.arbeit), 'learned');
  assert.equal(statusOf(cards.kollege), 'shaky');
  // a word never studied has no card yet: how it was rated stands in (termin 0.05 is new; feierabend 0.5 and zug 0.7 are getting there)
  assert.deepEqual(s.counts, { new: 1, shaky: 1, getting: 2, solid: 0, learned: 1 });
});

test('due words are the most overdue first', () => {
  const a = seedCard(0.05, T0);
  const b = seedCard(0.8, T0);
  const due = dueWords(WORDS, ratings, { termin: b, arbeit: a }, T0 + 20 * DAY);
  assert.deepEqual(due.map((w) => w.id), ['arbeit', 'termin']);
});

test('with nothing due, a session waits until three new words have gathered', () => {
  const two = { feierabend: rating(0.5), arbeit: rating(0.1), buero: rating(0.95) }; // 2 in the pile
  assert.equal(makeBatch(WORDS, two, {}, T0).length, 0);
  const three = { ...two, kollege: rating(0.2) };
  assert.equal(makeBatch(WORDS, three, {}, T0).length, 3);
});

test('a due review brings the session even when few new words wait', () => {
  const cards = { termin: seedCard(0.05, T0) };
  const some = { termin: rating(0.05), arbeit: rating(0.1) };
  const batch = makeBatch(WORDS, some, cards, T0 + 3 * DAY);
  assert.deepEqual(batch.map((b) => [b.word.id, b.isNew]), [['termin', false], ['arbeit', true]]);
});

test('a quick session is at most 10 words and "study all" up to 50, with the new words keeping their share', () => {
  const ids = WORDS.slice(0, 40).map((w) => w.id);
  const ratings40 = Object.fromEntries(ids.map((id, i) => [id, rating(0.1 + (i % 5) * 0.1)]));
  // the first 20 have been studied and are due; the other 20 are new
  const cards40 = Object.fromEntries(ids.slice(0, 20).map((id) => [id, seedCard(0.2, T0)]));
  const now = T0 + 5 * DAY;
  const quick = makeSession(WORDS, ratings40, cards40, now, 'quick');
  const long = makeSession(WORDS, ratings40, cards40, now, 'long');
  assert.equal(quick.length, 10);
  assert.equal(quick.filter((b) => b.isNew).length, 5);
  assert.equal(long.length, 40); // all 20 due reviews and all 20 new words
  assert.equal(long.filter((b) => b.isNew).length, 20);
});

test('before a word is studied its status follows how well the user said they know it', () => {
  assert.equal(statusOfRating(0.03), 'new');
  assert.equal(statusOfRating(0.35), 'shaky');
  assert.equal(statusOfRating(0.65), 'getting');
  assert.equal(statusOfRating(0.8), 'solid');
  assert.equal(wordStatus('zug', ratings, {}), 'getting');
  assert.equal(wordStatus('buero', ratings, {}), 'learned');
  assert.equal(wordStatus('nie-gesehen', ratings, {}), 'unseen');
  // once studied, the card decides
  assert.equal(wordStatus('arbeit', ratings, { arbeit: seedCard(0.9, T0) }), statusOf(seedCard(0.9, T0)));
});

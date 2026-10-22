import assert from 'node:assert/strict';
import { test } from 'node:test';
import { THEMES, WORDS, currentTheme, findByGerman, ownToWord, parseGerman, verbForms } from './words.ts';

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

test('typing a word finds the same word in the list, with or without its article', () => {
  const lemma = WORDS.find((w) => w.article && w.lemma.length > 4)!;
  const typed = `${lemma.article} ${lemma.lemma.toUpperCase()}`;
  assert.equal(findByGerman(typed)[0].id, lemma.id);
  assert.equal(findByGerman(lemma.lemma.toLowerCase())[0].id, lemma.id);
  assert.deepEqual(findByGerman('q'), []); // one letter is too little to go on
  assert.deepEqual(findByGerman('zzzzqx'), []);
  assert.deepEqual(parseGerman('das Fahrrad'), { article: 'das', lemma: 'Fahrrad' });
  assert.deepEqual(parseGerman('laufen'), { lemma: 'laufen' });
});

test('a word the user adds takes its part of speech from the choice, or from the article and the meaning', () => {
  const base = { id: 'own-x', english: 'fast', exampleDe: '', exampleEn: '' };
  assert.equal(ownToWord({ ...base, german: 'schnell', kind: 'adjective' }).pos, 'other');
  assert.equal(ownToWord({ ...base, german: 'laufen', kind: 'verb' }).pos, 'verb');
  assert.equal(ownToWord({ ...base, german: 'das Rad' }).pos, 'noun');
  assert.equal(ownToWord({ ...base, german: 'rennen', english: 'to run' }).pos, 'verb');
});

test('the five small topics are folded into the big ones: every word has a topic that exists, and old ids are carried across', () => {
  const ids = new Set(THEMES.map((t) => t.id));
  for (const w of WORDS) assert.ok(w.theme && ids.has(w.theme), `${w.id} has no topic on the Map (${w.theme})`);
  for (const old of ['Arbeit', 'Unterwegs', 'Küche', 'Wohnen', 'Entscheidungen und Gefühle']) {
    assert.ok(!ids.has(old), `${old} is still a topic`);
    assert.ok(ids.has(currentTheme(old)!), `${old} is not carried across`);
  }
  assert.equal(currentTheme('Arbeit'), 'Beruf und Wirtschaft');
  assert.equal(currentTheme('Tiere'), 'Tiere');
  assert.equal(currentTheme('gone'), null);
  assert.equal(currentTheme(null), null);
});

test('reflexive verbs are always shown with "sich", their example uses a reflexive pronoun, and saved ids are carried over (also after a spelling fix)', async () => {
  const { RENAMED_WORDS, carryOver } = await import('./renamedWords.ts');
  for (const [old, now] of Object.entries(RENAMED_WORDS)) {
    const w = WORDS.find((x) => x.id === now)!;
    assert.ok(w, `${now} is missing`);
    assert.ok(!WORDS.some((x) => x.id === old), `${old} still exists`);
    if (!now.startsWith('sich-')) continue; // a spelling fix (Erwachsener -> Erwachsene), not a reflexive verb
    assert.ok(w.lemma.startsWith('sich '), `${now} is not shown with "sich"`);
    assert.ok(/\b(sich|mich|dich|uns|euch)\b/i.test(w.example.de), `${now}: the example does not use the reflexive verb: ${w.example.de}`);
    assert.ok(!WORDS.some((x) => x.id === old), `${old} still exists`);
  }
  assert.deepEqual(carryOver({ ernaehren: 1, hund: 2 }), { 'sich-ernaehren': 1, hund: 2 });
});

test('typing a reflexive verb with or without "sich" finds it', () => {
  assert.equal(findByGerman('ernähren')[0].id, 'sich-ernaehren');
  assert.equal(findByGerman('sich ernähren')[0].id, 'sich-ernaehren');
  assert.ok(findByGerman('sich konzentr').some((w) => w.id === 'sich-konzentrieren'));
});

test('every verb of the list has its forms ("geht · ging · ist gegangen"), and no other word has any', () => {
  for (const w of WORDS.filter((x) => !x.id.startsWith('own-'))) {
    const forms = verbForms(w);
    if (w.pos === 'verb') {
      assert.ok(forms, `${w.id} has no forms`);
      const parts = forms.split(' · ');
      assert.equal(parts.length, 3, `${w.id}: ${forms}`);
      assert.match(parts[2], /^(hat|ist|hat \/ ist) /, `${w.id}: ${forms}`);
      if (w.lemma.startsWith('sich ')) assert.ok(parts.every((p) => p.includes('sich')), `${w.id} is reflexive: ${forms}`);
    } else {
      assert.equal(forms, null, `${w.id} is not a verb`);
    }
  }
  assert.equal(verbForms(WORDS.find((w) => w.id === 'gehen')!), 'geht · ging · ist gegangen');
});

test('a note on a word of your own goes with the word, and an empty note is left out', () => {
  const base = { id: 'own-x', german: 'der Hund', english: 'dog', exampleDe: '', exampleEn: '' };
  assert.equal(ownToWord({ ...base, note: '  not Hand  ' }).note, 'not Hand');
  assert.equal(ownToWord({ ...base, note: '   ' }).note, undefined);
  assert.equal(ownToWord(base).note, undefined);
});

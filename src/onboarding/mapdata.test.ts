import assert from 'node:assert/strict';
import { test } from 'node:test';
import { THEMES, WORDS } from '../data/words.ts';
import { seedCard } from '../srs/scheduler.ts';
import { pickThemeWord } from './calibration.ts';
import { buildClusters, clusterStats, glowOf, starState, themeLinks, zoomStates } from './mapdata.ts';
import { ambientStars, blob, heroSize, layoutSky, random, shuffled } from './sky.ts';

const T0 = Date.UTC(2026, 8, 26, 10);
const rating = (value: number) => ({ value, known: value >= 0.9, at: T0 });

test('every word sits in exactly one cluster, and every theme has an English name', () => {
  const clusters = buildClusters(THEMES, WORDS);
  assert.equal(clusters.reduce((n, c) => n + c.words.length, 0), WORDS.length);
  assert.equal(clusters.length, 29);
  for (const c of clusters) assert.ok(c.en.length > 2, `${c.id} has no English name`);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length, 'theme ids are unique');
});

test('star states follow the four states of the spec', () => {
  const firm = { ...seedCard(0.5, T0), stability: 30 };
  assert.equal(starState(undefined, undefined), 'unexplored');
  assert.equal(starState(rating(0.4), undefined), 'gathered');
  assert.equal(starState(rating(0.4), seedCard(0.4, T0)), 'learning');
  assert.equal(starState(rating(0.4), firm), 'known', 'a word that lasts 21+ days is known');
  assert.equal(starState(rating(0.95), undefined), 'known', 'marked known in Explore');
});

test('cluster counts add up', () => {
  const cluster = buildClusters(THEMES, WORDS).find((c) => c.id === 'Arbeit')!;
  const ratings = { feierabend: rating(0.1), arbeit: rating(0.95), buero: rating(0.3) };
  const stats = clusterStats(cluster, ratings, { buero: seedCard(0.3, T0) });
  assert.deepEqual(stats, { unexplored: 4, gathered: 1, learning: 1, known: 1, total: 7 });
});

test('"explore from here" starts on an unrated word of that theme near the level', () => {
  const rated = new Set(['feierabend']);
  const w = pickThemeWord(WORDS, (id) => rated.has(id), [], 'Arbeit')!;
  assert.equal(w.theme, 'Arbeit');
  assert.ok(!rated.has(w.id));
  const all = new Set(WORDS.filter((x) => x.theme === 'Arbeit').map((x) => x.id));
  assert.equal(pickThemeWord(WORDS, (id) => all.has(id), [], 'Arbeit'), null, 'a finished area has nothing left');
});

test('a cluster glows in proportion to how much of it is learned, whatever its size', () => {
  const stats = (o: Partial<ReturnType<typeof clusterStats>>) => ({ unexplored: 0, gathered: 0, learning: 0, known: 0, total: 20, ...o });
  assert.equal(glowOf(stats({ unexplored: 20 })), 0);
  assert.equal(glowOf(stats({ known: 20 })), 1);
  assert.ok(glowOf(stats({ known: 10, unexplored: 10 })) === 0.5);
  assert.ok(glowOf(stats({ learning: 10, unexplored: 10 })) > glowOf(stats({ gathered: 10, unexplored: 10 })));
  assert.equal(glowOf({ unexplored: 100, gathered: 0, learning: 0, known: 100, total: 200 }), 0.5, 'same share, same glow');
});

test('a bigger theme is a bigger star, but only a little', () => {
  assert.ok(heroSize(20) > heroSize(4));
  assert.ok(heroSize(300) > heroSize(20));
  assert.ok(heroSize(1_000_000) <= 7, 'capped, so it stays a star');
  assert.ok(heroSize(0) >= 2.4);
});

test('the sky is the same every time, and every big star sits on the stage, well apart', () => {
  const items = buildClusters(THEMES, WORDS).map((c) => ({ id: c.id, words: c.words.length }));
  const a = layoutSky(items, 327, 560);
  const b = layoutSky(items, 327, 560);
  assert.deepEqual(a, b);
  assert.equal(a.length, 29);
  for (const c of a) assert.ok(c.cx > 0 && c.cx < 327 && c.cy > 0 && c.cy < 560, `${c.id} is off the stage`);
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      assert.ok(Math.hypot(a[i].cx - a[j].cx, a[i].cy - a[j].cy) > 30, `${a[i].id} and ${a[j].id} are too close`);
    }
  }
});

test('the small stars are spread evenly: no big empty patch and no clump', () => {
  const stars = ambientStars(327, 560);
  assert.ok(stars.length > 200, `only ${stars.length} stars`);
  // split the sky into 3x4 blocks: each must hold a fair share
  const counts = Array(12).fill(0);
  for (const s of stars) counts[Math.min(3, Math.floor((s.y / 560) * 4)) * 3 + Math.min(2, Math.floor((s.x / 327) * 3))]++;
  const mean = stars.length / 12;
  for (const c of counts) assert.ok(c > mean * 0.7 && c < mean * 1.3, `uneven block: ${c} vs mean ${mean.toFixed(0)}`);
});

test('no small star sits right on a big one', () => {
  const heroes = [{ x: 100, y: 100 }, { x: 200, y: 300 }];
  for (const s of ambientStars(327, 560, heroes)) {
    for (const h of heroes) assert.ok(Math.hypot(h.x - s.x, h.y - s.y) >= 18);
  }
});

test('an opened cluster is a ragged blob, listed from its centre outwards', () => {
  const pts = blob(1, 30, 50, 20, 0, [1, 2]);
  const spreadX = Math.max(...pts.map((p) => Math.abs(p.x)));
  const spreadY = Math.max(...pts.map((p) => Math.abs(p.y)));
  assert.ok(spreadX > spreadY * 1.5, 'a wide ellipse is wider than it is tall');
  assert.ok(Math.hypot(pts[0].x, pts[0].y) <= Math.hypot(pts[29].x, pts[29].y));
  const shapes = layoutSky(buildClusters(THEMES, WORDS).map((c) => ({ id: c.id, words: c.words.length })), 327, 560);
  assert.ok(new Set(shapes.map((s) => Math.round(s.angle * 10))).size > 15, 'the tilts differ');
});

test('the seeded random source repeats itself and ambient stars stay on the stage', () => {
  const r1 = random(7);
  const r2 = random(7);
  assert.equal(r1(), r2());
  for (const s of ambientStars(300, 500)) assert.ok(s.x >= 0 && s.x <= 300 && s.y >= 0 && s.y <= 500);
});

test('opening a cluster shows one point per word, the most learned first, sampled when there are many', () => {
  const cluster = buildClusters(THEMES, WORDS).find((c) => c.id === 'Arbeit')!;
  const ratings = { feierabend: rating(0.1), arbeit: rating(0.95), buero: rating(0.3) };
  const states = zoomStates(cluster, ratings, { buero: seedCard(0.3, T0) });
  assert.deepEqual(states, ['known', 'learning', 'gathered', 'unexplored', 'unexplored', 'unexplored', 'unexplored']);
  const many = { ...cluster, words: Array.from({ length: 200 }, (_, i) => ({ ...cluster.words[0], id: `w${i}` })) };
  assert.equal(zoomStates(many, {}, {}).length, 48);
});

test('the background stars appear in a scrambled, repeatable order, spread over the whole screen from the start', () => {
  const field = ambientStars(375, 812, [], 36);
  const a = shuffled(field, 7);
  assert.deepEqual(a, shuffled(field, 7));
  assert.equal(a.length, field.length);
  assert.notDeepEqual(a.slice(0, 20), field.slice(0, 20), 'not in grid order');
  // the first 30 stars must already reach most of a 3x4 division of the screen, not one corner
  const blocks = new Set(a.slice(0, 30).map((s) => `${Math.min(2, Math.floor((s.x / 375) * 3))},${Math.min(3, Math.floor((s.y / 812) * 4))}`));
  assert.ok(blocks.size >= 8, `the first 30 stars only cover ${blocks.size} of 12 blocks`);
});

test('related themes are linked, every link joins two different themes, and the layout keeps links short', () => {
  const clusters = buildClusters(THEMES, WORDS);
  const links = themeLinks(clusters, WORDS);
  assert.ok(links.length >= clusters.length, 'about one link per theme at least');
  for (const l of links) {
    assert.ok(l.a < l.b && l.b < clusters.length, 'links join two different themes, once');
    assert.ok(l.weight > 0);
  }
  assert.equal(new Set(links.map((l) => `${l.a}:${l.b}`)).size, links.length, 'no link twice');
  const items = clusters.map((c) => ({ id: c.id, words: c.words.length }));
  const plain = layoutSky(items, 819, 1604);
  const linked = layoutSky(items, 819, 1604, links);
  assert.deepEqual(linked, layoutSky(items, 819, 1604, links), 'the layout repeats');
  const mean = (sky: typeof plain) => links.reduce((n, l) => n + Math.hypot(sky[l.a].cx - sky[l.b].cx, sky[l.a].cy - sky[l.b].cy), 0) / links.length;
  assert.ok(mean(linked) < mean(plain) * 0.8, 'linked themes end up closer than on the plain scatter');
  for (const c of linked) assert.ok(c.cx > 0 && c.cx < 819 && c.cy > 0 && c.cy < 1604, `${c.id} is off the sky`);
});

test('every user gets a sky of their own, and the same seed always gives the same sky', () => {
  const clusters = buildClusters(THEMES, WORDS);
  const items = clusters.map((c) => ({ id: c.id, words: c.words.length }));
  const links = themeLinks(clusters, WORDS);
  const a = layoutSky(items, 819, 1604, links, 111);
  assert.deepEqual(a, layoutSky(items, 819, 1604, links, 111));
  const b = layoutSky(items, 819, 1604, links, 222);
  assert.notDeepEqual(a.map((c) => [c.cx, c.cy]), b.map((c) => [c.cx, c.cy]), 'a different seed, a different sky');
  // the themes keep their connections whatever the seed: the links stay short
  const len = (sky: typeof a) => links.reduce((n, l) => n + Math.hypot(sky[l.a].cx - sky[l.b].cx, sky[l.a].cy - sky[l.b].cy), 0) / links.length;
  assert.ok(len(b) < len(layoutSky(items, 819, 1604, [], 222)) * 0.85);
  assert.notDeepEqual(ambientStars(300, 500, [], 22, 5).slice(0, 5), ambientStars(300, 500, [], 22, 6).slice(0, 5));
});

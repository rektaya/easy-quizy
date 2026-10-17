import assert from 'node:assert/strict';
import { test } from 'node:test';
import { layoutSky, placeLabels } from './sky.ts';

const NAMES = ['work', 'getting around', 'kitchen', 'home', 'decisions and feelings', 'food and drink', 'body and health', 'weather and nature', 'animals', 'clothes', 'family and relationships', 'free time and sport', 'travel', 'city and shopping', 'house and furniture', 'school and learning', 'money and banking', 'offices and law', 'computers and internet', 'media and culture', 'politics and society', 'time and calendar', 'feelings and character', 'speaking', 'everyday actions'];

test('the names of the big stars never overlap each other', () => {
  for (const [w, h] of [[820, 1700], [900, 1500], [760, 1800]]) {
    const sky = layoutSky(NAMES.map((id) => ({ id, words: 80 })), w, h, [], 3);
    const items = sky.map((c, i) => ({ x: c.cx, y: c.cy, r: c.heroR, text: NAMES[i] }));
    const places = placeLabels(items, { w, h });
    const rects = places.map((p, i) => {
      const width = items[i].text.length * 7.6;
      const x0 = p.anchor === 'middle' ? p.x - width / 2 : p.anchor === 'start' ? p.x : p.x - width;
      return { x0, x1: x0 + width, y0: p.y - 12, y1: p.y + 5 };
    });
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const overlap = Math.min(rects[i].x1, rects[j].x1) > Math.max(rects[i].x0, rects[j].x0) && Math.min(rects[i].y1, rects[j].y1) > Math.max(rects[i].y0, rects[j].y0);
        assert.ok(!overlap, `${items[i].text} overlaps ${items[j].text} on a ${w}x${h} sky`);
      }
    }
  }
});

test('two stars side by side get names that do not touch', () => {
  const items = [
    { x: 100, y: 100, r: 8, text: 'clothes' },
    { x: 150, y: 104, r: 8, text: 'getting around' },
  ];
  const [a, b] = placeLabels(items);
  assert.ok(a.x !== b.x || a.y !== b.y);
  assert.ok(Math.abs(a.y - b.y) > 14 || Math.abs(a.x - b.x) > 70, 'names are apart');
});

test('on the real sky, for several phones and several sky seeds, no two names overlap', async () => {
  const { THEME_LEVEL } = await import('../data/themeLinks.ts');
  const { THEMES, WORDS } = await import('../data/words.ts');
  const { buildClusters, curatedLinks } = await import('./mapdata.ts');
  const clusters = buildClusters(THEMES, WORDS);
  const links = curatedLinks(clusters);
  let worst = 0;
  for (const [sw, sh] of [[402, 874], [375, 667], [430, 932], [390, 844]]) {
    for (const seed of Array.from({ length: 40 }, (_, k) => k)) {
      const w = sw * 2.1;
      const h = sh * 1.9;
      const sky = layoutSky(clusters.map((c) => ({ id: c.id, words: c.words.length, level: THEME_LEVEL[c.id] })), w, h, links, seed);
      const items = sky.map((c, i) => ({ x: c.cx, y: c.cy, r: c.heroR, text: clusters[i].en }));
      const places = placeLabels(items, { w, h });
      const rects = places.map((p, i) => {
        const width = items[i].text.length * 7.6;
        const x0 = p.anchor === 'middle' ? p.x - width / 2 : p.anchor === 'start' ? p.x : p.x - width;
        return { x0, x1: x0 + width, y0: p.y - 12, y1: p.y + 5 };
      });
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const ox = Math.min(rects[i].x1, rects[j].x1) - Math.max(rects[i].x0, rects[j].x0);
          const oy = Math.min(rects[i].y1, rects[j].y1) - Math.max(rects[i].y0, rects[j].y0);
          if (ox > 0 && oy > 0) worst++;
        }
      }
    }
  }
  assert.equal(worst, 0, `${worst} overlapping pairs of names`);
});

test('no two big stars sit close to each other, on several phones and sky seeds', async () => {
  const { THEME_LEVEL } = await import('../data/themeLinks.ts');
  const { THEMES, WORDS } = await import('../data/words.ts');
  const { buildClusters, curatedLinks } = await import('./mapdata.ts');
  const { MIN_STAR_GAP } = await import('./sky.ts');
  const clusters = buildClusters(THEMES, WORDS);
  const links = curatedLinks(clusters);
  for (const [sw, sh] of [[402, 874], [375, 667], [430, 932]]) {
    const w = sw * 2.1;
    const h = sh * 1.9;
    const need = Math.sqrt((w * h) / clusters.length) * MIN_STAR_GAP;
    for (let seed = 0; seed < 20; seed++) {
      const sky = layoutSky(clusters.map((c) => ({ id: c.id, words: c.words.length, level: THEME_LEVEL[c.id] })), w, h, links, seed);
      let least = Infinity;
      for (let i = 0; i < sky.length; i++) for (let j = i + 1; j < sky.length; j++) least = Math.min(least, Math.hypot(sky[i].cx - sky[j].cx, sky[i].cy - sky[j].cy));
      assert.ok(least >= need * 0.78, `stars ${Math.round(least)} apart on ${sw}x${sh}, seed ${seed}; need ${Math.round(need)}`);
    }
  }
});

// Builds a believable sample profile (124 rated words, 45 studied) so the app shows a lived-in state for screenshots. Run: node --experimental-strip-types landing/capture/seed-profile.mjs out.json
import { GENERATED, THEMES } from '../../src/data/words.generated.ts';
import { firstStudy } from '../../src/srs/scheduler.ts';
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const DAY = 86400000, now = Date.now();
const byTheme = {}; GENERATED.forEach((w) => (byTheme[w.theme] ??= []).push(w));
// how many words of each theme the sample user has met
const want = { 'Essen und Trinken': 32, 'Familie und Beziehungen': 22, 'Reisen': 15, 'Haus und Möbel': 11, 'Körper und Gesundheit': 9, 'Zeit und Kalender': 7, 'Stadt und Einkaufen': 6, 'Beruf und Wirtschaft': 5, 'Wetter und Natur': 4, 'Tiere': 3, 'Kleidung': 3, 'Gefühle und Charakter': 3, 'Freizeit und Sport': 2, 'Schule und Lernen': 2 };
const picks = [];
for (const [t, n] of Object.entries(want)) { const list = (byTheme[t] ?? []).filter((w) => w.tier <= 3).slice(0, 80); for (let i = 0; i < Math.min(n, list.length); i++) picks.push(list[Math.floor(i * list.length / n)]); }
const answers = [], ratings = {}, cards = {}, reviewLog = [];
picks.forEach((w, i) => {
  const value = Math.min(1, Math.max(0.05, rnd() < 0.3 ? 0.9 + rnd() * 0.1 : 0.1 + rnd() * 0.78));
  const at = now - Math.floor(rnd() * 9 * DAY) - 3600000;
  answers.push({ id: w.id, tier: w.tier, value });
  ratings[w.id] = { value, known: value >= 0.9, at, confidence: value };
});
// about half of the words to learn have been studied already
const pile = picks.filter((w) => !ratings[w.id].known);
pile.forEach((w, i) => {
  if (i % 2) return;
  const r = ratings[w.id]; const sv = Math.min(1, 0.3 + rnd() * 0.65); const at = r.at + 3600000 + Math.floor(rnd() * Math.max(1, now - r.at - 7200000));
  cards[w.id] = firstStudy(r.value, r.at, sv, at);
  reviewLog.push({ id: w.id, at, confidence: r.value, value: sv });
});
// a week of study for the week of stars: 10 reviews on some days
[[0, 12], [1, 20], [2, 9], [4, 20], [5, 6]].forEach(([d, n]) => { for (let k = 0; k < n; k++) reviewLog.push({ id: pile[k % pile.length].id, at: now - d * DAY - k * 60000, confidence: 0.5, value: 0.6 }); });
// the app lights one background star per answer: keep only a few, so the sky behind the screens stays quiet (the map and the lists use the ratings)
const profile = { name: 'Taya', phase: 'done', answers: answers.slice(0, 8), cards, removed: {}, skySeed: 424242, mapIntroSeen: true, reminder: { on: false, hour: 19, minute: 0, asked: true }, sessionWords: 20, explore: { by: 'association', theme: null, level: 0, pos: 'all', interests: [] }, interests: [], ownWords: [], reviewLog };
import fs from 'node:fs';
fs.writeFileSync(process.argv[2], JSON.stringify({ profile, ratings }));
console.log('words', picks.length, 'known', picks.filter((w) => ratings[w.id].known).length, 'studied', Object.keys(cards).length);

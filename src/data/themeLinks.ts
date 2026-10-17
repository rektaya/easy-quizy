// Which themes are close in meaning: the map puts these next to each other and joins them with a thin
// line. Made by hand, because the links that fall out of the words' own "related" lists are noisy (a
// kitchen word happens to point at a quality word, and the kitchen ends up beside "qualities").
// [theme, theme, strength]: 6 = the same area, 4 = clear neighbours, 3 = a looser tie.
export const THEME_LINKS: [string, string, number][] = [
  // work, money, offices
  ['Beruf und Wirtschaft', 'Ideen und Pläne', 4],
  ['Beruf und Wirtschaft', 'Zeit und Kalender', 3],
  ['Beruf und Wirtschaft', 'Computer und Internet', 3],
  ['Beruf und Wirtschaft', 'Geld und Bank', 5],
  ['Beruf und Wirtschaft', 'Schule und Lernen', 3],
  ['Geld und Bank', 'Behörden und Recht', 3],
  ['Geld und Bank', 'Stadt und Einkaufen', 3],
  ['Behörden und Recht', 'Politik und Gesellschaft', 6],
  ['Politik und Gesellschaft', 'Medien und Kultur', 3],
  ['Politik und Gesellschaft', 'Umwelt und Energie', 3],
  // home and food
  ['Haus und Möbel', 'Essen und Trinken', 5],
  ['Haus und Möbel', 'Familie und Beziehungen', 4],
  ['Essen und Trinken', 'Stadt und Einkaufen', 4],
  ['Kleidung', 'Stadt und Einkaufen', 4],
  // getting around, time, travel
  ['Reisen', 'Stadt und Einkaufen', 4],
  ['Reisen', 'Alltag und Bewegung', 4],
  ['Zeit und Kalender', 'Alltag und Bewegung', 4],
  ['Reisen', 'Freizeit und Sport', 4],
  ['Reisen', 'Wetter und Natur', 3],
  ['Alltag und Bewegung', 'Körper und Gesundheit', 3],
  // nature
  ['Wetter und Natur', 'Tiere', 6],
  ['Wetter und Natur', 'Umwelt und Energie', 6],
  ['Wetter und Natur', 'Kleidung', 3],
  ['Tiere', 'Essen und Trinken', 2],
  // people and feelings
  ['Familie und Beziehungen', 'Gefühle und Charakter', 4],
  ['Gefühle und Charakter', 'Eigenschaften', 6],
  ['Eigenschaften', 'Familie und Beziehungen', 3],
  ['Gefühle und Charakter', 'Ideen und Pläne', 5],
  ['Körper und Gesundheit', 'Gefühle und Charakter', 3],
  ['Körper und Gesundheit', 'Freizeit und Sport', 4],
  // speaking, learning, media
  ['Sprechen und Mitteilen', 'Schule und Lernen', 4],
  ['Sprechen und Mitteilen', 'Medien und Kultur', 4],
  ['Sprechen und Mitteilen', 'Familie und Beziehungen', 3],
  ['Schule und Lernen', 'Computer und Internet', 3],
  ['Computer und Internet', 'Medien und Kultur', 4],
  ['Medien und Kultur', 'Freizeit und Sport', 4],
];

// How hard each theme is, 1 (everyday basics) to 5 (abstract or official): a judgement by hand, until the
// words have real frequency data to compute it from. The map puts the easy themes at the top left and the
// hard ones at the bottom right. A theme that is missing here counts as 3.
export const THEME_LEVEL: Record<string, number> = {
  'Essen und Trinken': 1,
  'Familie und Beziehungen': 1,
  'Zeit und Kalender': 1,
  'Haus und Möbel': 2,
  Kleidung: 2,
  'Körper und Gesundheit': 2,
  'Stadt und Einkaufen': 2,
  'Alltag und Bewegung': 2,
  'Wetter und Natur': 2,
  Tiere: 2,
  Reisen: 3,
  'Freizeit und Sport': 3,
  'Schule und Lernen': 3,
  Eigenschaften: 3,
  'Gefühle und Charakter': 3,
  'Sprechen und Mitteilen': 3,
  'Beruf und Wirtschaft': 4,
  'Geld und Bank': 4,
  'Medien und Kultur': 4,
  'Computer und Internet': 4,
  'Ideen und Pläne': 4,
  'Behörden und Recht': 5,
  'Umwelt und Energie': 5,
  'Politik und Gesellschaft': 5,
};

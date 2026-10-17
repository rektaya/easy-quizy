// Words whose id changed when they became reflexive ("ernähren" is now "sich ernähren"): a rating, a card or a
// deletion saved under the old id is carried over to the new one when the app loads.
export const RENAMED_WORDS: Record<string, string> = {
  ernaehren: 'sich-ernaehren',
  verletzen: 'sich-verletzen',
  konzentrieren: 'sich-konzentrieren',
  fuehlen: 'sich-fuehlen',
  interessieren: 'sich-interessieren',
  beruhigen: 'sich-beruhigen',
  benehmen: 'sich-benehmen',
  aergern: 'sich-aergern',
  entschuldigen: 'sich-entschuldigen',
  setzen: 'sich-setzen',
  kuemmern: 'sich-kuemmern',
  legen: 'sich-legen',
  vorbereiten: 'sich-vorbereiten',
  beeilen: 'sich-beeilen',
  naehern: 'sich-naehern',
  spezialisieren: 'sich-spezialisieren',
  bewerben: 'sich-bewerben',
  ausdenken: 'sich-ausdenken',
  'vorstellen': 'sich-vorstellen',
  'erinnern': 'sich-erinnern',
};

/** The same record with every renamed id replaced by its new one (anything else is left as it is). */
export function carryOver<T>(record: Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [id, v] of Object.entries(record ?? {})) out[RENAMED_WORDS[id] ?? id] = v;
  return out;
}

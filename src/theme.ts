// Look: a deep navy night (#0C1927) with a sparse field of small, dim stars (components/StarBackground), light
// ink, one orange accent, lowercase Satoshi, tight letter-spacing, frosted cards, chunky buttons.
export const colors = {
  bg: '#0C1927',
  surface: 'rgba(255,255,255,0.07)', // frosted cards, fields, ghost buttons
  surfaceSolid: '#1D2936', // the same look, but opaque: for what floats over scrolling content (the tab bar), so nothing shows through it
  border: 'rgba(255,255,255,0.12)',
  card: '#15263A', // a solid card that must hide what is behind it
  chip: 'rgba(255,255,255,0.1)', // small pills: similar words, sort options
  text: '#EFF2F5', // light ink, used for text and icons
  textSecondary: '#A5B0BD',
  textTertiary: '#6F7E90',
  track: '#22364B', // the empty ring of the circle
  accent: '#F75831', // filled buttons, active tab
  onAccent: '#FFFFFF',
  toast: '#EFF2F5',
  onToast: '#0C1927',
  backdrop: '#08101A', // solid, under a card laid over a list: nothing of the list shows through
  scrim: 'rgba(4,9,16,0.62)', // the dimmed screen behind a bottom sheet
} as const;

// The light of the app: every star, glow and status ring is drawn from these six colours (the shine of a rating and of
// the stars of the week run from `blue` to `cream`, see circle/shine.ts). `deep` is the one dark blue: a star that is not lit.
export const stars = {
  deep: '#4068D8', // not lit: the ring of a word you do not know at all, a day without study
  blue: '#6EA5FF', // the weakest shine: shaky
  ice: '#C9DDFF', // the cool white-blue middle: getting there, the far stars
  cream: '#FFF4DC', // the bright heart of a lit star
  gold: '#FFB45E', // learned: a warm gold
  ember: '#FF9637', // the orange glow round a star that shines strongly
} as const;

/** A colour of the theme as rgba(), with the given opacity (also for the Skia drawings, which take strings). */
export function alpha(hex: string, a: number): string {
  'worklet'; // some drawings (the glow at the end of the ring) take their colours in animated values, which run on the UI thread
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A colour of the theme as [r, g, b], for the shine ramps. */
export function rgbOf(hex: string): [number, number, number] {
  'worklet';
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const fonts = {
  regular: 'AppFont_Regular',
  medium: 'AppFont_Medium',
  display: 'AppFont_Display', // headlines and big text (22 and up): the German word in the circle, its translation, page titles, big numbers
} as const; // loaded under these names in src/useAppFonts.ts (Satoshi)

/** Letter-spacing of a text of this size: -1% of the size (React Native only takes points). Applied by components/Text.tsx. */
export const tracking = (size: number) => -size * 0.01;

export const radius = { chip: 999, card: 26, button: 16, tile: 14 } as const;

export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;


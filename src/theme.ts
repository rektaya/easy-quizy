// Look: a deep navy night (#0C1927) with a sparse field of small, dim stars (components/StarBackground), light
// ink, one orange accent, lowercase Figtree, frosted cards, chunky buttons.
// The circle's red-to-green arc is the one functional exception (see circle/color.ts):
// its color is the rating signal itself.
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
} as const;

export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
} as const;

export const radius = { chip: 999, card: 26, button: 16, tile: 14 } as const;

export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;


// Look: soft grey paper, one warm ink color, lowercase Figtree, frosted cards, chunky buttons.
// The circle's red-to-green arc is the one functional exception (see circle/color.ts):
// its color is the rating signal itself.
export const colors = {
  bg: '#E3E1DF',
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.8)',
  text: '#A8360A', // deep orange ink, used for text and icons
  textSecondary: '#9A6448',
  textTertiary: '#C2A08C',
  track: '#D3CFCB',
  accent: '#E85D0C', // filled buttons, active tab
  onAccent: '#FFF6EE',
  toast: '#3A2A20',
  onToast: '#FFF6EE',
} as const;

export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
} as const;

export const radius = { chip: 999, card: 26, button: 16, tile: 14 } as const;

export const shadow = {
  shadowColor: '#5A3A22',
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

/** Bottom space screens leave free for the floating tab bar. */
export const TAB_BAR_SPACE = 104;

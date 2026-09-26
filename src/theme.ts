// Look: cool grey paper, one deep navy ink color, lowercase Figtree, frosted cards, chunky buttons.
// The circle's red-to-green arc is the one functional exception (see circle/color.ts):
// its color is the rating signal itself.
export const colors = {
  bg: '#EFF2F5',
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.8)',
  text: '#0C1927', // deep navy ink, used for text and icons
  textSecondary: '#566577',
  textTertiary: '#8E99A6',
  track: '#D2D9E0',
  accent: '#F75831', // filled buttons, active tab
  onAccent: '#FFFFFF',
  toast: '#0C1927',
  onToast: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
} as const;

export const radius = { chip: 999, card: 26, button: 16, tile: 14 } as const;

export const shadow = {
  shadowColor: '#1B2B3D',
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

/** Bottom space screens leave free for the floating tab bar. */
export const TAB_BAR_SPACE = 104;

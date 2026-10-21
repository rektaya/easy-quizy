import React from 'react';
import Animated from 'react-native-reanimated';
import { colors, radius } from '../theme';

type Props = React.ComponentProps<typeof Animated.View> & {
  /** The corners: `card` (the default), or `tile` for a small one. */
  round?: 'card' | 'tile';
  /** A fuller veil (`chip`) for a card that floats over the Map's sky. */
  strong?: boolean;
};

// The frosted plate everything in a settings page sits on: a faint white veil over the night, a hairline edge and big round
// corners. Used for the setting cards, the week of stars, the credits and the Map's topic card. It is see-through, so it
// never floats over scrolling content (that is `Plate`).
export function Card({ round = 'card', strong, style, ...rest }: Props) {
  return <Animated.View {...rest} style={[styles.card, { borderRadius: radius[round] }, strong && styles.strong, style]} />;
}

const styles = {
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  strong: { backgroundColor: colors.chip },
} as const;

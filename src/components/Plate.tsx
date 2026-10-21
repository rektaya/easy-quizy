import React from 'react';
import Animated from 'react-native-reanimated';
import { colors, radius, shadow } from '../theme';

type Props = React.ComponentProps<typeof Animated.View> & {
  /** The corners: `chip` for a one-line message, `button` for a hint of a few lines, `tile` (the default) for a menu, `card` for a whole card. */
  round?: keyof typeof radius;
};

// The solid plate that floats over the screen: a card colour that hides what is behind it, a hairline edge and a soft shadow.
// The rating badge, the hint over the circle, the menus and the word card are all this. (A see-through plate is `Card`.)
export function Plate({ round = 'tile', style, ...rest }: Props) {
  return <Animated.View {...rest} style={[styles.plate, { borderRadius: radius[round] }, style]} />;
}

const styles = {
  plate: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
} as const;

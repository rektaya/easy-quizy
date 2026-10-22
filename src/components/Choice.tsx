import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';

const Chosen = React.createContext(false);

// Something you pick one of: a tile, a row or a pill. It is a frosted `chip` with a hairline; **the chosen one is filled orange**
// with its text in white (while it is pressed it looks chosen too). This is the one way a choice is shown (a menu marks its
// current item with a dot instead, see `MenuItem`). Text inside it is a `ChoiceText`, which turns white by itself.
export function Choice({
  selected,
  onPress,
  disabled,
  round = 'chip',
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  children,
}: {
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  round?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'radio';
  accessibilityLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.base, { borderRadius: radius[round] }, (selected || pressed) && styles.chosen, style]}
    >
      {({ pressed }) => <Chosen.Provider value={!!selected || pressed}>{children}</Chosen.Provider>}
    </Pressable>
  );
}

/** Text inside a `Choice`: light ink (or the quiet grey with `quiet`), white on the chosen one. */
export function ChoiceText({ quiet, style, ...rest }: React.ComponentProps<typeof Text> & { quiet?: boolean }) {
  const chosen = React.useContext(Chosen);
  return <Text {...rest} style={[{ color: chosen ? colors.onAccent : quiet ? colors.textSecondary : colors.text }, style as StyleProp<TextStyle>]} />;
}

// A word or a short choice as a small pill. `size` m is for a choice in a form and a select, s for the words under a card.
export function Pill({
  label,
  onPress,
  selected,
  size = 's',
  right,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  size?: 's' | 'm';
  right?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const m = size === 'm';
  return (
    <Choice selected={selected} onPress={onPress} accessibilityLabel={accessibilityLabel ?? label} style={[styles.pill, m && styles.pillM]}>
      <ChoiceText style={m ? styles.textM : styles.textS}>{label}</ChoiceText>
      {right}
    </Choice>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.chip },
  chosen: { backgroundColor: colors.accent, borderColor: colors.accent },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  pillM: { paddingVertical: 9 },
  textS: { fontFamily: fonts.medium, fontSize: 13 },
  textM: { fontFamily: fonts.medium, fontSize: 15 },
});

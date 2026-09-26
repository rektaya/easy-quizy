import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotGrid } from '../components/DotGrid';
import { useRatings } from '../state/ratings';
import { TAB_BAR_SPACE, colors, fonts, radius, shadow } from '../theme';

type Props = { title: string; note: string; showReset?: boolean; showDots?: boolean };

export default function PlaceholderScreen({ title, note, showReset, showDots }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ratings, pileCount, reset } = useRatings();
  const gridWidth = width - 48 - 40;
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note}</Text>
      {showDots ? (
        <View style={styles.card}>
          <DotGrid width={gridWidth} height={gridWidth * 1.15} filled={Object.keys(ratings).length} />
          <Text style={styles.cardFoot}>
            <Text style={styles.strong}>{Object.keys(ratings).length}</Text>{' '}
            {Object.keys(ratings).length === 1 ? 'word' : 'words'} on your map
          </Text>
        </View>
      ) : null}
      <Text style={styles.count}>
        {pileCount} {pileCount === 1 ? 'word' : 'words'} in your pile
      </Text>
      {showReset ? (
        <Pressable onPress={reset} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>reset prototype data</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_SPACE,
    gap: 12,
  },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    marginTop: 8,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  cardFoot: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  strong: { fontFamily: fonts.medium, color: colors.text },
  count: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 6 },
  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow,
  },
  buttonText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});

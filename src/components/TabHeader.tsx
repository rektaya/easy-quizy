import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

/** Height of the header row; screens below it lay out from here. */
export const HEADER_HEIGHT = 32;

type Props = {
  title?: string;
  right?: React.ReactNode;
  /** Title colour, for screens on a dark background. */
  color?: string;
  /** A hidden gesture on the title (used for "start over" while the app is being tested). */
  onTitleLongPress?: () => void;
};

// The header of a tab's main screen: its name, always in the same place (top left), with room for a
// small status on the right (also without a title, as in the first-run calibration).
export function TabHeader({ title, right, color, onTitleLongPress }: Props) {
  return (
    <View style={[styles.row, !title && styles.noTitle]}>
      {title ? (
        <Text style={[styles.title, color ? { color } : null]} accessibilityRole="header" onLongPress={onTitleLongPress}>
          {title}
        </Text>
      ) : null}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: HEADER_HEIGHT },
  noTitle: { justifyContent: 'flex-end' },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
});

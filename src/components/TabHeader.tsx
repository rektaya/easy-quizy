import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

/** Height of the header row; screens below it lay out from here. */
export const HEADER_HEIGHT = 32;

type Props = { title?: string; right?: React.ReactNode; /** Title colour, for screens on a dark background. */ color?: string };

// The header of a tab's main screen: its name, always in the same place (top left), with room for a
// small status on the right. Without a title (the first-run calibration) the status sits on the left.
export function TabHeader({ title, right, color }: Props) {
  return (
    <View style={[styles.row, !title && styles.noTitle]}>
      {title ? (
        <Text style={[styles.title, color ? { color } : null]} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: HEADER_HEIGHT },
  noTitle: { justifyContent: 'flex-start' },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
});

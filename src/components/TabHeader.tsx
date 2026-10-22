import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts } from '../theme';

/** Height of the header row; screens below it lay out from here. */
export const HEADER_HEIGHT = 32;

type Props = {
  title?: string;
  /** Instead of a plain title: anything in the title's place (Explore's "explore by ..." select). */
  titleNode?: React.ReactNode;
  /** In the middle of the row. */
  center?: React.ReactNode;
  right?: React.ReactNode;
  /** Title colour, for screens on a dark background. */
  color?: string;
  /** A hidden gesture on the title (used for "start over" while the app is being tested). */
  onTitleLongPress?: () => void;
};

// The header of a tab's main screen: its name, always in the same place (top left), with room for a
// small status on the right (also without a title, as in the first-run calibration).
export function TabHeader({ title, titleNode, center, right, color, onTitleLongPress }: Props) {
  return (
    <View style={[styles.row, !title && !titleNode && styles.noTitle]}>
      {titleNode ?? null}
      {title ? (
        <Text style={[styles.title, color ? { color } : null]} accessibilityRole="header" onLongPress={onTitleLongPress}>
          {title}
        </Text>
      ) : null}
      {center ? (
        <View pointerEvents="box-none" style={styles.center}>
          {center}
        </View>
      ) : null}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: HEADER_HEIGHT },
  noTitle: { justifyContent: 'flex-end' },
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
});

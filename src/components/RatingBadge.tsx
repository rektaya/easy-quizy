import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Plate } from './Plate';
import { HEADER_HEIGHT } from './TabHeader';

/** Where the badge sits, measured from the top of the screen's safe area: the same on every screen that has one. */
export const BADGE_TOP = 12 + HEADER_HEIGHT + 22;
/** How far down the badge reaches (its own height included), for screens that make room for it. */
export const BADGE_BOTTOM = BADGE_TOP + 40;
/** How long the badge stays after the answer was given or changed. */
const BADGE_MS = 2000;

/**
 * The badge in its one place (under the first line of the screen): what the word's answer is ("added to study" or
 * "marked as known"). It shows for two seconds after the answer is given, follows the handle while the answer is
 * being changed (and shows again for two seconds when what it says changes), and fades away. Explore and the practice
 * screen use it.
 */
export function RatingBadge({ message }: { message: string }) {
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(true);
    const t = setTimeout(() => setShown(false), BADGE_MS);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <View pointerEvents="none" style={[styles.slot, { top: insets.top + BADGE_TOP }]}>
      {shown ? (
        <Plate round="chip" entering={FadeInDown.duration(180)} exiting={FadeOut.duration(260)} style={styles.plate}>
          <Text style={styles.message}>{message}</Text>
        </Plate>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  plate: { paddingHorizontal: 18, paddingVertical: 12 },
  message: { fontFamily: fonts.regular, color: colors.text, fontSize: 15 },
});

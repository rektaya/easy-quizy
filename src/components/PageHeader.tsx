import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts } from '../theme';
import { ChevronLeftIcon } from './Icons';

// The header of a page one level down from a tab (add new word, a topic's words, credits): the chevron that goes back at the
// left edge and the title in the middle of the row, with a quiet line under the title when it has one. (A tab's own header is
// `TabHeader`.) It has no side padding of its own: put it inside the page's 24 px margin.
export function PageHeader({ title, sub, onBack }: { title: string; sub?: string; onBack: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="back" hitSlop={12} style={styles.back}>
        <ChevronLeftIcon color={colors.text} size={28} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'center', minHeight: 32 },
  back: { position: 'absolute', left: -6, top: 0, height: 32, justifyContent: 'center', zIndex: 1 },
  titles: { alignItems: 'center', gap: 2, paddingHorizontal: 34 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});

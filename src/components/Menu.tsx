import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { Plate } from './Plate';

type MenuProps = Omit<React.ComponentProps<typeof Plate>, 'round' | 'entering' | 'exiting'>;

// A menu: a small plate that opens from a select or an icon, over everything, and fades in and out. Its items are `MenuItem`s.
// It closes with a tap anywhere else (the screen that opens it provides that).
export function Menu({ style, ...rest }: MenuProps) {
  return <Plate {...rest} entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.menu, style]} />;
}

// One choice in a menu: its name, a line under it when it needs one, and a small orange dot at the right on the one
// that is chosen now.
export function MenuItem({ label, hint, selected, onPress }: { label: string; hint?: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }} style={styles.item}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {selected ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: { paddingVertical: 6 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  text: { flexShrink: 1, gap: 2 },
  label: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});

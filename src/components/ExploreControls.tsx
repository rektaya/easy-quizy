import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { THEMES } from '../data/words';
import type { FeedBy, PosFilter } from '../onboarding/feed';
import type { ExploreSettings } from '../state/profile';
import { colors, fonts, radius, shadow } from '../theme';
import { FilterIcon } from './Icons';

// The controls of Explore: the title "explore" with a filter icon at the end of its row, and under it a small grey
// line that continues the sentence, "by association" ("by theme in kitchen"): both parts are selects.
export type Menu = null | 'by' | 'theme' | 'filters';

/** The height of the second line ("by association"), which everything below it makes room for. */
export const BY_ROW_HEIGHT = 26;

const BY: { key: FeedBy; label: string; hint: string }[] = [
  { key: 'association', label: 'association', hint: 'follows the words that go with the one you see' },
  { key: 'theme', label: 'theme', hint: 'stays in one topic' },
  { key: 'usefulness', label: 'usefulness', hint: 'the most common words first' },
];
const LEVEL: { key: -1 | 0 | 1; label: string }[] = [
  { key: -1, label: 'easier' },
  { key: 0, label: 'my level' },
  { key: 1, label: 'harder' },
];
const POS: { key: PosFilter; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'noun', label: 'nouns' },
  { key: 'verb', label: 'verbs' },
  { key: 'other', label: 'adj & adv' },
];

export const byLabel = (by: FeedBy) => BY.find((o) => o.key === by)?.label ?? by;
export const themeName = (id: string | null) => THEMES.find((t) => t.id === id)?.en ?? 'a theme';
/** The filters differ from the usual: the filter icon says so. */
export const filtersActive = (e: ExploreSettings) => e.level !== 0 || e.pos !== 'all';

/**
 * The second line, small and grey, continuing the title: "by association", and when exploring by theme
 * "by theme in kitchen". "by ..." opens the ways of exploring, "in ..." opens the themes.
 */
export function ExploreByRow({
  by,
  theme,
  menu,
  onMenu,
}: {
  by: FeedBy;
  theme: string | null;
  menu: Menu;
  onMenu: (m: Menu) => void;
}) {
  return (
    <View style={styles.byRow}>
      <Text style={styles.byText}>
        <Text
          onPress={() => onMenu(menu === 'by' ? null : 'by')}
          accessibilityRole="button"
          accessibilityLabel={`explore by ${byLabel(by)}, change`}
          suppressHighlighting
        >
          <Text style={styles.word}>by </Text>
          {byLabel(by)}
        </Text>
        {by === 'theme' ? (
          <Text
            onPress={() => onMenu(menu === 'theme' ? null : 'theme')}
            accessibilityRole="button"
            accessibilityLabel={`theme: ${themeName(theme)}, change`}
            suppressHighlighting
          >
            {' '}
            <Text style={styles.word}>in </Text>
            {themeName(theme)}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

/** The filter icon (a filled funnel), at the right end of the title row. It is orange when a filter is on. */
export function FilterButton({ settings, menu, onMenu }: { settings: ExploreSettings; menu: Menu; onMenu: (m: Menu) => void }) {
  const active = filtersActive(settings);
  const open = menu === 'filters';
  return (
    <Pressable
      onPress={() => onMenu(open ? null : 'filters')}
      accessibilityRole="button"
      accessibilityLabel={active ? 'filters (changed)' : 'filters'}
      accessibilityState={{ expanded: open }}
      hitSlop={8}
      style={[styles.iconButton, open && styles.iconButtonOn]}
    >
      <FilterIcon color={open ? colors.onAccent : active ? colors.accent : colors.textSecondary} />
    </Pressable>
  );
}

/** The menus: they open over everything, a tap anywhere else closes them. */
export function ExploreMenus({
  menu,
  top,
  settings,
  onMenu,
  onChange,
  onPickBy,
}: {
  menu: Menu;
  /** Where the menus start: just under the title row. */
  top: number;
  settings: ExploreSettings;
  onMenu: (m: Menu) => void;
  onChange: (patch: Partial<ExploreSettings>) => void;
  onPickBy: (by: FeedBy) => void;
}) {
  if (!menu) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onMenu(null)} accessibilityLabel="close the menu" accessibilityRole="button" />

      {menu === 'by' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, { top: top + BY_ROW_HEIGHT, left: 24 }]}>
          {BY.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                onPickBy(o.key);
                onMenu(o.key === 'theme' ? 'theme' : null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.by === o.key }}
              style={styles.byItem}
            >
              <View style={styles.byItemText}>
                <Text style={styles.byLabel}>{o.label}</Text>
                <Text style={styles.byHint}>{o.hint}</Text>
              </View>
              {settings.by === o.key ? <View style={styles.selectedDot} /> : null}
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {menu === 'theme' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.themeCard, { top: top + BY_ROW_HEIGHT, left: 24 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {THEMES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  onChange({ theme: t.id });
                  onMenu(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: settings.theme === t.id }}
                style={styles.byItem}
              >
                <Text style={styles.byLabel}>{t.en}</Text>
                {settings.theme === t.id ? <View style={styles.selectedDot} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      {menu === 'filters' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.filterCard, { top, right: 24 }]}>
          <Text style={styles.section}>level</Text>
          <View style={styles.chips}>
            {LEVEL.map((o) => (
              <Chip key={o.key} label={o.label} on={settings.level === o.key} onPress={() => onChange({ level: o.key })} />
            ))}
          </View>
          <Text style={styles.section}>words</Text>
          <View style={styles.chips}>
            {POS.map((o) => (
              <Chip key={o.key} label={o.label} on={settings.pos === o.key} onPress={() => onChange({ pos: o.key })} />
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  byRow: { minHeight: BY_ROW_HEIGHT, justifyContent: 'center' },
  byText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  word: { color: colors.text }, // the little words of the sentence, "by" and "in", are white; the choices are grey
  iconButton: { width: 34, height: 34, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  iconButtonOn: { backgroundColor: colors.accent },
  card: {
    position: 'absolute',
    paddingVertical: 6,
    borderRadius: radius.tile,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  themeCard: { maxHeight: 360, minWidth: 200 },
  filterCard: { width: 280, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  byItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingHorizontal: 16, paddingVertical: 11 },
  byItemText: { gap: 1 },
  byLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  byHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  selectedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  section: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.chip, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.onAccent },
});

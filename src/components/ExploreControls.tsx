import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { THEMES } from '../data/words';
import type { FeedBy, PosFilter } from '../onboarding/feed';
import type { ExploreSettings } from '../state/profile';
import { colors, fonts, radius, shadow } from '../theme';

// The controls of Explore: the title "explore" with the filter icon (a funnel) at the end of its row, and under it
// two selects on glass pills: the way of exploring (association by default) and, by theme, the topic.
export type Menu = null | 'by' | 'theme' | 'level' | 'words';

/** The height of a one-line title (used when a select has not been measured yet). */
const HEADER_ROW = 32;

/** The ways of exploring, with a line that says what each does (the menu of the first select, and the first-run step). */
export const BY: { key: FeedBy; label: string; hint: string }[] = [
  { key: 'association', label: 'association', hint: 'follows the words that go with the one you see' },
  { key: 'theme', label: 'theme', hint: 'stays in one topic' },
  { key: 'usefulness', label: 'usefulness', hint: 'the most common words first' },
  { key: 'free', label: 'free', hint: 'any word at your level, no connections' },
];
// level: how hard the words are for you; words: which kinds of words
const LEVEL: { key: -1 | 0 | 1; label: string; hint: string }[] = [
  { key: -1, label: 'easier', hint: 'a little below your level' },
  { key: 0, label: 'my level', hint: 'words that fit you' },
  { key: 1, label: 'harder', hint: 'a little above your level' },
];
const POS: { key: PosFilter; label: string; pill: string }[] = [
  { key: 'all', label: 'all words', pill: 'all words' },
  { key: 'noun', label: 'nouns', pill: 'nouns' },
  { key: 'verb', label: 'verbs', pill: 'verbs' },
  { key: 'other', label: 'adjectives & adverbs', pill: 'adj & adv' },
];

export const byLabel = (by: FeedBy) => BY.find((o) => o.key === by)?.label ?? by;
export const themeName = (id: string | null) => THEMES.find((t) => t.id === id)?.en ?? 'a theme';

export type Rect = { x: number; y: number; w: number; h: number };
/** Where each select sits inside the title, so that its menu can open right under it. */
export type Anchors = Partial<Record<'by' | 'theme' | 'level' | 'words', Rect>>;
export type AnchorName = keyof Anchors;

const rectOf = (e: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }): Rect => ({
  x: e.nativeEvent.layout.x,
  y: e.nativeEvent.layout.y,
  w: e.nativeEvent.layout.width,
  h: e.nativeEvent.layout.height,
});

/**
 * The title of Explore: "explore" and, next to it, three selects on glass pills like the other cards: how the words are
 * chosen ("by association", by default; the others are by theme, by usefulness, by free), only when exploring by theme the
 * topic (\"in travel\"), the level (\"my level\", \"easier\", \"harder\") and the kind of words (\"all words\", \"nouns\", ...). When they do not fit on one line they go on to the next.
 */
export function ExploreTitle({
  by,
  theme,
  settings,
  menu,
  onMenu,
  onAnchor,
}: {
  by: FeedBy;
  /** The topic, only when exploring by theme. */
  theme?: string | null;
  settings: ExploreSettings;
  menu: Menu;
  onMenu: (m: Menu) => void;
  onAnchor: (name: AnchorName, rect: Rect) => void;
}) {
  const levelLabel = LEVEL.find((o) => o.key === settings.level)?.label ?? 'my level';
  const posPill = POS.find((o) => o.key === settings.pos)?.pill ?? 'all words';
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title} accessibilityRole="header">
        explore
      </Text>
      <Pressable
        onPress={() => onMenu(menu === 'by' ? null : 'by')}
        onLayout={(e) => onAnchor('by', rectOf(e))}
        accessibilityRole="button"
        accessibilityLabel={`way of exploring: ${byLabel(by)}, change`}
        accessibilityState={{ expanded: menu === 'by' }}
        hitSlop={8}
        style={[styles.pill, styles.pillKeep]}
      >
        <Text style={styles.pillText} numberOfLines={1}>
          <Text style={styles.pillPrefix}>by </Text>
          {byLabel(by)}
        </Text>
      </Pressable>
      {theme !== undefined ? (
        <Pressable
          onPress={() => onMenu(menu === 'theme' ? null : 'theme')}
          onLayout={(e) => onAnchor('theme', rectOf(e))}
          accessibilityRole="button"
          accessibilityLabel={`topic: ${themeName(theme)}, change`}
          accessibilityState={{ expanded: menu === 'theme' }}
          hitSlop={8}
          style={[styles.pill, styles.pillShrink]}
        >
          <Text style={styles.pillText} numberOfLines={1}>
            <Text style={styles.pillPrefix}>in </Text>
            {themeName(theme)}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => onMenu(menu === 'level' ? null : 'level')}
        onLayout={(e) => onAnchor('level', rectOf(e))}
        accessibilityRole="button"
        accessibilityLabel={`level: ${levelLabel}, change`}
        accessibilityState={{ expanded: menu === 'level' }}
        hitSlop={8}
        style={[styles.pill, styles.pillKeep]}
      >
        <Text style={styles.pillText} numberOfLines={1}>
          {levelLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onMenu(menu === 'words' ? null : 'words')}
        onLayout={(e) => onAnchor('words', rectOf(e))}
        accessibilityRole="button"
        accessibilityLabel={`words: ${posPill}, change`}
        accessibilityState={{ expanded: menu === 'words' }}
        hitSlop={8}
        style={[styles.pill, styles.pillKeep]}
      >
        <Text style={styles.pillText} numberOfLines={1}>
          {posPill}
        </Text>
      </Pressable>
    </View>
  );
}

/** The menus: they open over everything, a tap anywhere else closes them. */
export function ExploreMenus({
  menu,
  origin,
  anchors,
  settings,
  onMenu,
  onChange,
  onPickBy,
}: {
  menu: Menu;
  /** The top of the title, on the screen. */
  origin: number;
  /** Where each select sits inside the title; its menu opens right under it. */
  anchors: Anchors;
  settings: ExploreSettings;
  onMenu: (m: Menu) => void;
  onChange: (patch: Partial<ExploreSettings>) => void;
  onPickBy: (by: FeedBy) => void;
}) {
  const { width } = useWindowDimensions();
  if (!menu) return null;
  const a = anchors[menu];
  const top = origin + (a ? a.y + a.h : HEADER_ROW) + 6;
  const fromX = 24 + (a?.x ?? 0);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onMenu(null)} accessibilityLabel="close the menu" accessibilityRole="button" />

      {menu === 'by' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.byCard, { top, left: Math.min(fromX, width - 24 - 280) }]}>
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
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.themeCard, { top, left: Math.min(fromX, width - 24 - 200) }]}>
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

      {menu === 'level' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.levelCard, { top, left: Math.min(fromX, width - 24 - 240) }]}>
          {LEVEL.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                onChange({ level: o.key });
                onMenu(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.level === o.key }}
              style={styles.byItem}
            >
              <View style={styles.byItemText}>
                <Text style={styles.byLabel}>{o.label}</Text>
                <Text style={styles.byHint}>{o.hint}</Text>
              </View>
              {settings.level === o.key ? <View style={styles.selectedDot} /> : null}
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {menu === 'words' ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, styles.levelCard, { top, left: Math.min(fromX, width - 24 - 240) }]}>
          {POS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                onChange({ pos: o.key });
                onMenu(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.pos === o.key }}
              style={styles.byItem}
            >
              <Text style={styles.byLabel}>{o.label}</Text>
              {settings.pos === o.key ? <View style={styles.selectedDot} /> : null}
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  byCard: { minWidth: 280 },
  // the title: "explore" and, by theme, the topic as a glass pill
  // the title: "explore" and, next to it, the selects on glass pills (a faint light fill with a hairline edge, like the Map's card)
  titleRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  pill: {
    marginTop: 3, // the word "explore" sits a little low in its line (its tail letters), so the pill drops by half of this to share its middle
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillShrink: { flexShrink: 1 },
  pillKeep: { flexShrink: 0 }, // the way of exploring is never shortened; a long topic name gives way instead
  pillText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  pillPrefix: { fontFamily: fonts.regular, color: colors.textSecondary }, // the little word ("by", "in") is quieter than the choice
  // a menu in the middle of the screen's width
  centered: { alignSelf: 'center', left: undefined, right: undefined },
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
  levelCard: { minWidth: 240 },
  byItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingHorizontal: 16, paddingVertical: 11 },
  byItemText: { gap: 1 },
  byLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  byHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  selectedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
});

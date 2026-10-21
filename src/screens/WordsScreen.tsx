import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Menu, MenuItem } from '../components/Menu';
import { PlusIcon, SearchIcon, SortIcon } from '../components/Icons';
import { HEADER_HEIGHT, TabHeader } from '../components/TabHeader';
import { CardPager } from '../components/CardPager';
import { WordRow } from '../components/WordRow';
import { WORDS } from '../data/words';
import { STATUS_ORDER, wordStatus } from '../onboarding/status';
import type { Status } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';

type Sort = 'status' | 'a-z' | 'newest';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'status', label: 'status' },
  { key: 'a-z', label: 'a–z' },
  { key: 'newest', label: 'newest' },
];

// The Study tab's home: the words you are learning (gathered, not yet learned), with where each stands:
// searchable, sortable, and each one can be deleted. Tapping a word opens its full card. The "study"
// button starts a session. Deleting asks first, in a window, and the word is
// never offered again.
export default function WordsScreen({
  bottomSpace,
  sessions,
  note,
  onAdd,
}: {
  bottomSpace: number;
  /** The session that can be started now: a button (none when nothing is ready). */
  sessions: { label: string; onPress: () => void }[];
  /** Said above the buttons when no session is ready. */
  note?: string;
  /** The plus: add a word of your own. */
  onAdd: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { ratings, unrate } = useRatings();
  const { cards, removeWord } = useProfile();
  const [openId, setOpenId] = useState<string | null>(null); // the word whose card is showing
  const nudged = useRef(false); // the first card of a visit shows a little sideways nudge, to say "swipe"
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false); // the list of ways to sort, hidden behind the sort icon
  const [searching, setSearching] = useState(false); // the search field is hidden until the magnifier is tapped
  const [sort, setSort] = useState<Sort>('status');

  const q = query.trim().toLowerCase();
  const statusFor = (id: string) => wordStatus(id, ratings, cards);
  // the words in study: gathered, and not yet learned
  const inPile = WORDS.filter((w) => ratings[w.id] && statusFor(w.id) !== 'learned');
  const shown = inPile
    .filter((w) => !q || w.lemma.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'newest') return ratings[b.id].at - ratings[a.id].at;
      if (sort === 'a-z') return a.lemma.localeCompare(b.lemma, 'de');
      return (
        STATUS_ORDER.indexOf(statusFor(a.id) as Status) - STATUS_ORDER.indexOf(statusFor(b.id) as Status) ||
        a.lemma.localeCompare(b.lemma, 'de')
      );
    });

  const openIndex = openId ? shown.findIndex((w) => w.id === openId) : -1;

  // Deleting asks first, in a window: the word is never offered again.
  const remove = (id: string, lemma: string) => {
    Alert.alert(
      'delete this word?',
      `are you sure you want to delete “${lemma}”? it will not be offered to you again.`,
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'delete',
          style: 'destructive',
          onPress: () => {
            unrate(id);
            removeWord(id);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }]}>
      <TabHeader
        title="study"
        right={
          <View style={styles.headerIcons}>
            <Pressable
              onPress={() => {
                setSortOpen((v) => !v);
                setSearching(false);
                setQuery('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`sort words, now by ${SORTS.find((o) => o.key === sort)?.label}`}
              accessibilityState={{ expanded: sortOpen }}
              hitSlop={8}
              style={[styles.iconButton, sortOpen && styles.iconButtonOn]}
            >
              <SortIcon color={sortOpen ? colors.onAccent : colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (searching) setQuery('');
                setSearching((v) => !v);
                setSortOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={searching ? 'close the search' : 'search words'}
              accessibilityState={{ selected: searching }}
              hitSlop={8}
              style={[styles.iconButton, searching && styles.iconButtonOn]}
            >
              <SearchIcon color={searching ? colors.onAccent : colors.textSecondary} />
            </Pressable>
            <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="add a word of your own" hitSlop={8} style={styles.iconButton}>
              <PlusIcon color={colors.textSecondary} />
            </Pressable>
          </View>
        }
      />

      {searching ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="search words"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={styles.search}
          accessibilityLabel="search words"
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 8, gap: 12 }}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {shown.length === 0 ? (
          <Text style={styles.empty}>{q ? 'no words match' : 'no words yet. rate some in explore'}</Text>
        ) : null}
        {shown.map((w) => (
          <WordRow key={w.id} word={w} status={statusFor(w.id)} onOpen={() => setOpenId(w.id)} onDelete={() => remove(w.id, w.lemma)} />
        ))}
      </ScrollView>

      <View style={styles.action}>
        {sessions.length === 0 && note ? <Text style={styles.note}>{note}</Text> : null}
        {sessions.length === 0 ? <Button label="study" onPress={() => {}} disabled /> : null}
        <View style={styles.buttons}>
          {sessions.map((s, i) => (
            <View key={s.label} style={styles.session}>
              <Button label={s.label} onPress={s.onPress} kind={i === 0 ? 'primary' : 'ghost'} />
            </View>
          ))}
        </View>
      </View>

      {sortOpen ? (
        // the ways to sort are hidden in here until the sort icon is tapped
        <Menu style={[styles.menu, { top: insets.top + 12 + HEADER_HEIGHT + 6 }]}>
          {SORTS.map((o) => (
            <MenuItem
              key={o.key}
              label={o.label}
              selected={sort === o.key}
              onPress={() => {
                setSort(o.key);
                setSortOpen(false);
              }}
            />
          ))}
        </Menu>
      ) : null}

      {openIndex >= 0 ? (
        <CardPager
          words={shown}
          startIndex={openIndex}
          onClose={() => setOpenId(null)}
          statusFor={statusFor}
          top={insets.top + 12}
          bottom={bottomSpace}
          nudged={nudged}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, gap: 12 },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { width: 34, height: 34, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  iconButtonOn: { backgroundColor: colors.accent },
  menu: { position: 'absolute', right: 24, minWidth: 150 },
  list: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 12 },
  session: { flex: 1, gap: 6 },
  action: { gap: 12, paddingTop: 4 },
  note: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
});

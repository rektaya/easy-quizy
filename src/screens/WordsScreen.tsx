import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { SearchIcon, TrashIcon } from '../components/Icons';
import { TabHeader } from '../components/TabHeader';
import { WordCard } from '../components/WordCard';
import { WORDS } from '../data/words';
import { RING_AMBER, RING_GREEN, RING_RED } from '../circle/color';
import { STATUS_LABEL, STATUS_ORDER, statusOf } from '../onboarding/status';
import type { Status } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';

const STATUS_COLOR: Record<Status, string> = {
  new: '#AEB8C3',
  shaky: RING_RED,
  getting: RING_AMBER,
  solid: '#9ACD5A',
  learned: RING_GREEN,
};

type Sort = 'status' | 'a-z' | 'newest';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'status', label: 'status' },
  { key: 'a-z', label: 'a–z' },
  { key: 'newest', label: 'newest' },
];

// The Study tab's home: the words you are learning (gathered, not yet learned), with where each stands:
// searchable, sortable, and each one can be deleted. Tapping a word opens its full card. The "study"
// buttons start a session ("quick study", or "study all"). Deleting asks first, in a window, and the word is
// never offered again.
export default function WordsScreen({
  bottomSpace,
  sessions,
  note,
}: {
  bottomSpace: number;
  /** The sessions that can be started now (a quick one, a longer one): a button each. */
  sessions: { label: string; caption: string; onPress: () => void }[];
  /** Said above the buttons when no session is ready. */
  note?: string;
}) {
  const insets = useSafeAreaInsets();
  const { ratings, unrate } = useRatings();
  const { cards, removeWord } = useProfile();
  const [openId, setOpenId] = useState<string | null>(null); // the word whose card is showing
  const opened = openId ? WORDS.find((w) => w.id === openId) : undefined;
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false); // the search field is hidden until the magnifier is tapped
  const [sort, setSort] = useState<Sort>('status');

  const q = query.trim().toLowerCase();
  // a word marked known in Explore has no card; it counts as learned
  const statusFor = (id: string): Status => (!cards[id] && ratings[id]?.known ? 'learned' : statusOf(cards[id]));
  // the words in study: gathered, and not yet learned
  const inPile = WORDS.filter((w) => ratings[w.id] && statusFor(w.id) !== 'learned');
  const shown = inPile
    .filter((w) => !q || w.lemma.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'newest') return ratings[b.id].at - ratings[a.id].at;
      if (sort === 'a-z') return a.lemma.localeCompare(b.lemma, 'de');
      return (
        STATUS_ORDER.indexOf(statusFor(a.id)) - STATUS_ORDER.indexOf(statusFor(b.id)) ||
        a.lemma.localeCompare(b.lemma, 'de')
      );
    });

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
        right={<Text style={styles.count}>{q ? `${shown.length} of ${inPile.length}` : inPile.length} words</Text>}
      />

      <View style={styles.sorts}>
        <Text style={styles.sortLabel}>sort</Text>
        {SORTS.map((o) => (
          <Pressable
            key={o.key}
            onPress={() => setSort(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: sort === o.key }}
            style={[styles.sortChip, sort === o.key && styles.sortChipOn]}
          >
            <Text style={[styles.sortText, sort === o.key && styles.sortTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
        <View style={styles.spacer} />
        <Pressable
          onPress={() => {
            if (searching) setQuery('');
            setSearching((v) => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel={searching ? 'close the search' : 'search words'}
          accessibilityState={{ selected: searching }}
          hitSlop={8}
          style={[styles.searchButton, searching && styles.searchButtonOn]}
        >
          <SearchIcon color={searching ? colors.onAccent : colors.textSecondary} />
        </Pressable>
      </View>

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
        contentContainerStyle={{ paddingBottom: 8, gap: 10 }}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {shown.length === 0 ? (
          <Text style={styles.empty}>{q ? 'no words match' : 'no words yet. rate some in explore'}</Text>
        ) : null}
        {shown.map((w) => {
          const status = statusFor(w.id);
          return (
            <View key={w.id} style={styles.row}>
              <Pressable
                style={styles.open}
                onPress={() => {
                  setOpenId(w.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${w.article ? w.article + ' ' : ''}${w.lemma}, ${w.en}: open the card`}
              >
                <View style={styles.text}>
                  <Text style={styles.lemma}>
                    {w.article ? <Text style={styles.article}>{w.article} </Text> : null}
                    {w.lemma}
                  </Text>
                  <Text style={styles.en} numberOfLines={1}>
                    {w.en}
                  </Text>
                </View>
                <View style={styles.status}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
                  <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove(w.id, w.lemma)}
                accessibilityRole="button"
                accessibilityLabel={`delete ${w.lemma}`}
                hitSlop={6}
                style={styles.trash}
              >
                <TrashIcon color={colors.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.action}>
        {sessions.length === 0 && note ? <Text style={styles.note}>{note}</Text> : null}
        {sessions.length === 0 ? <Button label="quick study" onPress={() => {}} disabled /> : null}
        <View style={styles.buttons}>
          {sessions.map((s, i) => (
            <View key={s.label} style={styles.session}>
              <Button label={s.label} onPress={s.onPress} kind={i === 0 ? 'primary' : 'ghost'} />
              <Text style={styles.caption}>{s.caption}</Text>
            </View>
          ))}
        </View>
      </View>

      {opened ? (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpenId(null)} accessibilityLabel="close the card" accessibilityRole="button" />
          <View style={[styles.cardWrap, { paddingTop: insets.top + 24, paddingBottom: bottomSpace }]} pointerEvents="box-none">
            <WordCard word={opened} tag={STATUS_LABEL[statusFor(opened.id)]} />
            <Button label="close" kind="ghost" onPress={() => setOpenId(null)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // the card of a tapped word, over the list (tap outside it to close)
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,16,26,0.95)' },
  cardWrap: { flex: 1, paddingHorizontal: 24, gap: 12 },
  screen: { flex: 1, paddingHorizontal: 24, gap: 12 },
  count: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
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
  sorts: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spacer: { flex: 1 },
  searchButton: { width: 34, height: 34, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  searchButtonOn: { backgroundColor: colors.accent },
  sortLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginRight: 2 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.chip,
  },
  sortChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  sortText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  sortTextOn: { color: colors.onAccent },
  list: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 12 },
  session: { flex: 1, gap: 6 },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  action: { gap: 10, paddingTop: 4 },
  note: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, gap: 2 },
  lemma: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  article: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  en: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  trash: { width: 36, height: 36, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
});

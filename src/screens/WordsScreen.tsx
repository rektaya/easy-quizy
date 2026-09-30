import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { TrashIcon } from '../components/Icons';
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

// Every word you have met (gathered for study, or marked known), with where it stands: searchable, sortable, and each one can be deleted.
// Deleting takes two taps on the bin (the second confirms) and the word is never offered again.
export default function WordsScreen({ bottomSpace, onBack }: { bottomSpace: number; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { ratings, unrate } = useRatings();
  const { cards, removeWord } = useProfile();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // the word whose card is showing
  const opened = openId ? WORDS.find((w) => w.id === openId) : undefined;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('status');

  const q = query.trim().toLowerCase();
  const inPile = WORDS.filter((w) => ratings[w.id]);
  // a word marked known in Explore has no card; it counts as learned
  const statusFor = (id: string): Status => (!cards[id] && ratings[id]?.known ? 'learned' : statusOf(cards[id]));
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

  const remove = (id: string) => {
    if (confirming !== id) {
      setConfirming(id);
      return;
    }
    unrate(id);
    removeWord(id);
    setConfirming(null);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.back}>‹ map</Text>
        </Pressable>
        <Text style={styles.count}>
          {q ? `${shown.length} of ${inPile.length}` : inPile.length} words
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="search words"
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={styles.search}
        accessibilityLabel="search words"
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
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomSpace, gap: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {shown.length === 0 ? (
          <Text style={styles.empty}>{q ? 'no words match.' : 'no words yet. rate some in explore.'}</Text>
        ) : null}
        {shown.map((w) => {
          const status = statusFor(w.id);
          const sure = confirming === w.id;
          return (
            <View key={w.id} style={styles.row}>
              <Pressable
                style={styles.open}
                onPress={() => {
                  setConfirming(null);
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
                onPress={() => remove(w.id)}
                accessibilityRole="button"
                accessibilityLabel={sure ? `confirm: delete ${w.lemma}` : `delete ${w.lemma}`}
                hitSlop={6}
                style={[styles.trash, sure && styles.trashSure]}
              >
                <TrashIcon color={sure ? colors.onAccent : colors.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  back: { fontFamily: fonts.medium, fontSize: 16, color: colors.accent },
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
  trashSure: { backgroundColor: colors.accent },
});

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrashIcon } from '../components/Icons';
import { WORDS } from '../data/words';
import { STATUS_LABEL, STATUS_ORDER, statusOf } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';
import { STATUS_COLOR } from './StudyHomeScreen';

type Sort = 'status' | 'a-z' | 'newest';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'status', label: 'status' },
  { key: 'a-z', label: 'a–z' },
  { key: 'newest', label: 'newest' },
];

// Every gathered word, with where it stands: searchable, sortable, and each one can be deleted.
// Deleting takes two taps on the bin (the second confirms) and the word is never offered again.
export default function WordsScreen({ bottomSpace, onBack }: { bottomSpace: number; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { ratings, unrate } = useRatings();
  const { studied, removeWord } = useProfile();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('status');

  const q = query.trim().toLowerCase();
  const inPile = WORDS.filter((w) => ratings[w.id] && !ratings[w.id].known);
  const shown = inPile
    .filter((w) => !q || w.lemma.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'newest') return ratings[b.id].at - ratings[a.id].at;
      if (sort === 'a-z') return a.lemma.localeCompare(b.lemma, 'de');
      return (
        STATUS_ORDER.indexOf(statusOf(studied[a.id])) - STATUS_ORDER.indexOf(statusOf(studied[b.id])) ||
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
          <Text style={styles.back}>‹ study</Text>
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
          <Text style={styles.empty}>{q ? 'no words match.' : 'no words in your pile.'}</Text>
        ) : null}
        {shown.map((w) => {
          const status = statusOf(studied[w.id]);
          const sure = confirming === w.id;
          return (
            <View key={w.id} style={styles.row}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, gap: 12 },
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
    backgroundColor: 'rgba(255,255,255,0.55)',
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

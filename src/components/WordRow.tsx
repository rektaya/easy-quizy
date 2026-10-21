import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Word } from '../data/words';
import type { WordStatus } from '../onboarding/status';
import { colors, fonts, radius } from '../theme';
import { StatusRing } from './StatusRing';
import { TrashIcon } from './Icons';

// One word in a list: the word and its meaning, and its status as a small circle on the right. Tapping it
// opens the word's card. A list that lets words be deleted gets a bin at the end.
export function WordRow({
  word,
  status,
  onOpen,
  onDelete,
}: {
  word: Word;
  status: WordStatus;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.open}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${word.article ? word.article + ' ' : ''}${word.lemma}, ${word.en}: open the card`}
      >
        <View style={styles.text}>
          <Text style={styles.lemma}>
            {word.article ? <Text style={styles.article}>{word.article} </Text> : null}
            {word.lemma}
          </Text>
          <Text style={styles.en} numberOfLines={1}>
            {word.en}
          </Text>
        </View>
        <StatusRing status={status} size={22} />
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={`delete ${word.lemma}`} hitSlop={6} style={styles.trash}>
          <TrashIcon color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 2 },
  lemma: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  article: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  en: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  trash: { width: 36, height: 36, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
});

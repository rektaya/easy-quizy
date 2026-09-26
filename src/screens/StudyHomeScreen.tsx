import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RING_AMBER, RING_GREEN, RING_RED } from '../circle/color';
import { Button } from '../components/Button';
import { Ring } from '../components/Ring';
import { WORDS } from '../data/words';
import { EXPLORE_LOCK_AT } from '../onboarding/batch';
import { STATUS_LABEL, STATUS_ORDER, summarize } from '../onboarding/status';
import type { Status } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius, shadow } from '../theme';

const DONUT = 210;

export const STATUS_COLOR: Record<Status, string> = {
  new: '#AEB8C3',
  shaky: RING_RED,
  getting: RING_AMBER,
  solid: '#9ACD5A',
  learned: RING_GREEN,
};

type Props = {
  bottomSpace: number;
  onStudy: () => void;
  onAllWords: () => void;
  onRestartOnboarding: () => void;
};

// The Study tab's home: a small dashboard of the pile, with the one button that matters.
export default function StudyHomeScreen({ bottomSpace, onStudy, onAllWords, onRestartOnboarding }: Props) {
  const insets = useSafeAreaInsets();
  const { ratings } = useRatings();
  const { studied } = useProfile();
  const { gathered, counts, knownBefore } = summarize(WORDS, ratings, studied);
  const waiting = counts.new;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }]}>
      <View style={styles.header}>
        <Text style={styles.title}>study</Text>
        <Pressable onPress={onRestartOnboarding} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.restart}>restart onboarding</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.donut}>
          <Ring
            size={DONUT}
            stroke={18}
            segments={STATUS_ORDER.map((st) => ({ value: counts[st], color: STATUS_COLOR[st] }))}
          />
          <View style={styles.donutCenter} pointerEvents="none">
            <Text style={styles.big}>{gathered}</Text>
            <Text style={styles.bigLabel}>{gathered === 1 ? 'word gathered' : 'words gathered'}</Text>
          </View>
        </View>
        {gathered === 0 ? <Text style={styles.empty}>nothing here yet. gather words in explore.</Text> : null}

        <View style={styles.rows}>
          {STATUS_ORDER.map((s) => (
            <View key={s} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[s] }]} />
              <Text style={styles.rowLabel}>{STATUS_LABEL[s]}</Text>
              <Text style={styles.rowCount}>{counts[s]}</Text>
            </View>
          ))}
        </View>
        {knownBefore > 0 ? <Text style={styles.foot}>{knownBefore} more you already knew</Text> : null}
      </View>

      {waiting >= EXPLORE_LOCK_AT ? (
        <Text style={styles.lockNote}>explore is paused until you learn some of the new words.</Text>
      ) : null}

      <View style={styles.spacer} />
      <View style={styles.buttons}>
        <Button label="study" onPress={onStudy} disabled={waiting === 0} />
        <Button label="all words" onPress={onAllWords} kind="ghost" disabled={gathered === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  restart: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  card: {
    padding: 22,
    gap: 6,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  donut: { alignSelf: 'center', width: DONUT, height: DONUT, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  big: { fontFamily: fonts.medium, fontSize: 48, lineHeight: 54, color: colors.text },
  bigLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  rows: { marginTop: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  rowCount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  foot: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 14 },
  lockNote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary, textAlign: 'center' },
  spacer: { flex: 1 },
  buttons: { gap: 12 },
});

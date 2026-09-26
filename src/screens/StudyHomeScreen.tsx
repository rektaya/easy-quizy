import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RING_AMBER, RING_GREEN, RING_RED } from '../circle/color';
import { Button } from '../components/Button';
import { Ring } from '../components/Ring';
import { TabHeader } from '../components/TabHeader';
import { WORDS } from '../data/words';
import { EXPLORE_LOCK_AT, dueWords, nextDue } from '../onboarding/batch';
import { whenLabel } from '../srs/scheduler';
import { STATUS_ORDER, summarize } from '../onboarding/status';
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
  const { cards } = useProfile();
  const { gathered, counts } = summarize(WORDS, ratings, cards);
  const now = Date.now();
  const waiting = counts.new;
  const due = dueWords(WORDS, ratings, cards, now).length;
  const upcoming = nextDue(WORDS, ratings, cards);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }]}>
      <TabHeader
        title="study"
        right={
          <Pressable onPress={onRestartOnboarding} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.restart}>restart onboarding</Text>
          </Pressable>
        }
      />

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
      </View>

      <Text style={styles.plan}>
        {due > 0 || waiting > 0
          ? [due > 0 ? `${due} to review` : null, waiting > 0 ? `${waiting} new` : null].filter(Boolean).join(' · ')
          : upcoming !== null
            ? `all caught up. next review ${whenLabel(upcoming, now)}.`
            : ''}
      </Text>

      {waiting >= EXPLORE_LOCK_AT ? (
        <Text style={styles.lockNote}>explore is paused until you learn some of the new words.</Text>
      ) : null}

      <View style={styles.spacer} />
      <View style={styles.buttons}>
        <Button label="study" onPress={onStudy} disabled={waiting === 0 && due === 0} />
        <Button label="all words" onPress={onAllWords} kind="ghost" disabled={gathered === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, gap: 16 },
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
  plan: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, textAlign: 'center' },
  lockNote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary, textAlign: 'center' },
  spacer: { flex: 1 },
  buttons: { gap: 12 },
});

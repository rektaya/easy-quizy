import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { ChevronLeftIcon } from '../components/Icons';
import { Button } from '../components/Button';
import { ReminderCard } from '../components/ReminderCard';
import { SettingToggle } from '../components/SettingToggle';
import { WORDS } from '../data/words';
import { summarize } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useProfileSheet } from '../state/profileSheet';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';

// Profile and settings: who you are, how far you have got, and the daily reminder. Opens over everything
// from the avatar in Explore.
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { hide } = useProfileSheet();
  const { ratings, reset } = useRatings();
  const { name, rename, cards, quickSessions, setQuickSessions, restartOnboarding } = useProfile();
  const [draft, setDraft] = useState(name);

  const summary = summarize(WORDS, ratings, cards);
  const explored = Object.keys(ratings).length;
  const learned = summary.counts.learned + summary.knownBefore;
  const inStudy = summary.gathered - summary.counts.learned;

  const startOver = () =>
    Alert.alert('start over?', 'everything on this phone is erased and the app begins from the very start.', [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'start over',
        style: 'destructive',
        onPress: () => {
          hide();
          reset();
          restartOnboarding();
        },
      },
    ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={hide} accessibilityRole="button" accessibilityLabel="close" hitSlop={12} style={styles.back}>
          <ChevronLeftIcon color={colors.accent} size={28} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.me}>
          <Avatar name={name} size={76} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onEndEditing={() => {
              rename(draft);
              setDraft((d) => d.trim() || name);
            }}
            maxLength={30}
            autoCorrect={false}
            returnKeyType="done"
            style={styles.name}
            accessibilityLabel="your name"
          />
        </View>

        <View style={styles.stats}>
          <Stat n={explored} label="explored" />
          <Stat n={inStudy} label="in study" />
          <Stat n={learned} label="learned" />
        </View>

        <Text style={styles.section}>study</Text>
        <SettingToggle
          title="quick sessions"
          subtitle="add a quick study button (10 words) next to study"
          value={quickSessions}
          onChange={setQuickSessions}
        />

        <Text style={styles.section}>reminder</Text>
        <ReminderCard />

        <Text style={styles.section}>testing</Text>
        <Button label="start over" kind="ghost" onPress={startOver} />
      </ScrollView>
    </View>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 24, minHeight: 32 },
  back: { height: 32, justifyContent: 'center', marginLeft: -6 },
  // the same title as Explore, Study and Map
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  content: { paddingHorizontal: 24, paddingTop: 24, gap: 14 },
  me: { alignItems: 'center', gap: 14, marginBottom: 6 },
  name: { fontFamily: fonts.medium, fontSize: 26, color: colors.text, textAlign: 'center', minWidth: 160, paddingVertical: 4 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  statN: { fontFamily: fonts.medium, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 14, marginLeft: 4 },
});

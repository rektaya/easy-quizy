import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { ChevronRightIcon } from '../components/Icons';
import { Button } from '../components/Button';
import { useTabBarSpace, useTabRepress } from '../components/FloatingTabBar';
import { TabHeader } from '../components/TabHeader';
import { ReminderCard } from '../components/ReminderCard';
import { SessionSizeSetting } from '../components/SessionSizeSetting';
import { WeekCard } from '../components/WeekCard';
import { WORDS } from '../data/words';
import { summarize } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import CreditsScreen from './CreditsScreen';
import { colors, fonts, radius } from '../theme';

// Profile and settings: who you are, how far you have got, and the daily reminder. Opens over everything
// from the avatar in Explore.
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace(); // the content scrolls clear of the floating tab bar
  const { ratings, reset } = useRatings();
  const { name, rename, cards, restartOnboarding } = useProfile();
  const [draft, setDraft] = useState(name);
  const [credits, setCredits] = useState(false); // the credits page, opened from here
  // pressing the Profile tab while on it brings you back from the credits
  useTabRepress(() => setCredits(false));

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
          reset();
          restartOnboarding();
        },
      },
    ]);

  if (credits) {
    return (
      <Animated.View key="credits" entering={FadeIn.duration(240)} style={styles.fill}>
        <CreditsScreen onBack={() => setCredits(false)} />
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(240)} style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.pad}>
        <TabHeader title="profile" />
      </View>

      {/* The list is as wide as the screen and its side margin is inside it, so the glow of the week's stars, which reaches past
          the card, fades out in the margin instead of being cut off at the edge of the list. */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabSpace + 16 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        <WeekCard />

        <View style={styles.stats}>
          <Stat n={explored} label="explored" />
          <Stat n={inStudy} label="in study" />
          <Stat n={learned} label="learned" />
        </View>

        <Text style={styles.section}>study</Text>
        <SessionSizeSetting />

        <ReminderCard />

        <Text style={styles.section}>about</Text>
        <Pressable onPress={() => setCredits(true)} accessibilityRole="button" style={styles.rowCard}>
          <View style={styles.rowCardText}>
            <Text style={styles.rowCardTitle}>credits</Text>
            <Text style={styles.rowCardSub}>where the words, sentences and type come from</Text>
          </View>
          <ChevronRightIcon color={colors.text} size={22} />
        </Pressable>

        <Text style={styles.section}>testing</Text>
        <Button label="start over" kind="ghost" onPress={startOver} />
      </ScrollView>
    </Animated.View>
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
  fill: { flex: 1 },
  pad: { paddingHorizontal: 24 },
  content: { paddingTop: 16, paddingHorizontal: 24, gap: 14 },
  me: { alignItems: 'center', gap: 14, marginBottom: 6 },
  name: { fontFamily: fonts.medium, fontSize: 26, color: colors.text, textAlign: 'center', minWidth: 160, paddingVertical: 4 },
  stats: { flexDirection: 'row', gap: 10 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowCardText: { flex: 1, gap: 2 },
  rowCardTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  rowCardSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
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

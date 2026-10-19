import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { activityByDay, currentStreak, dayKey, weekOf } from '../onboarding/streak';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';
import { Ring } from './Ring';

// The days in a row and the week, in Profile: a circle for each day of the week (filled when the user worked with their
// words that day, outlined for today), how many days in a row, and how many words today against the goal, which is the
// number of words in a session (the setting under it).
export function StreakCard() {
  const { ratings } = useRatings();
  const { cards, reviewLog, sessionWords } = useProfile();
  const now = Date.now();
  const byDay = activityByDay(ratings, reviewLog, cards);
  const streak = currentStreak(byDay, now);
  const week = weekOf(byDay, now);
  const today = byDay[dayKey(now)] ?? 0;
  const goal = sessionWords;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.text}>
          <Text style={styles.title}>{streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'} in a row` : 'start your streak today'}</Text>
          <Text style={styles.sub}>
            today {Math.min(today, 999)} / {goal} words
          </Text>
        </View>
        <Ring size={34} stroke={4} segments={[{ value: Math.min(today, goal), color: colors.accent }]} total={goal} />
      </View>
      <View style={styles.week} accessible accessibilityLabel={`this week: ${week.filter((d) => d.done).length} days of 7`}>
        {week.map((d) => (
          <View key={d.key} style={styles.day}>
            <View style={[styles.dot, d.done && styles.dotDone, d.today && styles.dotToday, d.future && styles.dotFuture]} />
            <Text style={[styles.letter, d.today && styles.letterToday]}>{d.letter}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', gap: 16, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'transparent' },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotToday: { borderColor: colors.text, borderWidth: 2 },
  dotFuture: { opacity: 0.45 },
  letter: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  letterToday: { fontFamily: fonts.medium, color: colors.text },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { THEMES } from '../data/words';
import { useProfile } from '../state/profile';
import { colors, fonts, radius } from '../theme';

// A step of the first run: the topics the user likes, so that the words that come to them can be aligned
// with their interests. (What the choice changes is still to be thought through: today Explore prefers
// words from these topics.) Any number of topics, or none.
export default function InterestsStep({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { name, interests, setInterests } = useProfile();
  const toggle = (id: string) => setInterests(interests.includes(id) ? interests.filter((x) => x !== id) : [...interests, id]);
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(450)} style={styles.head}>
        <Text style={styles.title}>{name ? `welcome, ${name}` : 'welcome'}</Text>
        <Text style={styles.lead}>you will meet many new words. let’s align them with your interests</Text>
      </Animated.View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
        {THEMES.map((t) => {
          const on = interests.includes(t.id);
          return (
            <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.en}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Button label="continue" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, gap: 20 },
  head: { gap: 10 },
  title: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 44, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
  scroll: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.chip, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.onAccent },
});

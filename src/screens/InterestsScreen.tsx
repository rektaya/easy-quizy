import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { ChevronLeftIcon } from '../components/Icons';
import { THEMES } from '../data/words';
import { useProfile } from '../state/profile';
import { colors, fonts, radius } from '../theme';

// The themes the user likes: Explore brings words from them more often (when there are words at the right
// level). Reached from the profile; the chevron goes back to it.
export default function InterestsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace(); // scroll clear of the floating tab bar
  const { interests, setInterests } = useProfile();
  const toggle = (id: string) => setInterests(interests.includes(id) ? interests.filter((x) => x !== id) : [...interests, id]);
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="back" hitSlop={12} style={styles.back}>
          <ChevronLeftIcon color={colors.accent} size={28} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          interests
        </Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabSpace + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          choose the topics you like, and explore will bring you words from them more often.
        </Text>
        <View style={styles.chips}>
          {THEMES.map((t) => {
            const on = interests.includes(t.id);
            return (
              <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.en}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 24, minHeight: 32 },
  back: { height: 32, justifyContent: 'center', marginLeft: -6 },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 18 },
  intro: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.chip, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.onAccent },
});

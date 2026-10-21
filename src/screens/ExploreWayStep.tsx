import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { BY } from '../components/ExploreControls';
import { useProfile } from '../state/profile';
import { colors, fonts, radius } from '../theme';

// A step of the first run, after the name: how the user would like to explore new words. The choices are the ways of
// exploring of Explore (its first select), with the same lines; the one chosen here is where Explore starts, and it
// can be changed there at any time. "association" is chosen already.
export default function ExploreWayStep({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { explore, setExplore } = useProfile();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(450)} style={styles.body}>
        <Text style={styles.title}>how would you want to explore new words?</Text>
        <Text style={styles.lead}>you can change it any time</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {BY.map((o) => {
            const on = explore.by === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => setExplore({ by: o.key })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[styles.option, on && styles.optionOn]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{o.label}</Text>
                  <Text style={styles.optionHint}>{o.hint}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
      <Button label="continue" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 40, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 26, color: colors.textSecondary },
  options: { gap: 12, marginTop: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionOn: { borderColor: colors.accent },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  optionHint: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
});

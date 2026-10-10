import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme';

const STEPS: { label: string; text: string }[] = [
  { label: 'explore', text: 'meet new words' },
  { label: 'study', text: 'learn the ones you gathered' },
  { label: 'map', text: 'watch your vocabulary grow on a map' },
];

// One screen after the name: what the app is. Nothing to learn here, it only says where the user is.
export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { name } = useProfile();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(450)} style={styles.body}>
        <Text style={styles.title}>{name ? `welcome, ${name}` : 'welcome'}</Text>
        <Text style={styles.lead}>
          easy quizy helps you learn german words and remember them for good. it goes in three steps, again and again:
        </Text>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.step}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
      <Button label="let’s go" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 18 },
  title: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 44, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
  steps: { gap: 18, marginTop: 6 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNumber: { fontFamily: fonts.medium, fontSize: 22, lineHeight: 26, color: colors.accent, width: 20 },
  stepBody: { flex: 1, gap: 2 },
  stepLabel: { fontFamily: fonts.medium, fontSize: 18, color: colors.text },
  stepText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});

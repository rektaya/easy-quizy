import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme';

// Appears the moment the calibration words are in. No score and no level name: it just says the
// app has adjusted, and hands the user straight on to learning the words they gathered.
export default function CalibrationDoneScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const { name } = useProfile();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.body}>
        <Text style={styles.title}>{name ? `got it, ${name}.` : 'got it.'}</Text>
        <Text style={styles.lead}>we adjusted the words you’ll explore so they match your level.</Text>
      </Animated.View>
      <Button label="start learning" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontFamily: fonts.medium, fontSize: 30, color: colors.text },
  lead: { fontFamily: fonts.medium, fontSize: 19, lineHeight: 27, color: colors.text },
});

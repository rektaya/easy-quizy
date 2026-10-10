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
        <Text style={styles.lead}>now let’s study the words you gathered.</Text>
      </Animated.View>
      <Button label="study" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 44, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { colors, fonts } from '../theme';

// Between the practice word and the 15 test words: says what the test is for.
export default function QuizIntroScreen({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(450)} style={styles.body}>
        <Text style={styles.title}>let us calibrate to your level</Text>
        <Text style={styles.lead}>you will see 15 words, show us how well you know them</Text>
      </Animated.View>
      <Button label="start the test" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 44, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 26, color: colors.textSecondary },
});

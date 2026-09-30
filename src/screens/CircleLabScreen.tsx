import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DustRing } from '../circle/lab/DustRing';
import { LAB_PAD, useRing } from '../circle/lab/useRing';
import { gradeOf } from '../circle/geometry';
import { Button } from '../components/Button';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { WordFace } from '../components/WordFace';
import { WORDS } from '../data/words';
import { colors, fonts } from '../theme';

// A sandbox for the Circle's fill animation (not part of the app's flow): the stardust look the author
// chose, to try on the phone. Open it by holding the word "map" in the Map tab's header.

const GRADE_LABEL = { again: 'again', hard: 'hard', good: 'good', easy: 'easy: known' } as const;

export default function CircleLabScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const space = useTabBarSpace(); // the button stays clear of the floating tab bar
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 300);
  const [result, setResult] = useState<{ value: number } | null>(null);
  const ring = useRing(size, (value) => setResult({ value }));
  const word = WORDS[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: space }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.back}>‹ map</Text>
        </Pressable>
        <Text style={styles.title}>circle lab</Text>
      </View>

      <View style={styles.stage}>
        <GestureDetector gesture={ring.gesture}>
          <View style={{ width: size, height: size }} collapsable={false}>
            <View pointerEvents="none" style={{ position: 'absolute', left: -LAB_PAD, top: -LAB_PAD }}>
              <DustRing ring={ring} />
            </View>
            <View pointerEvents="none" style={styles.center}>
              <WordFace word={word} />
            </View>
          </View>
        </GestureDetector>
        <Text style={styles.result}>
          {result ? `${Math.round(result.value * 100)}%  ·  ${GRADE_LABEL[gradeOf(result.value)]}` : 'draw a circle'}
        </Text>
      </View>

      <Button
        label="again"
        kind={result ? 'primary' : 'ghost'}
        onPress={() => {
          ring.reset();
          setResult(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  back: { fontFamily: fonts.medium, fontSize: 16, color: colors.accent },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  result: { fontFamily: fonts.medium, fontSize: 16, color: colors.textSecondary, minHeight: 22 },
});

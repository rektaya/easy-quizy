import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { FallingStar } from '../components/FallingStar';
import { colors, fonts } from '../theme';

// The very first screen: the name of the app, a line on what it is for, and a way in.
export default function WelcomeScreen({ onBegin }: { onBegin: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.body}>
        <View style={styles.star}>
          <FallingStar width={Math.min(width - 24, 340)} />
        </View>
        <Text style={styles.title}>easy quizy words</Text>
        <Text style={styles.lead}>
          learning words can be the most boring part of learning a language. but with easy quizy it turns into an
          explorative journey, which you will want to come back to.
        </Text>
      </Animated.View>
      <Button label="let’s begin" onPress={onBegin} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 18 },
  star: { alignItems: 'center', marginBottom: 10 },
  title: { fontFamily: fonts.medium, fontSize: 40, lineHeight: 48, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
});

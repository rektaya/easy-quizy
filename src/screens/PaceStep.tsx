import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { SessionSizePicker } from '../components/SessionSizePicker';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme';

// A step of the first run, after the way of exploring: how many words a study session holds. Twenty is chosen already;
// it can be changed later in the profile.
export default function PaceStep({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { sessionWords, setSessionWords } = useProfile();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeIn.duration(450)} style={styles.body}>
        <Text style={styles.title}>how many words per session?</Text>
        <Text style={styles.lead}>you can change this later in your profile</Text>
        <View style={styles.picker}>
          <SessionSizePicker value={sessionWords} onChange={setSessionWords} />
        </View>
      </Animated.View>
      <Button label="continue" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 44, color: colors.text },
  lead: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, color: colors.textSecondary },
  picker: { marginTop: 18 },
});

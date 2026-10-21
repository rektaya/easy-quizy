import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SESSION_MINUTES, SESSION_WORDS } from '../onboarding/batch';
import type { SessionWords } from '../onboarding/batch';
import { colors, fonts, radius } from '../theme';

// The size of a Study session: three tiles side by side, each with the number of words and about how long they
// take. The chosen one is filled orange. Used where the size is first chosen (the first-run path) and in the panel
// of the Profile setting.
export function SessionSizePicker({ value, onChange }: { value: SessionWords; onChange: (words: SessionWords) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {SESSION_WORDS.map((n) => {
        const on = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${n} words, ${SESSION_MINUTES[n]}`}
            style={[styles.tile, on && styles.tileOn]}
          >
            <Text style={[styles.number, on && styles.onAccent]}>{n}</Text>
            <Text style={[styles.words, on && styles.onAccent]}>words</Text>
            <Text style={[styles.minutes, on && styles.onAccent]}>{SESSION_MINUTES[n]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  number: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 34, color: colors.text },
  words: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  minutes: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  onAccent: { color: colors.onAccent },
});

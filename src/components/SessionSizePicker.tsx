import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SESSION_MINUTES, SESSION_WORDS } from '../onboarding/batch';
import type { SessionWords } from '../onboarding/batch';
import { fonts } from '../theme';
import { Choice, ChoiceText } from './Choice';

// The size of a Study session: three tiles side by side, each with the number of words and about how long they
// take. The chosen one is filled orange. Used where the size is first chosen (the first-run path) and in the panel
// of the Profile setting.
export function SessionSizePicker({ value, onChange }: { value: SessionWords; onChange: (words: SessionWords) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {SESSION_WORDS.map((n) => {
        const on = n === value;
        return (
          <Choice
            key={n}
            round="tile"
            selected={on}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityLabel={`${n} words, ${SESSION_MINUTES[n]}`}
            style={styles.tile}
          >
            <ChoiceText style={styles.number}>{n}</ChoiceText>
            <ChoiceText style={styles.words}>words</ChoiceText>
            <ChoiceText quiet style={styles.minutes}>
              {SESSION_MINUTES[n]}
            </ChoiceText>
          </Choice>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6 },
  number: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 34 },
  words: { fontFamily: fonts.regular, fontSize: 15 },
  minutes: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, textAlign: 'center', marginTop: 6 },
});

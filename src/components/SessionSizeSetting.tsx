import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SESSION_MINUTES } from '../onboarding/batch';
import type { SessionWords } from '../onboarding/batch';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Card } from './Card';
import { Pill } from './Choice';
import { ChevronDownIcon } from './Icons';
import { SessionSizePicker } from './SessionSizePicker';

// The setting "words per session" in Profile: a card with a select on the right ("20 words"). Tapping it opens a
// panel from the bottom with the three sizes (each with about how long it takes) and a "save" button; nothing is
// changed until "save" is pressed, and closing the panel any other way leaves the setting as it was.
export function SessionSizeSetting() {
  const { sessionWords, setSessionWords } = useProfile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SessionWords>(sessionWords);

  const show = () => {
    setDraft(sessionWords); // it always opens on what is saved
    setOpen(true);
  };
  const save = () => {
    setSessionWords(draft);
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={`words per session: ${sessionWords}, change`}>
        <Card style={styles.card}>
          <View style={styles.text}>
            <Text style={styles.title}>words per session</Text>
            <Text style={styles.sub}>{SESSION_MINUTES[sessionWords]}</Text>
          </View>
          <Pill label={`${sessionWords} words`} size="m" right={<ChevronDownIcon color={colors.textSecondary} size={16} />} />
        </Card>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.head}>
          <Text style={styles.sheetTitle}>words per session</Text>
          <Text style={styles.sheetLead}>new words and reviews together, up to this many in one session</Text>
        </View>
        <SessionSizePicker value={draft} onChange={setDraft} />
        <Button label="save" onPress={save} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  head: { gap: 6 },
  sheetTitle: { fontFamily: fonts.medium, fontSize: 24, color: colors.text },
  sheetLead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
});

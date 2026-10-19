import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { verbForms } from '../data/words';
import type { Word } from '../data/words';
import { colors, fonts } from '../theme';

// The forms of a verb on one line, "geht · ging · ist gegangen" (he/she/it present, past, perfect); nothing for a word that is not a verb.
export function VerbForms({ word, size = 15, align = 'center' }: { word: Word; size?: number; align?: 'center' | 'left' }) {
  const forms = verbForms(word);
  if (!forms) return null;
  return <Text style={[styles.text, { fontSize: size, lineHeight: Math.round(size * 1.4), textAlign: align }]}>{forms}</Text>;
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.medium, color: colors.textSecondary },
});

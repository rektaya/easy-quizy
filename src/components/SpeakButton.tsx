import React, { useEffect } from 'react';
import { speak, stopSpeaking } from '../audio/speak';
import type { Word } from '../data/words';
import { colors } from '../theme';
import { CircleAction } from './CircleAction';
import { SpeakerIcon } from './Icons';

/**
 * Where the loudspeaker goes: in the circle, above the word, always in the same place: before and after the word is rated,
 * for every word: just clear of the article above a noun (the highest the word block reaches), and of a translation of up to
 * two lines, which takes the word's place once the word is rated.
 */
export function speakTop(circleTop: number, size: number): number {
  return circleTop + size / 2 - 36 - 12 - 40;
}

// A small loudspeaker in the circle, above the word, in the same quiet style as the cross under it: it says the German
// word aloud (with the voice of the phone). It stops when the word changes.
export function SpeakButton({ word, top, visible = true }: { word: Word; top: number; visible?: boolean }) {
  useEffect(() => stopSpeaking, [word.id]);
  return (
    <CircleAction top={top} visible={visible} onPress={() => speak(word)} accessibilityLabel={`hear ${word.lemma}`}>
      <SpeakerIcon color={colors.textSecondary} size={20} />
    </CircleAction>
  );
}

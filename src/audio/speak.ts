import * as Speech from 'expo-speech';
import type { Word } from '../data/words';

/** What is said for a word: a noun with its article ("der Feierabend", so the gender is heard too), any other word as it is. */
export function spokenText(word: Word): string {
  return word.article ? `${word.article} ${word.lemma}` : word.lemma;
}

/**
 * Says the word aloud in German, with the voice of the phone (no recordings, nothing to download). A new word
 * interrupts the one still being said. On a real iPhone nothing is heard while the silent switch is on.
 */
export function speak(word: Word) {
  Speech.stop().catch(() => {});
  Speech.speak(spokenText(word), { language: 'de-DE', rate: 0.9 });
}

/** Stops whatever is being said (when the word on screen changes or the screen closes). */
export function stopSpeaking() {
  Speech.stop().catch(() => {});
}

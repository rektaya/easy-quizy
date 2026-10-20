import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import type { Word } from '../data/words';
import { Translation } from './Translation';
import { WordFace } from './WordFace';

// What sits inside the circle after a word is rated: the translation, where the German word was.
// Tapping anywhere inside the circle flips to the original word and back (the tap area is round like
// the circle, so the empty corners of its square do nothing). It starts on the translation every time
// it appears, so a new word always starts there.
export function FlipReveal({ word, onShowing }: { word: Word; onShowing?: (german: boolean) => void }) {
  const ref = useRef<View>(null);
  const [original, setOriginal] = useState(false);
  // tells the screen which side is showing (the loudspeaker is only there while the German word is)
  useEffect(() => {
    onShowing?.(original);
  }, [original, onShowing]);

  const flip = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    if (typeof pageX !== 'number' || typeof pageY !== 'number') {
      setOriginal((v) => !v); // an assistive-technology activation has no touch point
      return;
    }
    ref.current?.measureInWindow((x, y, w, h) => {
      if (Math.hypot(pageX - (x + w / 2), pageY - (y + h / 2)) <= w / 2) setOriginal((v) => !v);
    });
  };

  return (
    <Pressable
      ref={ref}
      onPress={flip}
      accessibilityRole="button"
      accessibilityLabel={original ? 'show the translation' : 'show the original word'}
      style={styles.target}
    >
      <View style={styles.face}>{original ? <WordFace word={word} fade /> : <Translation text={word.en} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  face: { paddingVertical: 14, alignItems: 'center' },
});

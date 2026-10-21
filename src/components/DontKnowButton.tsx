import React from 'react';
import { DONT_KNOW } from '../circle/geometry';
import { colors } from '../theme';
import { CircleAction } from './CircleAction';
import { XIcon } from './Icons';

export { DONT_KNOW };

/** Where the cross goes: in the circle, right under the word (the article, when there is one, adds a line). */
export function dontKnowTop(circleTop: number, size: number, hasArticle: boolean): number {
  return circleTop + size / 2 + (hasArticle ? 36 : 22) + 12;
}

// A small cross in the circle, right under the word: for a word you do not know at all, so there is no need to draw
// a circle for it (the ring then draws itself, in dark blue). It is there only while the word is still to be rated.
export function DontKnowButton({ top, onPress, visible = true }: { top: number; onPress: () => void; visible?: boolean }) {
  return (
    <CircleAction top={top} visible={visible} onPress={onPress} accessibilityLabel="i don’t know this word at all">
      <XIcon color={colors.textSecondary} size={20} />
    </CircleAction>
  );
}

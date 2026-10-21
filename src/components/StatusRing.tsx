import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { WordStatus } from '../onboarding/status';
import { colors, stars } from '../theme';

// A word's status as a small circle, the app's own metaphor: the more of the ring is drawn, and the warmer
// and brighter it is, the better the word is known. A word never explored is a faint dotted ring, a word
// gathered but not studied yet is an empty ring, and a learned word is a full golden one.
const FILL: Record<WordStatus, number> = { unseen: 0, new: 0, shaky: 0.3, getting: 0.6, solid: 0.9, learned: 1 };
const COLOR: Record<WordStatus, string> = {
  unseen: colors.textTertiary,
  new: colors.textTertiary,
  shaky: stars.blue,
  getting: stars.ice,
  solid: stars.cream,
  learned: stars.gold,
};

export function StatusRing({ status, size = 22 }: { status: WordStatus; size?: number }) {
  const stroke = Math.max(2.4, size / 8);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = FILL[status];
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={`status: ${status}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={status === 'new' ? COLOR.new : status === 'unseen' ? COLOR.unseen : colors.track}
          strokeWidth={stroke}
          strokeDasharray={status === 'unseen' ? `1.5 ${(stroke * 1.6).toFixed(1)}` : undefined}
          strokeLinecap="round"
          opacity={status === 'unseen' ? 0.9 : status === 'new' ? 0.9 : 0.6}
        />
        {fill > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLOR[status]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * fill} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
    </View>
  );
}

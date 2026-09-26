import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

export type RingSegment = { value: number; color: string };

type Props = {
  size: number;
  stroke: number;
  segments: RingSegment[];
  /** What the whole ring stands for. Defaults to the sum of the segments (a full donut). */
  total?: number;
  track?: string;
  children?: React.ReactNode;
};

// A ring drawn from coloured segments, clockwise from the top. With one segment it is a progress
// ring; with several it is a donut. Small gaps separate the segments.
export function Ring({ size, stroke, segments, total, track = colors.track, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = total ?? segments.reduce((n, s) => n + s.value, 0);
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  let start = 0;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" opacity={0.6} />
      {sum > 0
        ? segments.map((s, i) => {
            if (s.value <= 0) return null;
            const len = Math.max(0, (s.value / sum) * c - gap);
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${c - len}`}
                // the stroke starts at 3 o'clock; a quarter turn back puts the start at the top
                strokeDashoffset={-(start + c * 0.75)}
              />
            );
            start += (s.value / sum) * c;
            return el;
          })
        : null}
      {children}
    </Svg>
  );
}

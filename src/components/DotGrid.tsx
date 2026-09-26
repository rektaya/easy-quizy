import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

type Props = { width: number; height: number; filled: number; cols?: number; rows?: number };

// A hand-placed-looking grid of dots. The first `filled` dots are inked in the accent color.
export function DotGrid({ width, height, filled, cols = 13, rows = 17 }: Props) {
  const dots = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Deterministic jitter, so the grid feels drawn by hand but never shifts between renders.
    const jx = Math.sin(i * 12.9898) * 2.2;
    const jy = Math.cos(i * 78.233) * 2.2;
    const on = i < filled;
    dots.push(
      <Circle
        key={i}
        cx={(col + 0.5) * (width / cols) + jx}
        cy={(row + 0.5) * (height / rows) + jy}
        r={on ? 3 : 1.7}
        fill={on ? colors.accent : colors.textTertiary}
      />,
    );
  }
  return (
    <Svg width={width} height={height}>
      {dots}
    </Svg>
  );
}

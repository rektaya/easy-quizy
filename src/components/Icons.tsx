import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Simple hand-drawn-feeling outline icons: slightly imperfect paths, round caps, one ink color.
type IconProps = { color: string; size?: number };

const strokeProps = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Explore: a little flower with five petals. */
export function ExploreIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12.00} cy={4.30} r={2.3} stroke={color} {...strokeProps} />
      <Circle cx={15.52} cy={6.86} r={2.3} stroke={color} {...strokeProps} />
      <Circle cx={14.17} cy={10.99} r={2.3} stroke={color} {...strokeProps} />
      <Circle cx={9.83} cy={10.99} r={2.3} stroke={color} {...strokeProps} />
      <Circle cx={8.48} cy={6.86} r={2.3} stroke={color} {...strokeProps} />
      <Circle cx={12} cy={8} r={0.9} fill={color} />
      <Path d="M12 14.4c.3 2.4.1 4.6-.4 6.4" stroke={color} {...strokeProps} />
      <Path d="M11.8 18.2c-1.8-1-3.4-.7-4.6.5 1.6 1.1 3.4 1 4.6-.5z" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** Study: two stacked, slightly tilted cards. */
export function StudyIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7.4 4.6c3.3-.6 7.3-.5 10.7-.1" stroke={color} {...strokeProps} />
      <Path
        d="M4.9 8.2c3.7-.6 8.8-.4 12.7 0 1 1.1.7 7.2.1 9-3.9.5-8.6.6-12.6.1-.5-2.7-.6-7-.2-9.1z"
        stroke={color}
        {...strokeProps}
      />
      <Path d="M8 12.6c1.6.1 3.4.1 5 0" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** Map: three stars joined by a wobbly line. */
export function MapIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6.9 16.1L11.3 8.4M12.9 8.5l4.3 6.1M8 17.3c3.1.5 6.1.3 8.8-.6" stroke={color} {...strokeProps} />
      <Circle cx={6.2} cy={16.9} r={1.7} stroke={color} {...strokeProps} />
      <Circle cx={12.1} cy={7} r={1.7} stroke={color} {...strokeProps} />
      <Circle cx={17.9} cy={15.6} r={1.7} stroke={color} {...strokeProps} />
    </Svg>
  );
}

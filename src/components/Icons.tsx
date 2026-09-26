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

/** A tap: a fingertip with two ripples around it. */
export function TapIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={2.2} fill={color} />
      <Path d="M7.6 7.8a6.2 6.2 0 0 0 0 8.4M16.4 7.8a6.2 6.2 0 0 1 0 8.4" stroke={color} {...strokeProps} />
      <Path d="M4.6 5.4a10.4 10.4 0 0 0 0 13.2M19.4 5.4a10.4 10.4 0 0 1 0 13.2" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** A swipe up: an arrow rising from a fingertip. */
export function SwipeUpIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={19} r={2.2} fill={color} />
      <Path d="M12 15.2V5.4M7.6 9.6L12 5.2l4.4 4.4" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** A little bin: lid, handle and a body with two lines. */
export function TrashIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.6 6.6c4.9-.3 9.9-.3 14.8 0M9.4 6.4c.1-1.6.6-2.4 2.5-2.4s2.4.8 2.6 2.4" stroke={color} {...strokeProps} />
      <Path d="M6.2 6.8c.3 3.7.4 8.4 1 12.1 3 .5 6.1.4 8.8 0 .6-3.6.7-8.3 1-12.1" stroke={color} {...strokeProps} />
      <Path d="M10.1 10.4v5.4M13.9 10.4v5.4" stroke={color} {...strokeProps} />
    </Svg>
  );
}

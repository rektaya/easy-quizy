import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Simple hand-drawn-feeling outline icons: slightly imperfect paths, round caps, one ink color.
type IconProps = { color: string; size?: number };

const strokeProps = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Explore: a telescope on a tripod, pointed at the sky. */
export function ExploreIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* the wide barrel with its lens */}
      <Path d="M8.9 7.4L17.2 2.6c.9-.4 1.6-.1 2 .6l.8 1.7c.3.8 0 1.5-.8 2L11.6 11.8c-.8.4-1.5.2-1.9-.5L8.6 9.3c-.3-.7-.1-1.6.3-1.9z" stroke={color} {...strokeProps} />
      {/* the eyepiece */}
      <Path d="M9.4 8.5L5.6 10.7l1.5 2.6L10.9 11" stroke={color} {...strokeProps} />
      {/* a band round the barrel */}
      <Path d="M13.2 5.3l2.4 4.1" stroke={color} {...strokeProps} />
      {/* the tripod */}
      <Path d="M11.3 12.7L8.1 21.2" stroke={color} {...strokeProps} />
      <Path d="M11.3 12.7L15.9 21.2" stroke={color} {...strokeProps} />
      <Path d="M11.4 12.9v5.4" stroke={color} {...strokeProps} />
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

/** Profile: a head and shoulders. */
export function ProfileIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.4} r={3.6} stroke={color} {...strokeProps} />
      <Path d="M4.8 19.6c.7-3.4 3.4-5.3 7.2-5.3s6.5 1.9 7.2 5.3" stroke={color} {...strokeProps} />
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

/** A chevron pointing left (back). */
export function ChevronLeftIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14.5 5.5L8 12l6.5 6.5" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** A chevron pointing right (a row that opens something). */
export function ChevronRightIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9.5 5.5L16 12l-6.5 6.5" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** A chevron pointing down (a select that opens a menu). */
export function ChevronDownIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5.5 9.5L12 16l6.5-6.5" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** Filters: a filled funnel. */
export function FilterIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2L4 5.5z" fill={color} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** Sorting: three lines that get shorter. */
export function SortIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6.5h16M4 12h11M4 17.5h6" stroke={color} {...strokeProps} />
    </Svg>
  );
}

/** A magnifying glass: a lens and its handle. */
export function SearchIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.4} stroke={color} {...strokeProps} />
      <Path d="M15.3 15.4l5 5" stroke={color} {...strokeProps} />
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

/** Camera mode on the Map: a viewfinder (four corners) round a small star. */
export function LookIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9V5.6C4 4.7 4.7 4 5.6 4H9" stroke={color} {...strokeProps} />
      <Path d="M15 4h3.4c.9 0 1.6.7 1.6 1.6V9" stroke={color} {...strokeProps} />
      <Path d="M20 15v3.4c0 .9-.7 1.6-1.6 1.6H15" stroke={color} {...strokeProps} />
      <Path d="M9 20H5.6C4.7 20 4 19.3 4 18.4V15" stroke={color} {...strokeProps} />
      <Path d="M12 8.6l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" stroke={color} {...strokeProps} strokeWidth={1.6} />
    </Svg>
  );
}

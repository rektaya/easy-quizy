import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

// A falling star for the first screen: a bright four-pointed head, a long soft tail behind it, and a few small
// stars around. It drifts a little along its own path, slowly, so the screen is never quite still.
const W = 320;
const H = 230;
const HEAD = { x: 250, y: 58 };
const DIR = { x: -0.86, y: 0.51 }; // the way the tail trails: down and to the left
const NORM = { x: 0.51, y: 0.86 };

function tail(len: number, width: number, bend: number, dx = 0, dy = 0) {
  const sx = HEAD.x + dx;
  const sy = HEAD.y + dy;
  const ex = sx + DIR.x * len;
  const ey = sy + DIR.y * len;
  const mx = sx + DIR.x * len * 0.5 + NORM.x * bend;
  const my = sy + DIR.y * len * 0.5 + NORM.y * bend;
  const a = { x: sx + NORM.x * width, y: sy + NORM.y * width };
  const b = { x: sx - NORM.x * width, y: sy - NORM.y * width };
  return `M ${a.x} ${a.y} Q ${mx + NORM.x * width * 0.4} ${my + NORM.y * width * 0.4} ${ex} ${ey} Q ${mx - NORM.x * width * 0.4} ${my - NORM.y * width * 0.4} ${b.x} ${b.y} Z`;
}

const R = 20;
const I = 4.6;
const HEAD_POINTS = [
  [0, -R], [I, -I], [R, 0], [I, I], [0, R], [-I, I], [-R, 0], [-I, -I],
]
  .map(([x, y]) => `${HEAD.x + x},${HEAD.y + y}`)
  .join(' ');

const DOTS: [number, number, number][] = [
  [46, 40, 1.8], [112, 22, 1.3], [170, 96, 1.6], [28, 120, 1.4], [92, 170, 1.8], [200, 18, 1.2], [290, 140, 1.6], [150, 200, 1.3], [270, 200, 1.1],
];

export function FallingStar({ width = W }: { width?: number }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withSequence(withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.sin) })), -1);
  }, [drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 10 }, { translateY: -drift.value * 6 }] }));
  return (
    <Animated.View style={[{ width, height: (width * H) / W }, style]} accessible={false}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="tail" x1={HEAD.x} y1={HEAD.y} x2={HEAD.x + DIR.x * 230} y2={HEAD.y + DIR.y * 230} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFF4DC" stopOpacity="0.95" />
            <Stop offset="0.35" stopColor="#FFB45E" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#F75831" stopOpacity="0" />
          </LinearGradient>
          <RadialGradient id="glow" cx={HEAD.x} cy={HEAD.y} r={54} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFE7C2" stopOpacity="0.8" />
            <Stop offset="0.4" stopColor="#FFB45E" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#F75831" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {DOTS.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#C9DDFF" opacity={0.55} />
        ))}
        <Path d={tail(230, 6.5, 8)} fill="url(#tail)" />
        <Path d={tail(150, 3, -6, -6, 14)} fill="url(#tail)" opacity={0.6} />
        <Path d={tail(110, 2.2, 5, 8, -12)} fill="url(#tail)" opacity={0.5} />
        <Circle cx={HEAD.x} cy={HEAD.y} r={54} fill="url(#glow)" />
        <Polygon points={HEAD_POINTS} fill="#FFF4DC" />
        <Circle cx={HEAD.x} cy={HEAD.y} r={4.5} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

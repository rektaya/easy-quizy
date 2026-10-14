import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, Line, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Button } from '../components/Button';
import { GlowCanvas, sphereUnits } from '../components/GlowShader';
import { LookIcon } from '../components/Icons';
import { LookSource } from '../components/LookSource';
import { TiltSource } from '../components/TiltSource';
import type { Glow } from '../components/GlowShader';
import { TabHeader } from '../components/TabHeader';
import { THEMES, WORDS } from '../data/words';
import { EXPLORE_LOCK_AT, waitingWords } from '../onboarding/batch';
import { THEME_LEVEL } from '../data/themeLinks';
import { buildClusters, clusterStats, curatedLinks, levelOf, starLook, zoomWords } from '../onboarding/mapdata';
import type { Cluster, StarLook, StarState } from '../onboarding/mapdata';
import { ambientStars, blob, layoutSky, shuffled } from '../onboarding/sky';
import type { SkyCluster } from '../onboarding/sky';
import { clampPan, minScale, panRange, snapScale } from '../onboarding/viewport';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';

// The Map is a night sky, and it now matches the rest of the app, which is the same deep navy. It looks like a plain, evenly starred sky, with no visible clusters: each
// theme is just one bigger star among many small ones, and the more of a theme you have learned, the
// more its star shines. Tap a big star and the sky zooms in on it, opening its cluster: one point
// per word, with what it is and how far you have come. It is for overview and motivation, not
// navigation.

const SKY = colors.bg;
const ON_SKY = colors.text;
const ON_SKY_DIM = colors.textSecondary;
const CORE = '#FFF4DC'; // the bright heart of a lit point
const WARM = '#FFC857'; // known words glow a warmer, brighter yellow
const DIM = '#6F8095'; // a point still to discover

// Tilting the phone nudges the layers of the sky by different amounts, which gives it depth: the small
// far stars move least, the big stars most. Pixels at a full tilt.
const PARALLAX_FAR = 7;
const PARALLAX_NEAR = 18;

const ZOOM = 2.6; // how far the sky zooms in on a star
// The sky is bigger than the screen: you start zoomed in on its middle and drag to look around.
const WORLD_X = 2.1; // width of the area the theme stars are spread over, in screens
const WORLD_Y = 1.9; // height of that area, in screens
// The sky itself is wider than that area by this much (in screens) on every side, so the theme stars
// never sit near its edges and there is always sky beyond the outermost one.
const WORLD_PAD = 0.45;
const SMALL_STAR_CELL = 38; // room for one small star per cell of this size (bigger cell, sparser sky)
const PANEL_HEIGHT = 190; // the card at the bottom, and the tab bar under it
const MAX_ZOOM_POINTS = 60; // every word of a theme gets its own point (an even sample beyond this)
const SPHERE_DUST = 230; // the fine dots that give the sphere its shape
const SPHERE_SPIN = 0.32; // radians per second
const SPHERE_TILT = 0.38;
const COOL = '#BFD4FF'; // the halo of a star that is not lit yet

// Soft glows: radial gradients that fade to nothing at the edge. Every Svg that draws them
// includes these definitions (the ids are the same everywhere).
function SkyDefs() {
  return (
    <Defs>
      <RadialGradient id="glow-orange" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={colors.accent} stopOpacity={0.9} />
        <Stop offset="0.35" stopColor={colors.accent} stopOpacity={0.38} />
        <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="glow-warm" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={WARM} stopOpacity={0.95} />
        <Stop offset="0.35" stopColor={WARM} stopOpacity={0.42} />
        <Stop offset="1" stopColor={WARM} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="glow-cool" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={COOL} stopOpacity={0.55} />
        <Stop offset="0.4" stopColor={COOL} stopOpacity={0.16} />
        <Stop offset="1" stopColor={COOL} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="nebula" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={colors.accent} stopOpacity={0.2} />
        <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

// A theme's big star and a word's point are drawn by one shader (components/GlowShader). These turn
// what the Map knows into what the shader needs.
function heroGlow(x: number, y: number, baseR: number, look: StarLook, phase: number): Glow {
  if (look.kind === 'dull') return { x, y, radius: baseR * 0.75, dull: true }; // untouched: there, but dark
  // a little of the theme taken: the same warm point as a glowing star, with only a tiny glow and no rays
  if (look.kind === 'spark') return { x, y, radius: baseR * 0.85, lit: 0.1, haloK: 0.45, phase };
  // more of it taken: a bigger core, a wider halo and longer rays
  const t = look.t;
  return { x, y, radius: baseR * (0.9 + 1.1 * t), lit: t, rays: 1, phase };
}

// A word's star. A word you have taken into study shines (orange while it is being learned, warm
// yellow once it is known); a word you have not met stays a dim dot.
function wordGlow(state: StarState, r: number, phase: number): Glow {
  switch (state) {
    case 'unexplored':
      return { x: 0, y: 0, radius: r * 1.05, dull: true };
    case 'gathered':
      return { x: 0, y: 0, radius: r * 1.5, lit: 0.75, haloK: 0.5, rays: 0.3, phase };
    case 'learning':
      return { x: 0, y: 0, radius: r * 1.5, lit: 0.9, haloK: 0.55, rays: 0.4, phase };
    case 'known':
      return { x: 0, y: 0, radius: r * 1.7, lit: 1, haloK: 0.6, rays: 0.6, tint: [1, 0.78, 0.34], phase };
  }
}

type Props = {
  /** Bottom space to leave for the floating tab bar. */
  bottomSpace: number;
  /** "Explore from here": Explore starts in the chosen area. */
  onExplore: (themeId: string) => void;
  /** "Study" on a theme whose words are all explored: on to the Study tab. */
  onStudy: () => void;
};

function snapTick() {
  Haptics.selectionAsync().catch(() => {});
}

export default function MapScreen({ bottomSpace, onExplore, onStudy }: Props) {
  const insets = useSafeAreaInsets();
  const { ratings, reset } = useRatings();
  const { cards, skySeed, restartOnboarding, mapIntroSeen, setMapIntroSeen } = useProfile();
  // Testing helper: hold the "map" title to wipe this phone's progress and begin from the name screen.
  const confirmStartOver = () =>
    Alert.alert('Start over?', 'Everything on this phone is erased and the app begins from the very start.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          reset();
          restartOnboarding();
        },
      },
    ]);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null); // whose card is showing
  const [openId, setOpenId] = useState<string | null>(null); // whose cluster is drawn opened up
  const open = useSharedValue(0); // 0 = the whole sky, 1 = a cluster opened up
  const tiltX = useSharedValue(0); // the phone's tilt, -1..1 (see TiltSource)
  const tiltY = useSharedValue(0);
  const focused = useIsFocused();
  // The first time the Map tab is opened a card says what it is. It stays until "got it" (or until the
  // user leaves the tab, so it never comes back on its own).
  const showIntro = !mapIntroSeen && focused;
  const introShown = useRef(false);
  useEffect(() => {
    if (showIntro) introShown.current = true;
    else if (!focused && introShown.current && !mapIntroSeen) setMapIntroSeen();
  }, [showIntro, focused, mapIntroSeen, setMapIntroSeen]);
  const reduceMotion = useReducedMotion();
  // Camera mode (the LookIcon button): the phone is a camera pointed at the sky. While it is on the tilt
  // parallax is off and dragging is off, so the two do not fight.
  const [camera, setCamera] = useState(false);
  const cameraOn = camera && focused && Platform.OS !== 'web';
  const tiltOn = focused && !reduceMotion && Platform.OS !== 'web' && !cameraOn;
  // when the tab is left, or there is no sensor, the sky settles back to centre
  useEffect(() => {
    if (!tiltOn) {
      tiltX.value = withTiming(0, { duration: 400 });
      tiltY.value = withTiming(0, { duration: 400 });
    }
  }, [tiltOn, tiltX, tiltY]);

  const clusters = useMemo(() => buildClusters(THEMES, WORDS), []);
  const pad = useMemo(() => ({ x: stage.w * WORLD_PAD, y: stage.h * WORLD_PAD }), [stage]);
  const world = useMemo(
    () => ({ w: stage.w * WORLD_X + 2 * pad.x, h: stage.h * WORLD_Y + 2 * pad.y }),
    [stage, pad],
  );
  const links = useMemo(() => curatedLinks(clusters), [clusters]);
  const sky = useMemo(
    () =>
      stage.w
        ? layoutSky(
            clusters.map((c) => ({ id: c.id, words: c.words.length, level: THEME_LEVEL[c.id] })),
            world.w - 2 * pad.x,
            world.h - 2 * pad.y,
            links,
            skySeed,
          ).map((c) => ({ ...c, cx: c.cx + pad.x, cy: c.cy + pad.y }))
        : [],
    [clusters, stage, world, pad, links, skySeed],
  );
  const ambient = useMemo(
    () => (stage.w ? ambientStars(world.w, world.h, sky.map((c) => ({ x: c.cx, y: c.cy })), SMALL_STAR_CELL, skySeed) : []),
    [stage, world, sky, skySeed],
  );

  // Where the screen looks onto the sky: it starts on the middle, and dragging moves it around.
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  useEffect(() => {
    if (!stage.w) return;
    panX.value = -(world.w - stage.w) / 2;
    panY.value = -(world.h - stage.h) / 2;
  }, [stage, world, panX, panY]);
  // Pinching pulls the camera back: 1 = close, the lowest value shows the whole sky. Far out, the theme
  // names fade and only the stars and the threads between them are left.
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const lowest = stage.w ? minScale(stage.w, stage.h, world.w, world.h) : 1;
  const [pulledBack, setPulledBack] = useState(false);
  useAnimatedReaction(
    () => scale.value < 0.9,
    (now, before) => {
      if (now !== before) scheduleOnRN(setPulledBack, now);
    },
    [],
  );

  // The sky is drawn in two layers, once per change of data (they are not redrawn while they
  // animate): an even field of small stars, and one big star per theme.
  const smallStars = useMemo(
    () => (
      <Svg width={world.w} height={world.h}>
        {ambient.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={CORE} opacity={s.o} />
        ))}
      </Svg>
    ),
    [ambient, world],
  );
  // how each theme's star looks, from how many of its words have been taken
  const looks = useMemo(() => clusters.map((c) => starLook(clusterStats(c, ratings, cards))), [clusters, ratings, cards]);
  const bigStars = useMemo(() => {
    const glows = looks.map(levelOf);
    return (
      <Svg width={world.w} height={world.h}>
        <SkyDefs />
        {/* a soft nebula behind the themes that shine */}
        {sky.map((c, i) => {
          const t = looks[i].kind === 'glow' ? glows[i] : 0;
          return t > 0.3 ? (
            <Circle key={`n-${c.id}`} cx={c.cx} cy={c.cy} r={c.heroR * (9 + 8 * t) * (0.9 + 1.1 * t)} fill="url(#nebula)" opacity={Math.min(1, t * 1.3)} />
          ) : null;
        })}
        {/* the threads between related themes: none between two dark stars, faint and cool when one end is
            lit, warm and brighter when both are */}
        {sky.length
          ? links.map((l) => {
              const a = sky[l.a];
              const b = sky[l.b];
              if (glows[l.a] <= 0 && glows[l.b] <= 0) return null;
              const both = Math.min(glows[l.a], glows[l.b]);
              return (
                <Line
                  key={`${l.a}-${l.b}`}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke={both > 0 ? WARM : COOL}
                  strokeWidth={both > 0 ? 1.1 : 0.8}
                  strokeOpacity={0.12 + 0.55 * both}
                />
              );
            })
          : null}
      </Svg>
    );
  }, [sky, links, looks, world]);

  // the theme names are their own layer, so they can fade away when the camera pulls back
  const labels = useMemo(() => {
    const glows = looks.map(levelOf);
    return (
      <Svg width={world.w} height={world.h}>
        {sky.map((c, i) => (
          <SvgText
            key={`t-${c.id}`}
            x={c.cx}
            y={c.cy + c.heroR + 20}
            fontSize={11}
            fontFamily={fonts.regular}
            fill={ON_SKY}
            fillOpacity={0.3 + 0.65 * glows[i]}
            textAnchor="middle"
          >
            {clusters[i].en}
          </SvgText>
        ))}
      </Svg>
    );
  }, [sky, clusters, looks, world]);

  // the stars themselves, drawn by the shader so they can twinkle
  const skyGlows = useMemo(
    () =>
      sky.map((c, i) => heroGlow(c.cx, c.cy, c.heroR, looks[i], (i * 2.399) % 6.283)),
    [sky, looks],
  );

  const opened = sky.find((c) => c.id === openId);
  const cluster = clusters.find((c) => c.id === selectedId) ?? null;
  const locked = waitingWords(WORDS, ratings, cards).length >= EXPLORE_LOCK_AT;

  // Where the opened cluster ends up (above the card), and the shape its points take there.
  const target = { x: stage.w / 2, y: Math.max(150, (stage.h - PANEL_HEIGHT + 110) / 2) };

  const zoom = useMemo(() => {
    if (!opened || !cluster) return null;
    const rx = stage.w * 0.3 * opened.spread;
    const ry = stage.h * 0.15 * opened.spread;
    const zw = zoomWords(cluster, ratings, cards, MAX_ZOOM_POINTS);
    const states = zw.map((z) => z.state);
    // the theme is a turning sphere of dots: one point per word, and the ones you have taken into study
    // shine. The words sit at scattered places of the sphere, so the shining ones are not clumped.
    const R = Math.min(stage.w * 0.36, 150);
    const seats = shuffled(sphereUnits(zw.length), opened.seed);
    const look = starLook(clusterStats(cluster, ratings, cards));
    const glow = look.kind === 'glow' ? look.t : 0; // the haze behind an open theme
    const glows = zw.map((z, i) => ({
      ...wordGlow(states[i], 3.4 + ((i * 7) % 5) * 0.8, (i * 2.399) % 6.283),
      sphere: { cx: target.x, cy: target.y, R, u: seats[i], w: SPHERE_SPIN, tilt: SPHERE_TILT },
    }));
    return {
      glows,
      dust: { cx: target.x, cy: target.y, R, w: SPHERE_SPIN, tilt: SPHERE_TILT, units: sphereUnits(SPHERE_DUST, 0.2) },
      nebula: blob(opened.seed + 1, 3, rx * 0.6, ry * 0.6, opened.angle, [1, 1]).map((p) => ({ x: p.x, y: p.y, r: Math.max(rx, ry) * 0.9 })),
      glow,
    };
  }, [opened, cluster, ratings, cards, stage, target.x, target.y]);

  const select = useCallback(
    (c: SkyCluster) => {
      setSelectedId(c.id);
      setOpenId(c.id);
      open.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    },
    [open],
  );
  const finishClose = useCallback(() => {
    setSelectedId(null);
    setOpenId(null);
  }, []);
  const close = useCallback(() => {
    open.value = withTiming(0, { duration: 340, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(finishClose);
    });
  }, [open, finishClose]);

  // Opening a star zooms the sky in on it: the sky grows and dims, with the star sliding to the
  // middle, while its cluster (drawn at full size there) grows out of the star.
  const zoomTransform = () => {
    'worklet';
    const k = 1 + (ZOOM - 1) * open.value;
    // the star's place on the screen is its place in the sky plus where the screen is looking
    const sx = opened ? opened.cx + panX.value : 0;
    const sy = opened ? opened.cy + panY.value : 0;
    const tx = opened ? target.x - stage.w / 2 - ZOOM * (sx - stage.w / 2) : 0;
    const ty = opened ? target.y - stage.h / 2 - ZOOM * (sy - stage.h / 2) : 0;
    return [{ translateX: tx * open.value }, { translateY: ty * open.value }, { scale: k }];
  };
  const smallStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.7 * open.value,
    transform: [{ translateX: -tiltX.value * PARALLAX_FAR }, { translateY: -tiltY.value * PARALLAX_FAR }, ...zoomTransform(), { scale: scale.value }],
  }));
  // the other themes' big stars fade out quickly, so only the opened cluster stays lit
  const bigStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - 1.6 * open.value),
    transform: [{ translateX: -tiltX.value * PARALLAX_NEAR }, { translateY: -tiltY.value * PARALLAX_NEAR }, ...zoomTransform(), { scale: scale.value }],
  }));
  const openStyle = useAnimatedStyle(() => {
    const k = 1 / ZOOM + (1 - 1 / ZOOM) * open.value;
    const sx = opened ? opened.cx + panX.value : 0;
    const sy = opened ? opened.cy + panY.value : 0;
    const fromX = opened ? sx - stage.w / 2 - (target.x - stage.w / 2) / ZOOM : 0;
    const fromY = opened ? sy - stage.h / 2 - (target.y - stage.h / 2) / ZOOM : 0;
    return {
      opacity: Math.min(1, open.value * 1.6),
      transform: [{ translateX: fromX * (1 - open.value) }, { translateY: fromY * (1 - open.value) }, { scale: k }],
    };
  });

  // Dragging looks around the sky (not while a cluster is open); a flick keeps gliding to a stop.
  const drag = Gesture.Pan()
    .enabled(!selectedId && !cameraOn)
    .maxPointers(1) // two fingers are a pinch: if this drag took them too it would undo the pinch's own zoom point
    .minDistance(6)
    .onStart(() => {
      'worklet';
      startX.value = panX.value;
      startY.value = panY.value;
    })
    .onUpdate((e) => {
      'worklet';
      // the picture is scaled, so a finger moves the sky by less than its own distance
      panX.value = clampPan(startX.value + e.translationX / scale.value, scale.value, stage.w, world.w);
      panY.value = clampPan(startY.value + e.translationY / scale.value, scale.value, stage.h, world.h);
    })
    .onEnd((e) => {
      'worklet';
      const [x0, x1] = panRange(scale.value, stage.w, world.w);
      const [y0, y1] = panRange(scale.value, stage.h, world.h);
      if (x1 > x0) panX.value = withDecay({ velocity: e.velocityX / scale.value, clamp: [x0, x1] });
      if (y1 > y0) panY.value = withDecay({ velocity: e.velocityY / scale.value, clamp: [y0, y1] });
    });
  // Pinching in once the camera is already close opens the star under the fingers (it zooms into it, the
  // same as a tap); pinching out on an open star closes it again, following the fingers. So the map zooms
  // at every level: the whole sky, the sky close up, and one theme.
  const opening = useSharedValue(false);
  // Pinching zooms into the point between the fingers, not the middle of the map: the sky is scaled
  // around the middle of the screen, so the offset is adjusted by how far the point is from that middle.
  // While the map settles on a distance after the fingers lift, it keeps the same point still.
  const snapping = useSharedValue(false);
  const focusX = useSharedValue(0);
  const focusY = useSharedValue(0);
  const lastFx = useSharedValue(0); // where the middle of the two fingers was a moment ago
  const lastFy = useSharedValue(0);
  const pinch = Gesture.Pinch()
    .enabled(!selectedId)
    .onStart((e) => {
      'worklet';
      startScale.value = scale.value;
      opening.value = false;
      snapping.value = false;
      lastFx.value = e.focalX;
      lastFy.value = e.focalY;
    })
    .onUpdate((e) => {
      'worklet';
      if (!opening.value && startScale.value > 0.95 && e.scale > 1.25) {
        // the star nearest to the middle of the pinch, if it is near enough
        let best = -1;
        let bestD = 130;
        for (let i = 0; i < sky.length; i++) {
          const d = Math.hypot(sky[i].cx + panX.value - e.focalX, sky[i].cy + panY.value - e.focalY);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        if (best >= 0) {
          opening.value = true;
          scheduleOnRN(snapTick);
          scheduleOnRN(select, sky[best]);
        }
      }
      const before = scale.value;
      const next = Math.min(1, Math.max(lowest, startScale.value * e.scale));
      scale.value = next;
      // the point of the sky that was under the fingers stays under them, even as they move
      const nx = panX.value + (e.focalX - stage.w / 2) / next - (lastFx.value - stage.w / 2) / before;
      const ny = panY.value + (e.focalY - stage.h / 2) / next - (lastFy.value - stage.h / 2) / before;
      lastFx.value = e.focalX;
      lastFy.value = e.focalY;
      panX.value = clampPan(nx, next, stage.w, world.w);
      panY.value = clampPan(ny, next, stage.h, world.h);
    })
    // the map only rests at two distances: when the fingers lift it snaps to the nearer, close up or the
    // whole sky, never somewhere in between
    .onEnd((e) => {
      'worklet';
      const target = snapScale(scale.value, startScale.value, lowest);
      if (target !== startScale.value) scheduleOnRN(snapTick);
      focusX.value = lastFx.value; // the last place the fingers were (the end event's own point can jump)
      focusY.value = lastFy.value;
      snapping.value = true;
      scale.value = withTiming(target, { duration: 340, easing: Easing.out(Easing.cubic) }, () => {
        'worklet';
        snapping.value = false;
      });
    });
  const closePinch = Gesture.Pinch()
    .enabled(!!selectedId)
    .onUpdate((e) => {
      'worklet';
      open.value = Math.min(1, Math.max(0, 1 - (1 - e.scale) * 1.4));
    })
    .onEnd(() => {
      'worklet';
      if (open.value < 0.62) {
        scheduleOnRN(snapTick);
        open.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(finishClose);
        });
      } else {
        open.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      }
    });
  // the sky's offset follows the scale as it snaps, so its edge never comes inside the screen
  useAnimatedReaction(
    () => scale.value,
    (sc, before) => {
      if (before === null || sc === before) return;
      let px = panX.value;
      let py = panY.value;
      if (snapping.value) {
        // keep the point the user pinched on where it is while the map settles
        px += (focusX.value - stage.w / 2) * (1 / sc - 1 / before);
        py += (focusY.value - stage.h / 2) * (1 / sc - 1 / before);
      }
      panX.value = clampPan(px, sc, stage.w, world.w);
      panY.value = clampPan(py, sc, stage.h, world.h);
    },
    [stage.w, stage.h, world.w, world.h],
  );
  const look = Gesture.Simultaneous(drag, pinch, closePinch);
  const cameraPaused = useSharedValue(false);
  useEffect(() => {
    cameraPaused.value = !!selectedId;
  }, [selectedId, cameraPaused]);
  const labelStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (scale.value - 0.62) / 0.3)) }));
  const worldStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panX.value }, { translateY: panY.value }] }));

  return (
    <View style={styles.screen}>
      {tiltOn ? <TiltSource x={tiltX} y={tiltY} /> : null}
      {cameraOn && stage.w > 0 ? (
        <LookSource panX={panX} panY={panY} scale={scale} paused={cameraPaused} stage={stage} world={world} />
      ) : null}
      <View style={styles.stage} onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {stage.w > 0 ? (
          <>
            {/* the sky is bigger than the screen; the drag moves the screen over it */}
            <GestureDetector gesture={look}>
              <View style={StyleSheet.absoluteFill}>
                <Animated.View style={[StyleSheet.absoluteFill, smallStyle]} pointerEvents="none">
                  <Animated.View style={[{ position: 'absolute', width: world.w, height: world.h }, worldStyle]}>{smallStars}</Animated.View>
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, bigStyle]} pointerEvents="box-none">
                  <Animated.View
                    style={[{ position: 'absolute', width: world.w, height: world.h }, worldStyle]}
                    pointerEvents="box-none"
                  >
                    {bigStars}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <GlowCanvas width={world.w} height={world.h} points={skyGlows} />
                    </View>
                    <Animated.View style={[StyleSheet.absoluteFill, labelStyle]} pointerEvents="none">
                      {labels}
                    </Animated.View>
                    {/* tap targets: one per big star; while a cluster is open, tapping the sky closes it */}
                    {selectedId || pulledBack
                      ? null
                      : sky.map((c, i) => (
                          <Pressable
                            key={c.id}
                            onPress={() => select(c)}
                            accessibilityRole="button"
                            accessibilityLabel={`${clusters[i].en}: ${clusterStats(clusters[i], ratings, cards).total - clusterStats(clusters[i], ratings, cards).unexplored} of ${clusters[i].words.length} words explored`}
                            style={{ position: 'absolute', left: c.cx - 28, top: c.cy - 28, width: 56, height: 56 }}
                          />
                        ))}
                  </Animated.View>
                </Animated.View>
              </View>
            </GestureDetector>

            {/* the opened cluster: the big star in the middle, and one point per word round it */}
            {zoom && opened ? (
              <Animated.View style={[StyleSheet.absoluteFill, openStyle]} pointerEvents="none">
                <View style={StyleSheet.absoluteFill}>
                <Svg width={stage.w} height={stage.h}>
                  <SkyDefs />
                  {zoom.glow > 0
                    ? zoom.nebula.map((n, i) => (
                        <Circle key={i} cx={target.x + n.x} cy={target.y + n.y} r={n.r} fill="url(#nebula)" opacity={Math.min(1, zoom.glow * 1.6)} />
                      ))
                    : null}
                </Svg>
                </View>
                <View style={StyleSheet.absoluteFill}>
                  <GlowCanvas width={stage.w} height={stage.h} points={zoom.glows} dust={zoom.dust} tilt={{ x: tiltX, y: tiltY }} />
                </View>
              </Animated.View>
            ) : null}

            {selectedId ? (
              <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="close" accessibilityRole="button" />
            ) : null}
          </>
        ) : null}
      </View>

      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <TabHeader title="map" color={ON_SKY} onTitleLongPress={confirmStartOver} right={
            <View style={styles.headRight}>
              {Platform.OS !== 'web' ? (
                <Pressable
                  onPress={() => setCamera((c) => !c)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: camera }}
                  accessibilityLabel={camera ? 'camera mode on: turn off' : 'camera mode: look around by turning the phone'}
                  hitSlop={10}
                  style={[styles.lookButton, camera && styles.lookButtonOn]}
                >
                  <LookIcon color={camera ? colors.onAccent : ON_SKY_DIM} />
                </Pressable>
              ) : null}
            </View>
          }
        />
        {!selectedId ? <Text style={styles.sub}>every star is a topic. it lights up as you learn its words.</Text> : null}
      </View>

      {cluster ? (
        <Panel cluster={cluster} bottom={bottomSpace} locked={locked} onExplore={onExplore} onStudy={onStudy} />
      ) : showIntro ? (
        // the first time the Map is opened: what it is, and how to move around it
        <Animated.View entering={FadeIn.duration(400)} style={[styles.card, { bottom: bottomSpace }]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>your map</Text>
            <Text style={styles.cardSub}>
              every star is a topic, and it lights up as you learn its words. tap a star to look inside it, pinch to see the whole sky, and drag to look around.
            </Text>
          </View>
          <Button label="got it" onPress={setMapIntroSeen} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Panel({
  cluster,
  bottom,
  locked,
  onExplore,
  onStudy,
}: {
  cluster: Cluster;
  bottom: number;
  locked: boolean;
  onExplore: (id: string) => void;
  onStudy: () => void;
}) {
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const stats = clusterStats(cluster, ratings, cards);
  const done = stats.unexplored === 0;
  return (
    <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)} style={[styles.card, { bottom }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{cluster.en}</Text>
          <Text style={styles.cardSub}>
            {cluster.de} · {stats.total - stats.unexplored} of {stats.total} words explored
          </Text>
          {done ? <Text style={styles.cardNote}>all the words in this cluster are already explored, so it’s time to study them</Text> : null}
        </View>
      </View>
      {done ? (
        <Button label="study" onPress={onStudy} />
      ) : (
        <Button
          label={locked ? 'explore is paused' : 'explore from here'}
          onPress={() => onExplore(cluster.id)}
          disabled={locked}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SKY },
  head: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 24, gap: 6 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lookButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  lookButtonOn: { backgroundColor: colors.accent },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: ON_SKY_DIM },
  // the sky fills the whole screen, behind the header, the card and the tab bar, so there are no bare bands
  stage: { ...StyleSheet.absoluteFill },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 14,
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardHead: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: fonts.medium, fontSize: 20, color: ON_SKY },
  cardSub: { fontFamily: fonts.regular, fontSize: 13, color: ON_SKY_DIM },
  cardNote: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: ON_SKY, marginTop: 8 },
});

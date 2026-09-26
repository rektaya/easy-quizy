import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDecay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Button } from '../components/Button';
import { TabHeader } from '../components/TabHeader';
import { THEMES, WORDS } from '../data/words';
import { EXPLORE_LOCK_AT, waitingWords } from '../onboarding/batch';
import { buildClusters, clusterStats, glowOf, zoomStates } from '../onboarding/mapdata';
import type { Cluster, StarState } from '../onboarding/mapdata';
import { WORD_POINT_SIZE, ambientStars, blob, layoutSky } from '../onboarding/sky';
import type { SkyCluster } from '../onboarding/sky';
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

const ZOOM = 2.6; // how far the sky zooms in on a star
// The sky is bigger than the screen: you start zoomed in on its middle and drag to look around.
const WORLD_X = 2.1; // width of the whole sky, in screens
const WORLD_Y = 1.9; // height of the whole sky, in screens
const SMALL_STAR_CELL = 30; // room for one small star per cell of this size
const PANEL_HEIGHT = 330; // the card at the bottom, and the tab bar under it
const MAX_ZOOM_POINTS = 48;
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

// A theme's big star. Unlit it is a bright white star with a cool halo; as the theme is learned the
// halo turns warm and grows, so the star shines brighter and warmer (`glow`, 0..1).
function Hero({ x, y, r, glow }: { x: number; y: number; r: number; glow: number }) {
  return (
    <>
      <Circle cx={x} cy={y} r={r * 6} fill="url(#glow-cool)" opacity={1 - 0.7 * glow} />
      {glow > 0 ? <Circle cx={x} cy={y} r={r * (6 + 5 * glow)} fill="url(#glow-orange)" opacity={0.35 + 0.65 * glow} /> : null}
      <Circle cx={x} cy={y} r={r} fill={CORE} />
    </>
  );
}

// One glowing point: a crisp warm-white core inside a soft halo, like the reference. `level` is
// how lit it is (0..1); an unlit point is a plain dim dot.
function Glow({ x, y, r, level, warm = false }: { x: number; y: number; r: number; level: number; warm?: boolean }) {
  if (level <= 0.02) return <Circle cx={x} cy={y} r={r * 0.85} fill={DIM} opacity={0.55} />;
  return (
    <>
      <Circle cx={x} cy={y} r={r * 5.4} fill={warm ? 'url(#glow-warm)' : 'url(#glow-orange)'} opacity={level} />
      <Circle cx={x} cy={y} r={r} fill={CORE} opacity={0.4 + 0.6 * level} />
    </>
  );
}

/** How one word looks in an opened cluster. */
function WordPoint({ state, x, y, r }: { state: StarState; x: number; y: number; r: number }) {
  switch (state) {
    case 'unexplored':
      return <Glow x={x} y={y} r={r} level={0} />;
    case 'gathered':
      return (
        <>
          <Circle cx={x} cy={y} r={r * 1.5} fill="none" stroke={CORE} strokeOpacity={0.7} strokeWidth={1.2} />
          <Circle cx={x} cy={y} r={r * 3} fill="url(#glow-orange)" opacity={0.25} />
        </>
      );
    case 'learning':
      return <Glow x={x} y={y} r={r} level={0.85} />;
    case 'known':
      return <Glow x={x} y={y} r={r * 1.25} level={1} warm />;
  }
}

// Small sample of a state, for the legend and the counts in the card.
function Sample({ state }: { state: StarState }) {
  return (
    <Svg width={24} height={24} viewBox="-12 -12 24 24">
      <SkyDefs />
      <WordPoint state={state} x={0} y={0} r={1.5} />
    </Svg>
  );
}

const STATE_ORDER: StarState[] = ['unexplored', 'gathered', 'learning', 'known'];
const STATE_LABEL: Record<StarState, string> = {
  unexplored: 'unexplored',
  gathered: 'gathered',
  learning: 'learning',
  known: 'known',
};

type Props = {
  /** Bottom space to leave for the floating tab bar. */
  bottomSpace: number;
  /** "Explore from here": Explore starts in the chosen area. */
  onExplore: (themeId: string) => void;
};

export default function MapScreen({ bottomSpace, onExplore }: Props) {
  const insets = useSafeAreaInsets();
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null); // whose card is showing
  const [openId, setOpenId] = useState<string | null>(null); // whose cluster is drawn opened up
  const open = useSharedValue(0); // 0 = the whole sky, 1 = a cluster opened up

  const clusters = useMemo(() => buildClusters(THEMES, WORDS), []);
  const world = useMemo(() => ({ w: stage.w * WORLD_X, h: stage.h * WORLD_Y }), [stage]);
  const sky = useMemo(
    () => (stage.w ? layoutSky(clusters.map((c) => ({ id: c.id, words: c.words.length })), world.w, world.h) : []),
    [clusters, stage, world],
  );
  const ambient = useMemo(
    () => (stage.w ? ambientStars(world.w, world.h, sky.map((c) => ({ x: c.cx, y: c.cy })), SMALL_STAR_CELL) : []),
    [stage, world, sky],
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
  const minX = -(world.w - stage.w);
  const minY = -(world.h - stage.h);

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
  const bigStars = useMemo(
    () => (
      <Svg width={world.w} height={world.h}>
        <SkyDefs />
        {sky.map((c, i) => (
          <Hero key={c.id} x={c.cx} y={c.cy} r={c.heroR} glow={glowOf(clusterStats(clusters[i], ratings, cards))} />
        ))}
      </Svg>
    ),
    [sky, clusters, ratings, cards, world],
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
    const states = zoomStates(cluster, ratings, cards, MAX_ZOOM_POINTS);
    return {
      states,
      pts: blob(opened.seed, states.length, rx, ry, opened.angle, WORD_POINT_SIZE),
      nebula: blob(opened.seed + 1, 3, rx * 0.6, ry * 0.6, opened.angle, [1, 1]).map((p) => ({ x: p.x, y: p.y, r: Math.max(rx, ry) * 0.9 })),
      glow: glowOf(clusterStats(cluster, ratings, cards)),
    };
  }, [opened, cluster, ratings, cards, stage]);

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
  const smallStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.7 * open.value, transform: zoomTransform() }));
  // the other themes' big stars fade out quickly, so only the opened cluster stays lit
  const bigStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - 1.6 * open.value), transform: zoomTransform() }));
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
    .enabled(!selectedId)
    .minDistance(6)
    .onStart(() => {
      'worklet';
      startX.value = panX.value;
      startY.value = panY.value;
    })
    .onUpdate((e) => {
      'worklet';
      panX.value = Math.min(0, Math.max(minX, startX.value + e.translationX));
      panY.value = Math.min(0, Math.max(minY, startY.value + e.translationY));
    })
    .onEnd((e) => {
      'worklet';
      panX.value = withDecay({ velocity: e.velocityX, clamp: [minX, 0] });
      panY.value = withDecay({ velocity: e.velocityY, clamp: [minY, 0] });
    });
  const worldStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panX.value }, { translateY: panY.value }] }));

  const explored = WORDS.filter((w) => ratings[w.id]).length;

  return (
    <View style={styles.screen}>
      <View style={styles.stage} onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {stage.w > 0 ? (
          <>
            {/* the sky is bigger than the screen; the drag moves the screen over it */}
            <GestureDetector gesture={drag}>
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
                    {/* tap targets: one per big star; while a cluster is open, tapping the sky closes it */}
                    {selectedId
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
                <Svg width={stage.w} height={stage.h}>
                  <SkyDefs />
                  {zoom.glow > 0
                    ? zoom.nebula.map((n, i) => (
                        <Circle key={i} cx={target.x + n.x} cy={target.y + n.y} r={n.r} fill="url(#nebula)" opacity={Math.min(1, zoom.glow * 1.6)} />
                      ))
                    : null}
                  {zoom.pts.map((p, i) => (
                    <WordPoint key={i} state={zoom.states[i]} x={target.x + p.x} y={target.y + p.y} r={p.r} />
                  ))}
                  <Hero x={target.x} y={target.y} r={opened.heroR * ZOOM} glow={zoom.glow} />
                </Svg>
              </Animated.View>
            ) : null}

            {selectedId ? (
              <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="close" accessibilityRole="button" />
            ) : null}
          </>
        ) : null}
      </View>

      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <TabHeader title="map" color={ON_SKY} right={<Text style={styles.total}>{explored}</Text>} />
      </View>

      {cluster ? (
        <Panel cluster={cluster} bottom={bottomSpace} locked={locked} onExplore={onExplore} onClose={close} />
      ) : null}
    </View>
  );
}

function Panel({
  cluster,
  bottom,
  locked,
  onExplore,
  onClose,
}: {
  cluster: Cluster;
  bottom: number;
  locked: boolean;
  onExplore: (id: string) => void;
  onClose: () => void;
}) {
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const stats = clusterStats(cluster, ratings, cards);
  const done = stats.unexplored === 0;
  return (
    <View style={[styles.card, { bottom }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{cluster.en}</Text>
          <Text style={styles.cardSub}>
            {cluster.de} · {stats.total - stats.unexplored} of {stats.total} words explored
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="close" hitSlop={12}>
          <Text style={styles.close}>close</Text>
        </Pressable>
      </View>
      <View style={styles.stats}>
        {STATE_ORDER.map((s) => (
          <View key={s} style={styles.stat} accessible accessibilityLabel={`${stats[s]} ${STATE_LABEL[s]}`}>
            <Sample state={s} />
            <View>
              <Text style={styles.statCount}>{stats[s]}</Text>
              <Text style={styles.statLabel}>{STATE_LABEL[s]}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button
        label={locked ? 'explore is paused' : done ? 'all explored' : 'explore from here'}
        onPress={() => onExplore(cluster.id)}
        disabled={locked || done}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SKY },
  head: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 24, gap: 6 },
  total: { fontFamily: fonts.medium, fontSize: 15, color: ON_SKY_DIM },
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
  close: { fontFamily: fonts.regular, fontSize: 13, color: ON_SKY_DIM },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statCount: { fontFamily: fonts.medium, fontSize: 16, color: ON_SKY, textAlign: 'left' },
  statLabel: { fontFamily: fonts.regular, fontSize: 10.5, color: ON_SKY_DIM },
});

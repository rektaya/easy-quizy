import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurMask, Canvas, Circle, RadialGradient, useClock, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { CORE_RAMP, HALO_RAMP, ramp, shineOf } from '../circle/shine';
import { dayProgress, exploreByDay, studyByDay, weekOf } from '../onboarding/streak';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { Card } from './Card';
import { alpha, colors, fonts, radius, stars } from '../theme';

/** The radius of a star's core: the same for every day (only the shine changes). */
const EDGE = 11;
/** Room for the glow round a star, so that it fades out completely and never ends in a visible edge of its drawing area. */
const GLOW = 40;
// a day without study: the deep, dark blue of the ring of a word that is not known at all
const NONE = alpha(stars.deep, 1);

// Your week in Profile: seven glowing stars (round, soft, shining, as the circle's stardust does), one for each day, Monday first. A day without study is a dim blue star; the more of the
// day's goal is done (the goal is the number of words in a session, the setting under it) the more it shines, from icy
// blue through cream to a bright golden circle with a glow when the goal is done. The same shine as the circle's stardust. Only
// studying counts in full and meeting words in Explore counts for half (a day of only exploring never goes past the middle of the scale, so it is never golden). A day that was missed just stays a dim star:
// nothing burns down. The days to come are dimmer still, and today's letter is bright.
export function WeekCard() {
  const { cards, reviewLog, sessionWords } = useProfile();
  const { ratings } = useRatings();
  const now = Date.now();
  const byDay = studyByDay(reviewLog, cards);
  const metByDay = exploreByDay(ratings);
  const week = weekOf(byDay, now);

  // Seven columns spread across the plate with equal gaps (space between). Each column is a star and, right under it, the letter of its day,
  // so they are always in line. A star's drawing area is larger than its column (room for the glow) and laid back over it.
  return (
    <Card style={styles.card} accessible accessibilityLabel={`this week: ${week.filter((d) => d.done).length} days of study`}>
      <View style={styles.row}>
        {week.map((d, i) => {
          const progress = dayProgress(byDay[d.key] ?? 0, sessionWords, metByDay[d.key] ?? 0);
          // a little done already shines clearly more than nothing
          const shine = progress > 0 ? Math.max(0.2, shineOf(progress)) : 0;
          return (
            <View key={d.key} style={styles.column}>
              <View style={styles.starBox} pointerEvents="none">
                <Canvas style={styles.canvas}>
                  <DayStar cx={GLOW + EDGE} cy={GLOW + EDGE} shine={shine} progress={progress} future={d.future} phase={i * 1.9} />
                </Canvas>
              </View>
              <Text style={[styles.letter, d.today && styles.letterToday]}>{d.letter}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// One day as a star: a crisp round core with a sharp edge and a soft white heart without an edge, and a soft blurred glow round it that fades out
// into the dark (the blur is only at the edges); a day with study twinkles a little, more when it shines more. A day without
// study is dark blue and quiet.
function DayStar({ cx, cy, shine, progress, future, phase }: { cx: number; cy: number; shine: number; progress: number; future: boolean; phase: number }) {
  const clock = useClock();
  const lit = progress > 0;
  const pulse = useDerivedValue(() => (lit ? 0.82 + 0.18 * Math.sin(clock.value / 520 + phase) : 1));
  const dim = future ? 0.3 : 1;
  const core = lit ? ramp(CORE_RAMP, shine, 1) : NONE;
  const halo = lit ? ramp(HALO_RAMP, shine, 1) : NONE;
  const coreR = EDGE; // every day has a core of the same size
  const haloR = coreR + 4 + 9 * shine;
  const c = vec(cx, cy);
  const glow = useDerivedValue(() => dim * (0.25 + 0.65 * shine * shine) * pulse.value);
  return (
    <>
      <Circle c={c} r={haloR} color={halo} opacity={glow}>
        <BlurMask blur={4 + 5 * shine} style="normal" />
      </Circle>
      <Circle c={c} r={coreR} color={core} opacity={dim * (lit ? 1 : 0.75)} />
      {lit ? (
        // the white heart has no edge: it is brightest in the very middle and fades out into the colour of the core
        <Circle c={c} r={coreR * 0.75} opacity={dim * (0.55 + 0.4 * shine)}>
          <RadialGradient c={c} r={coreR * 0.75} colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']} positions={[0, 1]} />
        </Circle>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // a plate like the other cards of the profile; the glow of the stars may reach past it (it is not clipped)
  card: { paddingTop: 20, paddingBottom: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { width: 2 * EDGE, alignItems: 'center', gap: 6 },
  starBox: { width: 2 * EDGE, height: 2 * EDGE },
  canvas: { position: 'absolute', left: -GLOW, top: -GLOW, width: 2 * EDGE + 2 * GLOW, height: 2 * EDGE + 2 * GLOW },
  letter: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  letterToday: { fontFamily: fonts.medium, color: colors.text },
});

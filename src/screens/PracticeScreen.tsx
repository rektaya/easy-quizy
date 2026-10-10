import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { FlipReveal } from '../components/FlipReveal';
import { UndoToast } from '../components/UndoToast';
import { WORDS } from '../data/words';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme';

// Where the circle sits: a little above the middle of the area, as in Explore, but never so high that
// there is no room above it for the plate (undo) and the text under that.
const CIRCLE_LIFT = 52;
/** Room at the very top for the "added to study / undo" plate. */
const PLATE_ZONE = 58;
/** Room for the title and the text under it. */
const TEXT_ZONE = 116;

// The first word (Feierabend) on a screen of its own, only to teach the one gesture: no counter, no
// test. The rating is not saved; it is just a practice. After it, the screen says what was learned and
// labels the small things around the circle (undo, flipping the word).
export default function PracticeScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { name } = useProfile();
  const word = WORDS[0];
  const [value, setValue] = useState<number | null>(null);
  const [body, setBody] = useState({ w: 0, h: 0 });

  // as big as in Explore, unless the phone is short: then it shrinks so the text above and the notes below fit
  const room = body.h - (PLATE_ZONE + TEXT_ZONE + 8) - 90;
  const size = Math.max(220, Math.min(width - 48, 320, room));
  const circleTop = Math.max(PLATE_ZONE + TEXT_ZONE + 8, body.h / 2 - size / 2 - CIRCLE_LIFT);
  const circleLeft = (body.w - size) / 2;
  const rated = value !== null;

  const inside = rated ? <FlipReveal word={word} /> : undefined;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.body} onLayout={(e) => setBody({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {body.h > 0 ? (
          <>
            <View style={[styles.above, { top: PLATE_ZONE, height: Math.max(0, circleTop - 8 - PLATE_ZONE) }]}>
              {rated ? (
                <Animated.View key="done" entering={FadeIn.duration(400)} style={styles.aboveInner}>
                  <Text style={styles.title}>great job!</Text>
                  <Text style={styles.text}>
                    you will explore and study words this way. we encourage you to draw the circle intuitively
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View key="intro" entering={FadeIn.duration(400)} style={styles.aboveInner}>
                  <Text style={styles.title}>{name ? `let’s roll, ${name}` : 'let’s roll'}</Text>
                  <Text style={styles.text}>
                    draw a circle around the word to show how well you know it, from not knowing at all to knowing it well
                  </Text>
                </Animated.View>
              )}
            </View>

            <Circle x={circleLeft} y={circleTop} word={word} size={size} value={value} showHint={!rated} reveal={inside} onCommit={setValue} />

            {rated ? (
              <Animated.View entering={FadeIn.duration(400).delay(300)} style={[styles.notes, { top: circleTop + size + 26 }]}>
                <Text style={styles.note}>↑ you can undo your rating</Text>
                <Text style={styles.note}>tap the word to see it in german and back</Text>
              </Animated.View>
            ) : null}
          </>
        ) : null}
      </View>
      {rated ? <Button label="continue" onPress={onDone} /> : <View style={styles.buttonSpace} />}
      {rated ? (
        <View pointerEvents="box-none" style={[styles.statusTop, { top: insets.top + 12 + 4 }]}>
          <UndoToast message={value >= 0.9 ? 'marked as known' : 'added to study'} onUndo={() => setValue(null)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, userSelect: 'none' },
  body: { flex: 1, marginHorizontal: -24 }, // edge to edge, so drawing works across the whole width
  above: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24, justifyContent: 'flex-end' },
  aboveInner: { alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 38, color: colors.text, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 4 },
  notes: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  note: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  statusTop: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  buttonSpace: { height: 54 },
});

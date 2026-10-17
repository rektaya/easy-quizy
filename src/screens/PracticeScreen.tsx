import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { DONT_KNOW, DontKnowButton, dontKnowTop } from '../components/DontKnowButton';
import { FlipReveal } from '../components/FlipReveal';
import { UNDO_BOTTOM, UndoPlate } from '../components/UndoToast';
import { WORDS } from '../data/words';
import { colors, fonts } from '../theme';

// Where the circle sits: a little above the middle of the area, as in Explore, but never so high that
// there is no room above it for the plate (undo) and the text under that.
const CIRCLE_LIFT = 52;
/** Room at the very top for the "added to study / undo" plate (it sits a little below the progress bar, and the text starts under it). */
const PLATE_ZONE = UNDO_BOTTOM - 12 + 8; // the plate's bottom edge (the body starts 12 below the safe area) and a little air
/** Room for the title and the text under it. */
const TEXT_ZONE = 190;

// The first word (Feierabend) on a screen of its own, only to teach the one gesture: no counter, no
// test. The rating is not saved; it is just a practice. After it, the screen says what was learned and
// labels the small things around the circle (undo, flipping the word).
export default function PracticeScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const word = WORDS[0];
  const [value, setValue] = useState<number | null>(null);
  const [body, setBody] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState(false); // the cross goes away while a circle is being drawn

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
            {/* the text sits in the middle of the space between the plate and the ring, so the two gaps are the same */}
            <View style={[styles.above, { top: PLATE_ZONE, height: Math.max(0, circleTop + 6 - PLATE_ZONE) }]}>
              {rated ? (
                <Animated.View key="done" entering={FadeIn.duration(400)} style={styles.aboveInner}>
                  <Text style={styles.title}>great job!</Text>
                  <Text style={styles.text}>
                    you will explore and study words this way. we encourage you to draw the circle intuitively
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View key="intro" entering={FadeIn.duration(400)} style={styles.aboveInner}>
                  <Text style={styles.title}>let’s begin with your first word</Text>
                  <Text style={styles.text}>
                    rate how well you know the word by drawing a circle around it. if you don’t know it at all, tap the cross
                  </Text>
                </Animated.View>
              )}
            </View>

            <Circle x={circleLeft} y={circleTop} word={word} size={size} value={value} showHint={!rated} reveal={inside} onCommit={setValue} onDrawing={setDrawing} />

            {rated || drawing ? null : <DontKnowButton top={dontKnowTop(circleTop, size, !!word.article)} onPress={() => setValue(DONT_KNOW)} />}
          </>
        ) : null}
      </View>
      {rated ? <Button label="continue" onPress={onDone} /> : <View style={styles.buttonSpace} />}
      {rated ? <UndoPlate message={value >= 0.9 ? 'marked as known' : 'added to study'} onUndo={() => setValue(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, userSelect: 'none' },
  body: { flex: 1, marginHorizontal: -24 }, // edge to edge, so drawing works across the whole width
  above: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24, justifyContent: 'center' },
  aboveInner: { alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 38, color: colors.text, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 4 },
  buttonSpace: { height: 54 },
});

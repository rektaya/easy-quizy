import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/Text';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from '../circle/Circle';
import { Button } from '../components/Button';
import { DONT_KNOW, DontKnowButton, dontKnowTop } from '../components/DontKnowButton';
import { SpeakButton, speakTop } from '../components/SpeakButton';
import { FlipReveal } from '../components/FlipReveal';
import { HEADER_HEIGHT } from '../components/TabHeader';
import { WORDS } from '../data/words';
import { colors, fonts } from '../theme';

// The circle sits exactly where it does in Explore's test (the same distance from the top and bottom of the screen),
// so it does not jump when the practice ends. Explore has a header row above its area and no button below it; here
// there is a button row below and no header, which the formula allows for.
const CIRCLE_LIFT = 52;
/** The row at the bottom (the "continue" button, or the space it takes). */
const BUTTON_ROW = 54;
/** The texts sit in the middle of the space between the line of stars (its bottom edge) and the top of the circle, so the gaps above and below are the same. */
const TEXT_TOP = 24;
/** Room the title and the text under it need above the circle. */
const TEXT_ZONE = 170;
/** After the handle is let go, the ring completes itself again (the answer is taken); only then the screen moves on. */
const SETTLE_MS = 1700; // a little longer than the ring takes to draw itself again (1.4 s)

// The first word (Feierabend) on a screen of its own, only to teach the one gesture, in three moments: draw the
// circle (or tap the cross); the meaning shows and the screen says the answer can be changed by dragging the handle
// (no way on until the handle has been used); then the circle goes and "great job" says how the answers are used.
// The rating is not saved; it is just a practice.
export default function PracticeScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const word = WORDS[0];
  const [value, setValue] = useState<number | null>(null);
  const [first, setFirst] = useState<number | null>(null); // the first answer: the title follows it and stays, whatever the handle does after
  const [adjusted, setAdjusted] = useState(false); // the handle has been used: on to the last moment
  const [body, setBody] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState(false); // the cross goes away while a circle is being drawn
  const [german, setGerman] = useState(false); // after rating: the German word is showing in the circle (the loudspeaker is only there then)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // as big as in Explore, unless the phone is short: then it shrinks so the text above and the notes below fit
  const room = body.h - (TEXT_TOP + TEXT_ZONE + 8) - 90;
  const size = Math.max(220, Math.min(width - 48, 320, room));
  const explorePlace = HEADER_HEIGHT + (body.h + BUTTON_ROW - HEADER_HEIGHT) / 2 - size / 2 - CIRCLE_LIFT; // where Explore's circle is, in this area
  const circleTop = Math.max(TEXT_TOP + TEXT_ZONE + 8, explorePlace);
  const circleLeft = (body.w - size) / 2;
  const rated = value !== null;

  const inside = rated ? <FlipReveal word={word} onShowing={setGerman} /> : undefined;

  const onAdjust = (v: number, final: boolean) => {
    if (!final) return;
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdjusted(true), SETTLE_MS);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.body} onLayout={(e) => setBody({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {body.h > 0 ? (
          adjusted ? (
            // the last moment: the circle is gone, "great job" and how the answers are used
            <Animated.View key="done" entering={FadeIn.duration(500)} style={styles.doneBody}>
              <Text style={styles.title}>great job! you will explore words and study them this way</Text>
              <Text style={styles.text}>words that you don’t remember well will be presented for studying earlier than those you know well</Text>
            </Animated.View>
          ) : (
            <>
              <View style={[styles.above, { top: TEXT_TOP, height: Math.max(0, circleTop - TEXT_TOP - 6) }]}>
                {rated ? (
                  <Animated.View key="adjust" entering={FadeIn.duration(450).delay(450)} exiting={FadeOut.duration(300)} style={styles.aboveInner}>
                    {/* the title follows the first answer only; dragging the handle afterwards does not change it */}
                    <Text style={styles.title}>{(first ?? 0) >= 0.9 ? 'wow, you already know it!' : 'it’s your first word to study!'}</Text>
                    <Text style={styles.text}>
                      if you feel like your initial evaluation was wrong, you can drag the handle and adjust it. try it
                    </Text>
                  </Animated.View>
                ) : (
                  <Animated.View key="intro" entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.aboveInner}>
                    <Text style={styles.title}>let’s begin with your first word</Text>
                    <Text style={styles.text}>
                      rate how well you know the word by drawing a circle around it. if you don’t know it at all, tap the cross
                    </Text>
                  </Animated.View>
                )}
              </View>

              <Animated.View exiting={FadeOut.duration(450)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <Circle
                  x={circleLeft}
                  y={circleTop}
                  word={word}
                  size={size}
                  value={value}
                  showHint={!rated}
                  reveal={inside}
                  onCommit={(v) => {
                    setFirst(v);
                    setValue(v);
                  }}
                  onDrawing={setDrawing}
                  adjust={rated ? { max: 1, onAdjust } : undefined}
                />
                <SpeakButton word={word} top={speakTop(circleTop, size)} visible={!drawing && (!rated || german)} />
                <DontKnowButton
                  top={dontKnowTop(circleTop, size, !!word.article)}
                  visible={!rated && !drawing}
                  onPress={() => {
                    setFirst(DONT_KNOW);
                    setValue(DONT_KNOW);
                  }}
                />
              </Animated.View>
            </>
          )
        ) : null}
      </View>
      {adjusted ? <Button label="continue" onPress={onDone} /> : <View style={styles.buttonSpace} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, userSelect: 'none' },
  body: { flex: 1, marginHorizontal: -24 }, // edge to edge, so drawing works across the whole width
  above: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 24, justifyContent: 'center' },
  // the old text and the new one are laid over each other (not one after the other), so that the one fades out and the other fades in without anything jumping
  aboveInner: { position: 'absolute', left: 24, right: 24, top: 0, bottom: 0, alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  doneBody: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'flex-start', gap: 12, paddingHorizontal: 24 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.text, textAlign: 'left' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'left' },
  buttonSpace: { height: 54 },
});

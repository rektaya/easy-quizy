import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../theme';
import { Plate } from './Plate';

const CLOSE_DISTANCE = 90; // how far down a drag must go to close the sheet
const CLOSE_VELOCITY = 700;

// A panel that slides up from the bottom of the screen over everything (the tab bar too), on a dimmed screen. It
// closes with a tap outside it, or by dragging it down; `onClose` says so and the owner sets `visible` to false (a
// "save" button does the same after saving). It stays mounted until it has slid out.
export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const slide = useSharedValue(height); // how far the sheet is below its place (the whole screen when it is away)
  const drag = useSharedValue(0); // how far the finger has pulled it down
  const scrim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      slide.value = height;
      slide.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
      scrim.value = withTiming(1, { duration: 260 });
    } else {
      scrim.value = withTiming(0, { duration: 220 });
      slide.value = withTiming(height, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pull = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-30, 30])
    .onUpdate((e) => {
      'worklet';
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        drag.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slide.value + drag.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="close" />
        </Animated.View>
        <GestureDetector gesture={pull}>
          <Plate round="card" style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}>
            <View style={styles.grabber} />
            {children}
          </Plate>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: colors.scrim },
  sheet: { paddingTop: 10, paddingHorizontal: 24, gap: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 6 },
});

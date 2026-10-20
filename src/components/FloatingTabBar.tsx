import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { ExploreIcon, MapIcon, ProfileIcon, StudyIcon } from './Icons';

// Space for screens to leave at the bottom so nothing ever sits behind the floating tab bar: the bar's
// own bottom offset and height, measured from the real safe area of the phone, plus breathing room.
const BAR_HEIGHT = 68;
const AIR = 28;
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 4 + BAR_HEIGHT + AIR;
}

/** Runs `onRepress` when the tab you are already on is pressed again: the way back out of whatever is deep in it. */
export function useTabRepress(onRepress: () => void) {
  const navigation = useNavigation<{ addListener: (event: 'tabPress', cb: () => void) => () => void; isFocused: () => boolean }>();
  const latest = React.useRef(onRepress);
  latest.current = onRepress;
  React.useEffect(
    () =>
      navigation.addListener('tabPress', () => {
        if (navigation.isFocused()) latest.current();
      }),
    [navigation],
  );
}

const TILE_W = 62;
const GAP = 6;
const ICONS = { Explore: ExploreIcon, Study: StudyIcon, Map: MapIcon, Profile: ProfileIcon } as const;

// A small floating pill with icon-only tabs; the active tab is a filled tile.
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // the orange tile glides to the tab you pressed instead of jumping
  const at = useSharedValue(state.index);
  React.useEffect(() => {
    at.value = withSpring(state.index, { damping: 18, stiffness: 190, mass: 0.9 });
  }, [state.index, at]);
  const glide = useAnimatedStyle(() => ({ transform: [{ translateX: at.value * (TILE_W + GAP) }] }));
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 4 }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <Animated.View style={[styles.tileActive, styles.glide, glide]} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name as keyof typeof ICONS];
          const label = descriptors[route.key].options.title ?? route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={styles.tile}
            >
              <Icon color={focused ? colors.onAccent : colors.text} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    gap: GAP,
    padding: 6,
    borderRadius: 24,
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  tile: {
    width: TILE_W,
    height: 50,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileActive: { backgroundColor: colors.accent, borderRadius: radius.tile },
  glide: { position: 'absolute', left: 6, top: 6, width: TILE_W, height: 50 },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// The user's avatar: their initial in a small round badge with an orange rim. Tapping it opens the profile.
export function Avatar({ name, size = 34, onPress }: { name: string; size?: number; onPress?: () => void }) {
  const initial = (name.trim()[0] ?? '·').toUpperCase();
  const body = (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.46 }]}>{initial}</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="profile and settings">
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  initial: { fontFamily: fonts.medium, color: colors.text },
});

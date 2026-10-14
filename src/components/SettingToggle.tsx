import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// One setting that is on or off: a title, a line that explains it, and a switch.
export function SettingToggle({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.accent }} accessibilityLabel={title} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
});

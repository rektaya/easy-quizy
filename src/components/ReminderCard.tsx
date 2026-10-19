import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { askForPermission } from '../notifications/reminders';
import { useProfile } from '../state/profile';
import { colors, fonts, radius } from '../theme';
import { Button } from './Button';

const pad = (n: number) => String(n).padStart(2, '0');

// The daily reminder: a switch, and (when it is on) the time of day and a "save" button. Nothing is set until
// the user presses "save" (turning it off is immediate). Turning the switch on is the moment the phone's
// permission is asked. Used on the profile screen and on the "nicely done" screen.
export function ReminderCard() {
  const { reminder, setReminder } = useProfile();
  // what the user is choosing now, before it is saved
  const [on, setOn] = useState(reminder.on);
  const [hour, setHour] = useState(reminder.hour);
  const [minute, setMinute] = useState(reminder.minute);
  useEffect(() => {
    setOn(reminder.on);
    setHour(reminder.hour);
    setMinute(reminder.minute);
  }, [reminder.on, reminder.hour, reminder.minute]);

  const toggle = async (next: boolean) => {
    if (!next) {
      setOn(false);
      setReminder({ on: false, asked: true });
      return;
    }
    const granted = await askForPermission();
    if (granted) {
      setOn(true);
      return;
    }
    setOn(false);
    setReminder({ on: false, asked: true });
    Alert.alert('notifications are off', 'to get a reminder, allow notifications for this app in your iPhone settings.', [
      { text: 'not now', style: 'cancel' },
      { text: 'open settings', onPress: () => Linking.openSettings() },
    ]);
  };

  const changed = on && (!reminder.on || reminder.hour !== hour || reminder.minute !== minute);
  const time = new Date();
  time.setHours(hour, minute, 0, 0);

  return (
    <Animated.View layout={LinearTransition.duration(240)} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>daily reminder</Text>
          <Text style={styles.rowSub}>
            {reminder.on ? `every day at ${pad(reminder.hour)}:${pad(reminder.minute)}, only when your words are ready to be practiced` : 'a quiet nudge, only when your words are ready to be practiced'}
          </Text>
        </View>
        <Switch value={on} onValueChange={toggle} trackColor={{ false: colors.border, true: colors.accent }} accessibilityLabel="daily reminder" />
      </View>
      {on ? (
        <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)} style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowTitle}>remind me at</Text>
          <DateTimePicker
            value={time}
            mode="time"
            display="compact"
            themeVariant="dark"
            onChange={(_, d) => {
              if (d) {
                setHour(d.getHours());
                setMinute(d.getMinutes());
              }
            }}
          />
        </Animated.View>
      ) : null}
      {changed ? (
        <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)} style={styles.save}>
          <Button label="save" onPress={() => setReminder({ on: true, hour, minute, asked: true })} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16 },
  rowBorder: { borderTopWidth: 1.5, borderTopColor: colors.border },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  save: { paddingHorizontal: 16, paddingBottom: 16 },
});

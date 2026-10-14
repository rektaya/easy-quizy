import React from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { askForPermission } from '../notifications/reminders';
import { useProfile } from '../state/profile';
import { colors, fonts, radius } from '../theme';

// The daily reminder: a switch, and (when it is on) the time of day. Turning it on is the moment the phone's
// permission is asked. Used on the profile screen and on the "nicely done" screen.
export function ReminderCard() {
  const { reminder, setReminder } = useProfile();

  const toggle = async (on: boolean) => {
    if (!on) {
      setReminder({ on: false, asked: true });
      return;
    }
    const granted = await askForPermission();
    setReminder({ on: granted, asked: true });
    if (!granted) {
      Alert.alert('notifications are off', 'to get a reminder, allow notifications for this app in your iPhone settings.', [
        { text: 'not now', style: 'cancel' },
        { text: 'open settings', onPress: () => Linking.openSettings() },
      ]);
    }
  };

  const time = new Date();
  time.setHours(reminder.hour, reminder.minute, 0, 0);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>daily reminder</Text>
          <Text style={styles.rowSub}>a quiet nudge, only when your words are ready</Text>
        </View>
        <Switch
          value={reminder.on}
          onValueChange={toggle}
          trackColor={{ false: colors.border, true: colors.accent }}
          accessibilityLabel="daily reminder"
        />
      </View>
      {reminder.on ? (
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowTitle}>remind me at</Text>
          <DateTimePicker
            value={time}
            mode="time"
            display="compact"
            themeVariant="dark"
            onChange={(_, d) => {
              if (d) setReminder({ hour: d.getHours(), minute: d.getMinutes() });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16 },
  rowBorder: { borderTopWidth: 1.5, borderTopColor: colors.border },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
});

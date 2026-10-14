import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { reminderText } from './schedule';
import type { ReminderPlan } from './schedule';

// The phone side of the daily reminder (the thinking is in schedule.ts). Local notifications only: they
// work in Expo Go and need no server. Nothing happens on the web.

/** While the app is open the reminder stays quiet: the user is already here. */
export function setupNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks the user's permission (once; later it can only be changed in the phone's settings). */
export async function askForPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  return next.granted;
}

/** Replaces whatever was scheduled with this one reminder (or with none). */
export async function applyReminder(plan: ReminderPlan | null) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!plan) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const { title, body } = reminderText(plan.count);
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(plan.at) },
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "norovia.dailyNotificationIds";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface ScheduleConfig {
  key: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

const DAILY_REMINDERS: ScheduleConfig[] = [
  {
    key: "morning",
    hour: 8,
    minute: 0,
    title: "Good morning 🌅",
    body: "How did you sleep? Tap to log last night's rest.",
  },
  {
    key: "midday",
    hour: 12,
    minute: 0,
    title: "Midday check-in 💙",
    body: "How are you feeling? Take a moment to log your symptoms.",
  },
  {
    key: "evening",
    hour: 21,
    minute: 0,
    title: "Evening check-in 🌙",
    body: "End-of-day log — how has today been for you?",
  },
];

async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminders", {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function scheduleReminders(): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const savedIds: Record<string, string> = stored ? JSON.parse(stored) : {};

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));

  const allPresent = DAILY_REMINDERS.every(
    (r) => savedIds[r.key] && scheduledIds.has(savedIds[r.key])
  );

  if (allPresent) return;

  await AsyncStorage.removeItem(STORAGE_KEY);

  const newIds: Record<string, string> = {};

  for (const reminder of DAILY_REMINDERS) {
    if (savedIds[reminder.key] && scheduledIds.has(savedIds[reminder.key])) {
      newIds[reminder.key] = savedIds[reminder.key];
      continue;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: "daily-reminders",
      },
    });

    newIds[reminder.key] = id;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
}

export function useNotifications(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const granted = await requestPermissions();
      if (!granted) return;
      await scheduleReminders();
    })();
  }, [enabled]);
}

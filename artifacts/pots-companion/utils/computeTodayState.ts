import { type TodayState } from "@/context/DailyContext";

export function computeTodayState(params: {
  sleepHours: number | null;
  sleepAwakenings: number | null;
  maxSymptom: number;
  avgSymptom: number;
  energy: number;
}): TodayState {
  const { sleepHours, sleepAwakenings, maxSymptom, avgSymptom, energy } = params;
  const effectiveSleep = sleepHours !== null
    ? Math.max(0, sleepHours - (sleepAwakenings ?? 0) * 0.25)
    : 6;

  if (effectiveSleep < 4) return "take-it-easy";
  if (maxSymptom >= 8 || avgSymptom >= 6) return "take-it-easy";
  if (effectiveSleep < 6) return "mindful";
  if (maxSymptom >= 6 || energy <= 4 || avgSymptom >= 4) return "mindful";
  return "steady";
}

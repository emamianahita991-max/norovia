import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export type TodayState = "take-it-easy" | "mindful" | "steady";

export type Entry = {
  date: number;
  energy: number;
  dizziness: number;
  brainFog: number;
  fatigue: number;
  avgSymptom: number;
  maxSymptom: number;
  waterLiters: number;
  salt: boolean;
  compression: boolean;
  movement: boolean;
  sleepHours: number | null;
  sleepAwakenings: number | null;
  observation?: string;
};

export type VitalReading = {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  context: "seated" | "standing" | "other";
  timestamp: number;
};

type PendingSleep = {
  score: number;
  hours: number;
  awakenings: number;
  bedHour?: number;
  bedMinute?: number;
  wakeHour?: number;
  wakeMinute?: number;
} | null;

type DailyState = {
  isReady: boolean;
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  entries: Entry[];
  vitalsReadings: VitalReading[];
  pendingSleep: PendingSleep;
  isFlareActive: boolean;
  onboardingComplete: boolean;
  lockedTodayState: TodayState | null;
  waterHistory: number[];
  waterLiters: number;
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
  setPendingSleep: (data: PendingSleep) => void;
  addEntry: (entry: Entry) => void;
  addVitalReading: (reading: VitalReading) => void;
  setFlareActive: (v: boolean) => void;
  completeOnboarding: () => void;
  lockTodayState: (s: TodayState | null) => void;
  addWater: (inc: number) => void;
  undoWater: () => void;
  resetAll: () => Promise<void>;
};

type PersistedDailyState = {
  dayKey: string;
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  entries: Entry[];
  vitalsReadings: VitalReading[];
  pendingSleep: PendingSleep;
  isFlareActive: boolean;
  onboardingComplete: boolean;
  lockedTodayState: TodayState | null;
  waterHistory: number[];
};

const STORAGE_KEY = "norovia.daily.v1";

function getDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DailyContext = createContext<DailyState>({
  isReady: false,
  sleepLoggedToday: false,
  checkInCompletedToday: false,
  entries: [],
  vitalsReadings: [],
  pendingSleep: null,
  isFlareActive: false,
  onboardingComplete: false,
  lockedTodayState: null,
  waterHistory: [],
  waterLiters: 0,
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
  setPendingSleep: () => {},
  addEntry: () => {},
  addVitalReading: () => {},
  setFlareActive: () => {},
  completeOnboarding: () => {},
  lockTodayState: () => {},
  addWater: () => {},
  undoWater: () => {},
  resetAll: async () => {},
});

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [sleepLoggedToday, setSleepLogged] = useState(false);
  const [checkInCompletedToday, setCheckInCompleted] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vitalsReadings, setVitalsReadings] = useState<VitalReading[]>([]);
  const [pendingSleep, setPendingSleep] = useState<PendingSleep>(null);
  const [isFlareActive, setFlareActive] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [lockedTodayState, setLockedTodayState] = useState<TodayState | null>(null);
  const [waterHistory, setWaterHistory] = useState<number[]>([]);

  const waterLiters = parseFloat(waterHistory.reduce((a, b) => a + b, 0).toFixed(2));

  const activeDayKeyRef = useRef<string>(getDayKey());

  function resetForNewDay() {
    activeDayKeyRef.current = getDayKey();
    setSleepLogged(false);
    setCheckInCompleted(false);
    setPendingSleep(null);
    setFlareActive(false);
    setLockedTodayState(null);
    setWaterHistory([]);
  }

  useEffect(() => {
    function checkDayRollover() {
      if (getDayKey() !== activeDayKeyRef.current) {
        resetForNewDay();
      }
    }

    const interval = setInterval(checkDayRollover, 60_000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkDayRollover();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const safetyTimer = setTimeout(() => {
      if (active && !isReady) setIsReady(true);
    }, 1000);

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !active) return;

        const saved = JSON.parse(raw) as PersistedDailyState;
        const sameDay = saved.dayKey === getDayKey();

        setEntries(saved.entries ?? []);
        setVitalsReadings(saved.vitalsReadings ?? []);
        setOnboardingComplete(Boolean(saved.onboardingComplete));
        setSleepLogged(sameDay && Boolean(saved.sleepLoggedToday));
        setCheckInCompleted(sameDay && Boolean(saved.checkInCompletedToday));
        setPendingSleep(sameDay ? saved.pendingSleep ?? null : null);
        setFlareActive(sameDay && Boolean(saved.isFlareActive));
        setLockedTodayState(sameDay ? saved.lockedTodayState ?? null : null);
        setWaterHistory(sameDay ? (saved.waterHistory ?? []) : []);
      } catch {
        // storage failure — proceed with defaults
      } finally {
        clearTimeout(safetyTimer);
        if (active) setIsReady(true);
      }
    })();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const payload: PersistedDailyState = {
      dayKey: getDayKey(),
      sleepLoggedToday,
      checkInCompletedToday,
      entries,
      vitalsReadings,
      pendingSleep,
      isFlareActive,
      onboardingComplete,
      lockedTodayState,
      waterHistory,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [
    isReady,
    sleepLoggedToday,
    checkInCompletedToday,
    entries,
    vitalsReadings,
    pendingSleep,
    isFlareActive,
    onboardingComplete,
    lockedTodayState,
    waterHistory,
  ]);

  function completeOnboarding() {
    setOnboardingComplete(true);
  }

  function addEntry(entry: Entry) {
    setEntries((prev) => [...prev, entry]);
  }

  function addVitalReading(reading: VitalReading) {
    setVitalsReadings((prev) => [...prev, reading]);
  }

  function lockTodayState(s: TodayState | null) {
    setLockedTodayState(s);
  }

  function addWater(inc: number) {
    setWaterHistory((prev) => [...prev, inc]);
  }

  function undoWater() {
    setWaterHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }

  async function resetAll() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSleepLogged(false);
    setCheckInCompleted(false);
    setEntries([]);
    setVitalsReadings([]);
    setPendingSleep(null);
    setFlareActive(false);
    setLockedTodayState(null);
    setOnboardingComplete(false);
    setWaterHistory([]);
  }

  return (
    <DailyContext.Provider
      value={{
        isReady,
        sleepLoggedToday,
        checkInCompletedToday,
        entries,
        vitalsReadings,
        pendingSleep,
        setSleepLogged,
        setCheckInCompleted,
        setPendingSleep,
        addEntry,
        addVitalReading,
        isFlareActive,
        setFlareActive,
        onboardingComplete,
        completeOnboarding,
        lockedTodayState,
        lockTodayState,
        waterHistory,
        waterLiters,
        addWater,
        undoWater,
        resetAll,
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

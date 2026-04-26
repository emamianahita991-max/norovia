import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export type TodayState = "take-it-easy" | "mindful" | "steady";

export type Entry = {
  functionScore: number;
  avgSymptom: number;
  dizziness: number;
  fatigue: number;
  waterLiters: number;
  salt: boolean;
  compression: boolean;
  movement: boolean;
  sleepScore: number | null;
  sleepHours: number | null;
  sleepAwakenings: number | null;
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
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
  setPendingSleep: (data: PendingSleep) => void;
  addEntry: (entry: Entry) => void;
  addVitalReading: (reading: VitalReading) => void;
  setFlareActive: (v: boolean) => void;
  completeOnboarding: () => void;
  lockTodayState: (s: TodayState | null) => void;
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
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
  setPendingSleep: () => {},
  addEntry: () => {},
  addVitalReading: () => {},
  setFlareActive: () => {},
  completeOnboarding: () => {},
  lockTodayState: () => {},
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

  const activeDayKeyRef = useRef<string>(getDayKey());

  function resetForNewDay() {
    activeDayKeyRef.current = getDayKey();
    setSleepLogged(false);
    setCheckInCompleted(false);
    setPendingSleep(null);
    setFlareActive(false);
    setLockedTodayState(null);
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
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
  setPendingSleep: (data: PendingSleep) => void;
  addEntry: (entry: Entry) => void;
  addVitalReading: (reading: VitalReading) => void;
  setFlareActive: (v: boolean) => void;
  completeOnboarding: () => void;
};

type PersistedDailyState = {
  dayKey: string;
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  entries: Entry[];
  vitalsReadings: VitalReading[];
  pendingSleep: PendingSleep;
  isFlareActive: boolean;
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
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
  setPendingSleep: () => {},
  addEntry: () => {},
  addVitalReading: () => {},
  setFlareActive: () => {},
  completeOnboarding: () => {},
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

  useEffect(() => {
    let active = true;
    // Safety net: always unblock the app within 1 second even if storage hangs
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
        setSleepLogged(sameDay && Boolean(saved.sleepLoggedToday));
        setCheckInCompleted(sameDay && Boolean(saved.checkInCompletedToday));
        setPendingSleep(sameDay ? saved.pendingSleep ?? null : null);
        setFlareActive(sameDay && Boolean(saved.isFlareActive));
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
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

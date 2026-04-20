import React, { createContext, useContext, useState } from "react";

export type Entry = {
  functionScore: number;
  avgSymptom: number;
  dizziness: number;
  fatigue: number;
  water: boolean;
  compression: boolean;
  movement: boolean;
  sleepScore: number | null;
  sleepHours: number | null;
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
} | null;

type DailyState = {
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  entries: Entry[];
  vitalsReadings: VitalReading[];
  pendingSleep: PendingSleep;
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
  setPendingSleep: (data: PendingSleep) => void;
  addEntry: (entry: Entry) => void;
  addVitalReading: (reading: VitalReading) => void;
};

const DailyContext = createContext<DailyState>({
  sleepLoggedToday: false,
  checkInCompletedToday: false,
  entries: [],
  vitalsReadings: [],
  pendingSleep: null,
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
  setPendingSleep: () => {},
  addEntry: () => {},
  addVitalReading: () => {},
});

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const [sleepLoggedToday, setSleepLogged] = useState(false);
  const [checkInCompletedToday, setCheckInCompleted] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vitalsReadings, setVitalsReadings] = useState<VitalReading[]>([]);
  const [pendingSleep, setPendingSleep] = useState<PendingSleep>(null);

  function addEntry(entry: Entry) {
    setEntries((prev) => [...prev, entry]);
  }

  function addVitalReading(reading: VitalReading) {
    setVitalsReadings((prev) => [...prev, reading]);
  }

  return (
    <DailyContext.Provider
      value={{
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
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

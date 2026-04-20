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

type PendingSleep = {
  score: number;
  hours: number;
} | null;

type DailyState = {
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  entries: Entry[];
  pendingSleep: PendingSleep;
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
  setPendingSleep: (data: PendingSleep) => void;
  addEntry: (entry: Entry) => void;
};

const DailyContext = createContext<DailyState>({
  sleepLoggedToday: false,
  checkInCompletedToday: false,
  entries: [],
  pendingSleep: null,
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
  setPendingSleep: () => {},
  addEntry: () => {},
});

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const [sleepLoggedToday, setSleepLogged] = useState(false);
  const [checkInCompletedToday, setCheckInCompleted] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pendingSleep, setPendingSleep] = useState<PendingSleep>(null);

  function addEntry(entry: Entry) {
    setEntries((prev) => [...prev, entry]);
  }

  return (
    <DailyContext.Provider
      value={{
        sleepLoggedToday,
        checkInCompletedToday,
        entries,
        pendingSleep,
        setSleepLogged,
        setCheckInCompleted,
        setPendingSleep,
        addEntry,
      }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

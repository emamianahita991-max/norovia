import React, { createContext, useContext, useState } from "react";

type DailyState = {
  sleepLoggedToday: boolean;
  checkInCompletedToday: boolean;
  setSleepLogged: (v: boolean) => void;
  setCheckInCompleted: (v: boolean) => void;
};

const DailyContext = createContext<DailyState>({
  sleepLoggedToday: false,
  checkInCompletedToday: false,
  setSleepLogged: () => {},
  setCheckInCompleted: () => {},
});

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const [sleepLoggedToday, setSleepLogged] = useState(false);
  const [checkInCompletedToday, setCheckInCompleted] = useState(false);

  return (
    <DailyContext.Provider
      value={{ sleepLoggedToday, checkInCompletedToday, setSleepLogged, setCheckInCompleted }}
    >
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  return useContext(DailyContext);
}

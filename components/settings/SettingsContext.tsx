"use client";

import * as React from "react";

import {
  defaultCheckInQuestions,
  type CheckInQuestion,
} from "@/lib/check-in-questions";

type Toast = { title: string; message: string };

type SettingsContextValue = {
  questions: CheckInQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<CheckInQuestion[]>>;
  toast: Toast | null;
  setToast: (toast: Toast | null) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

/* PENDING-BACKEND: check-in questions can't be saved yet, so they're kept
   here, above the settings pages, to survive moving between them. */
export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [questions, setQuestions] = React.useState(defaultCheckInQuestions);
  const [toast, setToast] = React.useState<Toast | null>(null);

  return (
    <SettingsContext.Provider
      value={{ questions, setQuestions, toast, setToast }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

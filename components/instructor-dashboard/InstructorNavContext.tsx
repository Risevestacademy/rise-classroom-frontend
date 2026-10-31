"use client";

import * as React from "react";

const InstructorNavContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function InstructorNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <InstructorNavContext.Provider value={{ open, setOpen }}>
      {children}
    </InstructorNavContext.Provider>
  );
}

export function useInstructorNav() {
  const context = React.useContext(InstructorNavContext);
  if (!context) {
    throw new Error("useInstructorNav must be used within InstructorNavProvider");
  }
  return context;
}

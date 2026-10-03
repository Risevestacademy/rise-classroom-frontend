"use client";

import * as React from "react";

const StudentNavContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function StudentNavProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <StudentNavContext.Provider value={{ open, setOpen }}>
      {children}
    </StudentNavContext.Provider>
  );
}

export function useStudentNav() {
  const context = React.useContext(StudentNavContext);
  if (!context) {
    throw new Error("useStudentNav must be used within StudentNavProvider");
  }
  return context;
}

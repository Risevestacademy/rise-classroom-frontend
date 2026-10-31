"use client";

import * as React from "react";

const SidebarNavContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function SidebarNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarNavContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarNavContext.Provider>
  );
}

export function useSidebarNav() {
  const context = React.useContext(SidebarNavContext);
  if (!context) {
    throw new Error("useSidebarNav must be used within SidebarNavProvider");
  }
  return context;
}

"use client";

import * as React from "react";

const AdminNavContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <AdminNavContext.Provider value={{ open, setOpen }}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav() {
  const context = React.useContext(AdminNavContext);
  if (!context) {
    throw new Error("useAdminNav must be used within AdminNavProvider");
  }
  return context;
}

"use client";

import * as React from "react";

/**
 * Whose calendar and live sessions these are. Admins pick from every cohort,
 * track and person; mentors schedule mentorship sessions with their own
 * mentees, since the admin lists are closed to them.
 */
export type CalendarArea = "admin" | "mentor";

const AreaContext = React.createContext<CalendarArea>("admin");

export function CalendarAreaProvider({
  area,
  children,
}: {
  area: CalendarArea;
  children: React.ReactNode;
}) {
  return <AreaContext value={area}>{children}</AreaContext>;
}

export const useCalendarArea = () => React.useContext(AreaContext);

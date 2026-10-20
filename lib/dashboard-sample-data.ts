/**
 * SAMPLE DATA — not real.
 *
 * The student dashboard design has "Upcoming Event" and "Recent Activity"
 * sections, but the backend has no endpoint for either yet. These helpers feed
 * the dashboard so the layout can be built and reviewed against the design.
 *
 * The dashboard only shows this in local development
 * (process.env.NODE_ENV === "development"); deployed builds show empty states.
 
**/

export type SampleEvent = {
  id: string;
  kind: string;
  title: string;
  startsAt: Date;
  accent: "success" | "warning" | "brand";
  live?: boolean;
};

export type SampleActivity = {
  id: string;
  kind: "recording" | "assignment" | "note" | "event";
  title: string;
  subtitle: string;
  minutesAgo: number;
};

const DAY = 60 * 24;

export function getSampleEvents(): SampleEvent[] {
  const now = Date.now();
  const inMinutes = (minutes: number) => new Date(now + minutes * 60_000);

  return [
    {
      id: "event-1",
      kind: "Live class",
      title: "Rise Academy Live Class",
      startsAt: inMinutes(0),
      accent: "success",
      live: true,
    },
    {
      id: "event-2",
      kind: "Rise",
      title: "Town hall Meeting",
      startsAt: inMinutes(3 * DAY),
      accent: "warning",
    },
    {
      id: "event-3",
      kind: "Live class",
      title: "Rise Academy Live Class",
      startsAt: inMinutes(5 * DAY),
      accent: "brand",
    },
  ];
}

export function getSampleActivity(): SampleActivity[] {
  return [
    {
      id: "activity-1",
      kind: "recording",
      title: "New class recording available",
      subtitle: "Design system · Lesson 4",
      minutesAgo: 120,
    },
    {
      id: "activity-2",
      kind: "assignment",
      title: "New assignment available",
      subtitle: "Design system · Lesson 4",
      minutesAgo: 120,
    },
    {
      id: "activity-3",
      kind: "note",
      title: "New note from mentor",
      subtitle: "Mentor",
      minutesAgo: 2 * DAY,
    },
    {
      id: "activity-4",
      kind: "event",
      title: "Design talk with Jagga",
      subtitle: "Design community · Event",
      minutesAgo: 7 * DAY,
    },
    {
      id: "activity-5",
      kind: "event",
      title: "Project feedback received",
      subtitle: "Design system · Lesson 5",
      minutesAgo: 3 * DAY,
    },
    {
      id: "activity-6",
      kind: "event",
      title: "Invitation to collaborate on new project",
      subtitle: "Team Design · Project X",
      minutesAgo: 0,
    },
  ];
}
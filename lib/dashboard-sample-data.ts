/**
 * SAMPLE DATA — not real.
 *
 * The student dashboard design has a "Recent Activity" section, but the
 * backend has no endpoint for it yet. These helpers feed
 * the dashboard so the layout can be built and reviewed against the design.
 *
 * The dashboard only shows this in local development
 * (process.env.NODE_ENV === "development"); deployed builds show empty states.
 
**/

export type SampleActivity = {
  id: string;
  kind: "recording" | "assignment" | "note" | "event";
  title: string;
  subtitle: string;
  minutesAgo: number;
};

const DAY = 60 * 24;

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

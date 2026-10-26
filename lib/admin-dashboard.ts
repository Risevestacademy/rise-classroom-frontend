import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";

/** Platform-wide figures from the admin control tower. */
export type AdminControlTower = {
  overview: {
    totalStudents: number;
    totalMentors: number;
    totalGoals: number;
    totalKpis: number;
    metricsSubmittedThisWeek: number;
  };
  cohorts: {
    id: string;
    name: string;
    studentCount: number;
    metricsSubmissionRate?: number;
    kpiAchievementRate?: number;
  }[];
};

async function getAdminControlTower(cohortId?: string) {
  const { data } = await api.get<Envelope<AdminControlTower>>(
    "/control-tower/admin",
    { query: { cohortId } },
  );
  return data;
}

export type ActivityKind = "assignment" | "lesson" | "mentorship" | "controlTower";

export type DashboardActivity = {
  id: string;
  kind: ActivityKind;
  message: string;
  time: string;
  track: { name: string; key: TrackKey };
};

export type UpcomingActivity = {
  id: string;
  month: string;
  day: string;
  title: string;
  scope: string;
  when: string;
};

/**
 * PENDING-BACKEND: the API has no engagement, health, at-risk, grading queue,
 * activity feed or events data. These figures are placeholders so the
 * dashboard matches the design until it does.
 */
export const dashboardMock = {
  engagement: 86,
  atRisk: { total: 14, newThisWeek: 5 },
  programHealth: 84,
  trackHealth: { design: 91, frontend: 82, backend: 74, mobile: 88 } satisfies Record<
    TrackKey,
    number
  >,
  assignmentsAwaitingGrading: 12,
  recentActivity: [
    {
      id: "a1",
      kind: "assignment",
      message: "Sarah submitted assignment 4",
      time: "10 minutes ago",
      track: { name: "Design", key: "design" },
    },
    {
      id: "a2",
      kind: "lesson",
      message: "Femi completed lesson 8",
      time: "30 minutes ago",
      track: { name: "Frontend", key: "frontend" },
    },
    {
      id: "a3",
      kind: "mentorship",
      message: "Francis attended a mentorship session",
      time: "4 hours ago",
      track: { name: "Mobile Engineering", key: "mobile" },
    },
    {
      id: "a4",
      kind: "controlTower",
      message: "Amina filled her control tower",
      time: "1 day ago",
      track: { name: "Design", key: "design" },
    },
    {
      id: "a5",
      kind: "controlTower",
      message: "Tobi filled in the control tower",
      time: "1 day ago",
      track: { name: "Backend", key: "backend" },
    },
  ] satisfies DashboardActivity[],
  upcoming: [
    {
      id: "u1",
      month: "SEP",
      day: "27",
      title: "Weekly Check-in Deadline",
      scope: "All tracks",
      when: "In 6 hours",
    },
    {
      id: "u2",
      month: "SEP",
      day: "29",
      title: "Town hall meeting",
      scope: "All tracks",
      when: "In 2 days",
    },
    {
      id: "u3",
      month: "OCT",
      day: "02",
      title: "Project Presentation",
      scope: "All tracks",
      when: "In 5 days",
    },
    {
      id: "u4",
      month: "OCT",
      day: "09",
      title: "Demo Day rehearsal",
      scope: "All tracks",
      when: "In 12 days",
    },
  ] satisfies UpcomingActivity[],
};

export type AdminNotification = {
  id: string;
  actor: string;
  avatar?: string;
  message: string;
  time: string;
  unread: boolean;
};

// PENDING-BACKEND: the API has no notifications endpoint.
const mockNotifications: AdminNotification[] = [
  {
    id: "n1",
    actor: "Sarah Okafor",
    message: "submitted Assignment 4 in Design",
    time: "10 minutes ago",
    unread: true,
  },
  {
    id: "n2",
    actor: "Femi Adeyemi",
    message: "accepted the invite and finished onboarding",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "n3",
    actor: "Amina Bello",
    message: "was flagged as at risk in Frontend",
    time: "3 hours ago",
    unread: true,
  },
  {
    id: "n4",
    actor: "Francis Eze",
    message: "booked a mentorship session for Friday",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "n5",
    actor: "Tobi Lawal",
    message: "filled in this week's control tower",
    time: "2 days ago",
    unread: false,
  },
];

export const adminDashboardKeys = {
  controlTower: (cohortId?: string) =>
    ["admin", "control-tower", cohortId] as const,
  notifications: () => ["admin", "notifications"] as const,
};

export const adminDashboardQueries = {
  controlTower: (cohortId?: string) =>
    queryOptions({
      queryKey: adminDashboardKeys.controlTower(cohortId),
      queryFn: () => getAdminControlTower(cohortId),
    }),

  notifications: () =>
    queryOptions({
      queryKey: adminDashboardKeys.notifications(),
      queryFn: async () => mockNotifications,
      // Read state lives in the cache until there's an API to save it, so a
      // refetch must not reset it.
      staleTime: Infinity,
      gcTime: Infinity,
    }),
};

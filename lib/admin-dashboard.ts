import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";

/**
 * Figures from the admin control tower, as the live API returns them (the
 * API docs describe an older shape). `cohortId` only narrows totalStudents;
 * the rest are platform-wide and all-time.
 */
export type AdminControlTower = {
  metricsOverview: {
    totalStudents: number;
    totalActiveMentorships: number;
    totalGoals: number;
    completedGoals: number;
    goalCompletionRate: number;
    totalKpis: number;
    achievedKpis: number;
    inProgressKpis: number;
    kpiAchievementRate: number;
    totalWeeklyMetrics: number;
    submittedMetrics: number;
    reviewedMetrics: number;
  };
  cohorts: {
    id: string;
    name: string;
    year: string;
    _count: { students: number };
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

/** A notification as `/notifications` returns it. */
export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminNotifications = {
  items: AdminNotification[];
  unreadCount: number;
};

/** The latest notifications; the panel has no paging, so it shows one page. */
async function getNotifications(): Promise<AdminNotifications> {
  const { data, metadata } = await api.get<
    Envelope<AdminNotification[]> & { metadata: { unreadCount: number } }
  >("/notifications", { query: { limit: 50 } });
  return { items: data, unreadCount: metadata.unreadCount };
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch("/notifications/read-all");
}

export const adminDashboardKeys = {
  allControlTowers: () => ["admin", "control-tower"] as const,
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
      queryFn: getNotifications,
      staleTime: 60_000,
    }),
};

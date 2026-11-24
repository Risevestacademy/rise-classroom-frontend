import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import { daysUntil, type LiveSession } from "@/lib/live-sessions";
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

/** A live session as a row of the dashboard's Upcoming Activities. */
export function toUpcomingActivity(
  session: LiveSession,
  now: number,
): UpcomingActivity {
  const start = new Date(session.startsAt);
  const minutes = Math.ceil((start.getTime() - now) / 60_000);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: session.timeZone, ...options })
      .format(start);
  let when = daysUntil(session, now);
  if (session.status === "live") when = "Live now";
  else if (minutes <= 0) when = "Starting soon";
  else if (minutes < 60) when = `In ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  else if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60);
    when = `In ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return {
    id: session.id,
    month: part({ month: "short" }).toUpperCase(),
    day: part({ day: "2-digit" }),
    title: session.title,
    scope: session.trackName,
    when,
  };
}

export type UpcomingActivity = {
  id: string;
  month: string;
  day: string;
  title: string;
  scope: string;
  when: string;
};

/**
 * PENDING-BACKEND: the API has no engagement, health, at-risk, grading queue
 * or activity feed data. These figures are placeholders so the
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
};

/** A notification as `/notifications` returns it. */
export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  /** Who caused it, or null for system notifications. */
  actor?: { id: string; name: string; image?: string | null; role: string } | null;
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

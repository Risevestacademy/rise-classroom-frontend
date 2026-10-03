import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";

/**
 * DRAFT is a week still being written. SUBMITTED hands it to the mentor, who
 * moves it on to REVIEWED / COMPLETED — the student can't edit it after that.
 */
export type WeeklyMetricStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "COMPLETED";

/** One week of a student's control tower, as the API stores it. */
export type WeeklyMetric = {
  id: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
  goalSummary: string | null;
  progress: string | null;
  challenges: string | null;
  priorities: string | null;
  // kpis: string | null; // PENDING-BACKEND(kpis)
  // wentWell: string | null; // PENDING-BACKEND(wentWell)
  // doDifferently: string | null; // PENDING-BACKEND(doDifferently)
  /** Written by the mentor when they review the week. */
  mentorMeetingOutcome: string | null;
  mentorFeedback: string | null;
  status: WeeklyMetricStatus;
  createdAt: string;
  updatedAt: string;
};

export type SaveWeeklyMetricInput = {
  weekStart: string;
  weekEnd: string;
  goalSummary?: string;
  progress?: string;
  challenges?: string;
  priorities?: string;
  // kpis?: string; // PENDING-BACKEND(kpis)
  // wentWell?: string; // PENDING-BACKEND(wentWell)
  // doDifferently?: string; // PENDING-BACKEND(doDifferently)
  status: "DRAFT" | "SUBMITTED";
};

/**
 * The mentor's record. Every student seen so far had none (`null`), so these
 * fields are a best guess — read them through `mentorDisplay` rather than
 * directly, so a different shape degrades to a generic label.
 */
export type ControlTowerMentor = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  instructor?: { name?: string; firstName?: string; lastName?: string; email?: string };
  mentor?: { name?: string; firstName?: string; lastName?: string; email?: string };
};

export type StudentControlTower = {
  student: {
    /** The student profile id — what the per-student endpoints are keyed on. */
    id: string;
    userId: string;
    cohortId: string;
    user: { id: string; name: string; email: string };
    cohort: { id: string; name: string };
  };
  mentor: ControlTowerMentor | null;
  goals: unknown[];
  recentWeeklyMetrics: WeeklyMetric[];
};

async function getStudentControlTower() {
  const { data } = await api.get<Envelope<StudentControlTower>>(
    "/control-tower/student"
  );

  return data;
}

async function listWeeklyMetrics(studentProfileId: string) {
  const { data } = await api.get<Envelope<WeeklyMetric[]>>(
    `/weekly-metrics/student/${studentProfileId}`
  );

  return data;
}

/**
 * Creates or updates the week starting at `weekStart` — saving the same week
 * twice updates one record. Fields left out are kept; send "" to clear one.
 */
export async function saveWeeklyMetric(input: SaveWeeklyMetricInput) {
  const { data } = await api.post<Envelope<WeeklyMetric>>(
    "/weekly-metrics",
    input
  );

  return data;
}

export const controlTowerKeys = {
  student: () => ["student", "control-tower"] as const,
  weeklyMetrics: (studentProfileId: string) =>
    ["student", "weekly-metrics", studentProfileId] as const,
};

export const controlTowerQueries = {
  student: () =>
    queryOptions({
      queryKey: controlTowerKeys.student(),
      queryFn: getStudentControlTower,
    }),

  weeklyMetrics: (studentProfileId: string) =>
    queryOptions({
      queryKey: controlTowerKeys.weeklyMetrics(studentProfileId),
      queryFn: () => listWeeklyMetrics(studentProfileId),
      enabled: studentProfileId.length > 0,
    }),
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The Monday-to-Sunday week containing `date`, in UTC — the convention the API
 * uses for `weekStart`. Every save for a week must send the identical
 * `weekStart`, since that's what the API matches records on.
 */
export function weekRangeFor(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // getUTCDay is 0 for Sunday; shift so Monday is the first day.
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));

  const end = new Date(start.getTime() + 7 * DAY_MS - 1);

  return { weekStart: start.toISOString(), weekEnd: end.toISOString() };
}

/** Whole days left before `weekEnd`, counting today. */
export function daysLeftIn(weekEnd: string, now = new Date()) {
  return Math.max(0, Math.ceil((new Date(weekEnd).getTime() - now.getTime()) / DAY_MS));
}

/** "Sep 28 – Oct 4". Formatted in UTC so the dates match the stored week. */
export function formatWeekRange(weekStart: string, weekEnd: string) {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return `${format(weekStart)} – ${format(weekEnd)}`;
}

export function isSameWeek(a: string, b: string) {
  return new Date(a).getTime() === new Date(b).getTime();
}

/** Name and initials for the mentor card, whatever shape the record has. */
export function mentorDisplay(mentor: ControlTowerMentor) {
  const person = mentor.instructor ?? mentor.mentor ?? mentor;
  const name =
    person.name ??
    ([person.firstName, person.lastName].filter(Boolean).join(" ") ||
      "Your mentor");

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return { name, initials, email: person.email };
}

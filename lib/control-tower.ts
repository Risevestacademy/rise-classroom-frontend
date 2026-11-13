import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";

/**
 * DRAFT is a week still being written. Saving from the student's Control Tower
 * sends SUBMITTED; the mentor may move it on to REVIEWED / COMPLETED. The
 * student sees any of the last three as "Completed".
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
  whatWentWell?: string | null;
  whatIWillDoDifferently?: string | null;
  /** The student's notes from their mentor check-in. */
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
  mentorMeetingOutcome?: string;
  // kpis?: string; // PENDING-BACKEND(kpis)
  whatWentWell?: string;
  whatIWillDoDifferently?: string;
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
    /** Start and end dates aren't confirmed in this response; read them defensively. */
    cohort: { id: string; name: string; startDate?: string; endDate?: string };
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
    new Date(value).toLocaleDateString("en-US", {
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

/** "Sep 21–27", or "Jan 28–Feb 3" across months. In UTC to match the stored week. */
export function formatShortWeekRange(weekStart: string, weekEnd: string) {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const month = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });

  const endLabel =
    month(start) === month(end)
      ? String(end.getUTCDate())
      : `${month(end)} ${end.getUTCDate()}`;

  return `${month(start)} ${start.getUTCDate()}–${endLabel}`;
}

/** A saved week the student can still change but no longer needs to finish. */
export function isWeekCompleted(metric?: WeeklyMetric) {
  return metric !== undefined && metric.status !== "DRAFT";
}

export type ControlTowerWeek = {
  /** 1 for the cohort's first week. */
  number: number;
  weekStart: string;
  weekEnd: string;
  metric?: WeeklyMetric;
};

const WEEK_MS = 7 * DAY_MS;

/**
 * This week, plus every earlier week since the cohort started (oldest first),
 * each with whatever the student saved for it. A past week with nothing saved
 * is still listed so it can show as Missed. Without a cohort start date the
 * count starts from the student's first saved week.
 */
export function controlTowerWeeks(
  metrics: WeeklyMetric[],
  cohortStart?: string,
  now = new Date()
): { current: ControlTowerWeek; previous: ControlTowerWeek[] } {
  const weekOf = (date: string | Date) =>
    Date.parse(weekRangeFor(new Date(date)).weekStart);

  const byWeek = new Map(metrics.map((metric) => [weekOf(metric.weekStart), metric]));
  const thisWeek = weekOf(now);
  const first = Math.min(
    thisWeek,
    cohortStart ? weekOf(cohortStart) : Math.min(thisWeek, ...byWeek.keys())
  );

  const weekAt = (start: number): ControlTowerWeek => ({
    number: Math.round((start - first) / WEEK_MS) + 1,
    weekStart: new Date(start).toISOString(),
    weekEnd: new Date(start + WEEK_MS - 1).toISOString(),
    metric: byWeek.get(start),
  });

  const previous: ControlTowerWeek[] = [];
  for (let start = first; start < thisWeek; start += WEEK_MS) {
    previous.push(weekAt(start));
  }

  return { current: weekAt(thisWeek), previous };
}

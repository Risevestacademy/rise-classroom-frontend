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
  /* Legacy names the API keeps in sync with whatWentWell and whatIWillDoDifferently. */
  progress: string | null;
  challenges: string | null;
  whatWentWell?: string | null;
  whatIWillDoDifferently?: string | null;
  priorities: string | null;
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
  whatWentWell?: string;
  whatIWillDoDifferently?: string;
  priorities?: string;
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
  goals: Goal[];
  /* Every KPI the student has, including ones not tied to a goal. */
  kpis?: { summary: KpiSummary; items: Kpi[] };
  /* Every week of the cohort; metricId links a week to the student's saved entry. */
  timeline?: { weekNumber: number; weekStart: string; weekEnd: string; metricId?: string | null }[];
  recentWeeklyMetrics: WeeklyMetric[];
};

export type KpiStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "BEHIND" | "MISSED";

export const kpiStatuses: Record<
  KpiStatus,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "error" }
> = {
  NOT_STARTED: { label: "Not started", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  ACHIEVED: { label: "Achieved", tone: "success" },
  BEHIND: { label: "Behind", tone: "warning" },
  MISSED: { label: "Missed", tone: "error" },
};

/* A measurable target, like "Ship 3 components": target and current values are free text. */
export type Kpi = {
  id: string;
  studentId: string;
  goalId?: string | null;
  name: string;
  description?: string | null;
  targetValue?: string | null;
  currentValue?: string | null;
  unit?: string | null;
  status: KpiStatus;
  /* Worked out by the API, 0 to 100. */
  progress?: number;
  createdAt: string;
  updatedAt: string;
};

export type KpiSummary = {
  totalCount: number;
  achievedCount: number;
  inProgressCount: number;
  behindCount: number;
  missedCount: number;
  achievementRate: number;
};

export type GoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type Goal = {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  longTermGoal?: string | null;
  status: GoalStatus;
  kpis?: Kpi[];
  createdAt: string;
  updatedAt: string;
};

export type GoalInput = {
  title: string;
  description?: string;
  longTermGoal?: string;
  status?: GoalStatus;
};

export type KpiInput = {
  name: string;
  goalId?: string | null;
  targetValue?: string;
  currentValue?: string;
  unit?: string;
  status?: KpiStatus;
};

/* Students load their own; a super admin passes the student's profile id. */
async function getStudentControlTower(studentProfileId?: string) {
  const { data } = await api.get<Envelope<StudentControlTower>>(
    "/control-tower/student",
    { query: { studentProfileId } }
  );

  return data;
}

export async function createGoal(studentProfileId: string, input: GoalInput) {
  const { data } = await api.post<Envelope<Goal>>("/goals", {
    studentProfileId,
    ...input,
  });
  return data;
}

export async function updateGoal(goalId: string, input: Partial<GoalInput>) {
  const { data } = await api.patch<Envelope<Goal>>(`/goals/${goalId}`, input);
  return data;
}

export async function createKpi(studentProfileId: string, input: KpiInput) {
  const { data } = await api.post<Envelope<Kpi>>("/kpis", {
    studentProfileId,
    ...input,
  });
  return data;
}

export async function updateKpi(kpiId: string, input: Partial<KpiInput>) {
  const { data } = await api.patch<Envelope<Kpi>>(`/kpis/${kpiId}`, input);
  return data;
}

export async function deleteKpi(kpiId: string) {
  await api.delete(`/kpis/${kpiId}`);
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

/* One of the signed-in mentor's mentees, from GET /mentors/my-mentees.
   GET /control-tower/mentor has more in it but answers mentors with 403 Forbidden,
   so each mentee's weeks, goals and KPIs are read from their own endpoints. */
export type Mentee = {
  /* The mentorship record. */
  id: string;
  assignedAt: string;
  student: {
    /* The student profile id. */
    id: string;
    cohort?: { id: string; name: string } | null;
    user: { id: string; name: string; email: string };
  };
};

async function listMyMentees() {
  const { data } = await api.get<Envelope<Mentee[]>>("/mentors/my-mentees");
  return data;
}

/* The same counts the API's own KPI summaries give. */
export function summarizeKpis(kpis: Kpi[]): KpiSummary {
  const count = (status: KpiStatus) => kpis.filter((kpi) => kpi.status === status).length;
  const achievedCount = count("ACHIEVED");
  return {
    totalCount: kpis.length,
    achievedCount,
    inProgressCount: count("IN_PROGRESS"),
    behindCount: count("BEHIND"),
    missedCount: count("MISSED"),
    achievementRate: kpis.length ? Math.round((achievedCount / kpis.length) * 100) : 0,
  };
}

/* The most recent week a student has saved, if any. */
export function latestWeek(metrics: WeeklyMetric[] | undefined) {
  return [...(metrics ?? [])].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
}

/* A mentee's goals, each with its KPIs. Mentors and super admins can read any student's. */
async function listStudentGoals(studentProfileId: string) {
  const { data } = await api.get<Envelope<Goal[]>>(`/goals/student/${studentProfileId}`);
  return data;
}

async function listStudentKpis(studentProfileId: string) {
  const { data } = await api.get<Envelope<Kpi[]>>(`/kpis/student/${studentProfileId}`);
  return data;
}

/* A week moves DRAFT → SUBMITTED → REVIEWED → COMPLETED. */
export type WeeklyMetricReview = {
  status: WeeklyMetricStatus;
  mentorMeetingOutcome?: string;
  mentorFeedback?: string;
};

export async function reviewWeeklyMetric(metricId: string, review: WeeklyMetricReview) {
  const { data } = await api.patch<Envelope<WeeklyMetric>>(
    `/weekly-metrics/${metricId}/review`,
    review
  );

  return data;
}

export const controlTowerKeys = {
  student: () => ["student", "control-tower"] as const,
  /* A student's Control Tower as a super admin sees it. */
  forStudent: (studentProfileId: string) =>
    ["admin", "control-tower", studentProfileId] as const,
  weeklyMetrics: (studentProfileId: string) =>
    ["student", "weekly-metrics", studentProfileId] as const,
  mentees: () => ["mentor", "mentees"] as const,
  /* Goals and KPIs sit under one key so a change to either refreshes both. */
  goalsAndKpis: (studentProfileId: string) =>
    ["mentor", "goals-and-kpis", studentProfileId] as const,
};

export const controlTowerQueries = {
  student: () =>
    queryOptions({
      queryKey: controlTowerKeys.student(),
      queryFn: () => getStudentControlTower(),
    }),

  forStudent: (studentProfileId: string) =>
    queryOptions({
      queryKey: controlTowerKeys.forStudent(studentProfileId),
      queryFn: () => getStudentControlTower(studentProfileId),
      enabled: studentProfileId.length > 0,
    }),

  weeklyMetrics: (studentProfileId: string) =>
    queryOptions({
      queryKey: controlTowerKeys.weeklyMetrics(studentProfileId),
      queryFn: () => listWeeklyMetrics(studentProfileId),
      enabled: studentProfileId.length > 0,
    }),

  mentees: () =>
    queryOptions({
      queryKey: controlTowerKeys.mentees(),
      queryFn: listMyMentees,
    }),

  goals: (studentProfileId: string) =>
    queryOptions({
      queryKey: [...controlTowerKeys.goalsAndKpis(studentProfileId), "goals"] as const,
      queryFn: () => listStudentGoals(studentProfileId),
      enabled: studentProfileId.length > 0,
    }),

  kpis: (studentProfileId: string) =>
    queryOptions({
      queryKey: [...controlTowerKeys.goalsAndKpis(studentProfileId), "kpis"] as const,
      queryFn: () => listStudentKpis(studentProfileId),
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

/** "Sep 28 – Oct 4". Formatted in UTC so the dates match the stored week, and in
    en-US so it reads the same on every machine (en-GB would give "28 Sept"). */
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

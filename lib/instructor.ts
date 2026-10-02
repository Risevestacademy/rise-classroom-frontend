import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { OnboardingStatus, UserStatus } from "@/lib/auth";
import type { Cohort, Track } from "@/lib/admin";

export type WeeklyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "OVERDUE";

/** An instructor's assignment to one track within one cohort. */
export type InstructorTrack = {
  id: string;
  instructorId: string;
  trackId: string;
  cohortId: string;
  track: Track;
  cohort?: Cohort;
};

export type InstructorStudent = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    onboardingStatus: OnboardingStatus;
  };
};

export type WeeklyTask = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: WeeklyTaskStatus;
  submissionLink?: string | null;
  submittedAt?: string | null;
  isLate: boolean;
  reviewedAt?: string | null;
  feedback?: string | null;
  topic?: { id: string; title?: string } | null;
};

export type WeeklyTaskFilters = {
  cohortId?: string;
  trackId?: string;
  studentId?: string;
  status?: WeeklyTaskStatus;
  week?: string;
  page?: number;
  limit?: number;
};

async function listMyTracks() {
  const { data } = await api.get<Envelope<InstructorTrack[]>>(
    "/instructor/tracks"
  );

  return data;
}

async function listStudents(params: { cohortId?: string; trackId?: string }) {
  const { data } = await api.get<Envelope<InstructorStudent[]>>(
    "/instructor/students",
    { query: params }
  );

  return data;
}

async function listWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { data } = await api.get<Envelope<Paginated<WeeklyTask>>>(
    "/instructor/weekly-tasks",
    { query: filters }
  );

  return data;
}

/** Number of matching tasks, without pulling a full page of rows. */
async function countWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { total } = await listWeeklyTasks({ ...filters, limit: 1 });
  return total;
}

export const instructorKeys = {
  myTracks: () => ["instructor", "tracks"] as const,
  students: (params: { cohortId?: string; trackId?: string }) =>
    ["instructor", "students", params] as const,
  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", filters] as const,
  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", "count", filters] as const,
};

export const instructorQueries = {
  // Track assignments change rarely, so they can stay cached longer.
  myTracks: () =>
    queryOptions({
      queryKey: instructorKeys.myTracks(),
      queryFn: listMyTracks,
      staleTime: 5 * 60_000,
    }),

  students: (params: { cohortId?: string; trackId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.students(params),
      queryFn: () => listStudents(params),
      enabled: Boolean(params.trackId || params.cohortId),
    }),

  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTasks(filters),
      queryFn: () => listWeeklyTasks(filters),
    }),

  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTaskCount(filters),
      queryFn: () => countWeeklyTasks(filters),
    }),
};

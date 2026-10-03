import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { WeeklyTask, WeeklyTaskStatus } from "@/lib/instructor";

/** One track the student is enrolled on, with how far through it they are. */
export type TrackProgress = {
  enrollmentId: string;
  status: "ENROLLED";
  enrolledAt: string;
  track: { id: string; name: string; description: string };
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
  currentTopic: { id: string; title: string; position?: number } | null;
  currentLesson: { id: string; title: string; position?: number | null } | null;
  trackComplete: boolean;
};

export type StudentWeeklyTaskFilters = {
  status?: WeeklyTaskStatus;
  /** `"current"` limits the list to this week. */
  week?: string;
  page?: number;
  limit?: number;
};

async function getMyProgress() {
  const { data } = await api.get<Envelope<TrackProgress[]>>(
    "/student/me/progress"
  );

  return data;
}

async function listMyWeeklyTasks(filters: StudentWeeklyTaskFilters = {}) {
  const { data } = await api.get<Envelope<Paginated<WeeklyTask>>>(
    "/student/weekly-tasks",
    { query: filters }
  );

  return data;
}

export const studentQueries = {
  progress: () =>
    queryOptions({
      queryKey: ["student", "progress"] as const,
      queryFn: getMyProgress,
    }),

  weeklyTasks: (filters: StudentWeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: ["student", "weekly-tasks", filters] as const,
      queryFn: () => listMyWeeklyTasks(filters),
    }),
};

import { queryOptions } from "@tanstack/react-query";

import type { CurriculumRecord } from "@/features/curriculum/types";
import type { AdminUser } from "@/lib/admin";
import { api, ApiError, type Envelope } from "@/lib/api";

export const trackColors = [
  "#e5f2e5",
  "#e5edf7",
  "#fdeafc",
  "#fff4d6",
  "#efe5f8",
  "#e2fbfa",
] as const;

const trackTextColors: Record<(typeof trackColors)[number], string> = {
  "#e5f2e5": "#2e7d32",
  "#e5edf7": "#2563a8",
  "#fdeafc": "#960b93",
  "#fff4d6": "#8A6100",
  "#efe5f8": "#600baa",
  "#e2fbfa": "#087c77",
};

export function getTrackColor(trackName: string) {
  let hash = 0;

  for (let i = 0; i < trackName.length; i++) {
    hash = (hash * 31 + trackName.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % trackColors.length;
  const backgroundColor = trackColors[index];
  const textColor = trackTextColors[backgroundColor];
  return {
    backgroundColor,
    textColor: textColor,
  };
}
/* ------------------------------------------------- track cards and page */

/** The track's curriculum in one cohort, or null when it has none there yet. */
async function getCohortCurriculum(trackId: string, cohortId: string) {
  const { data } = await api.get<Envelope<CurriculumRecord[]>>(
    `/admin/tracks/${trackId}/curriculums`,
  );
  return data.find((curriculum) => curriculum.cohortId === cohortId) ?? null;
}

export type StudentTrackProgress = {
  userId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  /** Their progress couldn't be loaded; left out of the average. */
  unknown?: boolean;
};

/* Every track's progress requests share one queue, so a page of track cards
   stays under the API's rate limit. */
const MAX_PARALLEL = 3;
let running = 0;
const queue: (() => void)[] = [];

async function queued<T>(work: () => Promise<T>) {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => queue.push(resolve));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    queue.shift()?.();
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* Asks again after a pause when the API says it's had too many requests. */
async function withRateLimitRetry<T>(work: () => Promise<T>, attempts = 3) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await queued(work);
    } catch (error) {
      const limited = error instanceof ApiError && error.status === 429;
      if (!limited || attempt >= attempts) throw error;
      await wait(2000 * 2 ** attempt);
    }
  }
}

async function getStudentProgress(
  userId: string,
  trackId: string,
  cohortId: string,
  signal?: AbortSignal,
): Promise<StudentTrackProgress> {
  try {
    const { data } = await withRateLimitRetry(() => {
      // A list that's no longer wanted stops asking, so it doesn't spend the API's limit.
      signal?.throwIfAborted();
      return api.get<Envelope<AdminUser>>(`/admin/users/${userId}`, { signal });
    });
    const progress = (data.studentProfile ?? [])
      .filter((membership) => membership.cohort?.id === cohortId)
      .flatMap((membership) => membership.enrollment ?? [])
      .find((enrollment) => enrollment.track?.id === trackId)?.progress;
    return {
      userId,
      completedLessons: progress?.completedLessons ?? 0,
      totalLessons: progress?.totalLessons ?? 0,
      percentage: progress?.percentage ?? 0,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    // One student failing shouldn't hide the rest of the track's progress.
    return { userId, completedLessons: 0, totalLessons: 0, percentage: 0, unknown: true };
  }
}

/**
 * Each student's lessons completed on the track in this cohort. Fails only
 * when none of them could be loaded.
 * PENDING-BACKEND: progress only comes with a single user, so this asks once
 * per student.
 */
async function listStudentProgress(
  trackId: string,
  cohortId: string,
  userIds: readonly string[],
  signal?: AbortSignal,
) {
  const rows = await Promise.all(
    userIds.map((userId) => getStudentProgress(userId, trackId, cohortId, signal)),
  );
  if (rows.length > 0 && rows.every((row) => row.unknown)) {
    throw new Error("Couldn't load the students' progress.");
  }
  return rows;
}

/** The students' average progress, each student counting the same. */
export function averageProgress(rows: readonly StudentTrackProgress[]) {
  const known = rows.filter((row) => !row.unknown);
  if (known.length === 0) return 0;
  return Math.round(known.reduce((sum, row) => sum + row.percentage, 0) / known.length);
}

/* Not under the tracks key: renaming a track shouldn't reload every student's progress. */
const statsKey = ["admin", "track-stats"] as const;

export const trackQueries = {
  curriculum: (trackId: string, cohortId: string) =>
    queryOptions({
      queryKey: [...statsKey, "curriculum", trackId, cohortId] as const,
      queryFn: () => getCohortCurriculum(trackId, cohortId),
      staleTime: 5 * 60_000,
    }),

  progress: (trackId: string, cohortId: string, userIds: readonly string[]) =>
    queryOptions({
      queryKey: [
        ...statsKey,
        "progress",
        trackId,
        cohortId,
        [...userIds].sort(),
      ] as const,
      queryFn: ({ signal }) => listStudentProgress(trackId, cohortId, userIds, signal),
      // One request per student and a 300-per-15-minutes API limit, so it's
      // kept for a while once loaded.
      staleTime: 30 * 60_000,
      gcTime: 30 * 60_000,
    }),
};

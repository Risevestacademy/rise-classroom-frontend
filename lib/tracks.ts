import { queryOptions } from "@tanstack/react-query";

import type { CurriculumRecord } from "@/features/curriculum/types";
import type { AdminUser } from "@/lib/admin";
import { api, type Envelope } from "@/lib/api";

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
};

/* Runs `work` over the items a few at a time, so a long list doesn't flood the API. */
async function inBatches<T, R>(
  items: readonly T[],
  size: number,
  work: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += size) {
    results.push(...(await Promise.all(items.slice(start, start + size).map(work))));
  }
  return results;
}

/**
 * Each student's lessons completed on the track in this cohort.
 * PENDING-BACKEND: progress only comes with a single user, so this asks once
 * per student.
 */
async function listStudentProgress(
  trackId: string,
  cohortId: string,
  userIds: readonly string[],
) {
  return inBatches(userIds, 6, async (userId): Promise<StudentTrackProgress> => {
    const { data } = await api.get<Envelope<AdminUser>>(`/admin/users/${userId}`);
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
  });
}

/** The students' average progress, each student counting the same. */
export function averageProgress(rows: readonly StudentTrackProgress[]) {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length);
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
      queryFn: () => listStudentProgress(trackId, cohortId, userIds),
      staleTime: 5 * 60_000,
    }),
};

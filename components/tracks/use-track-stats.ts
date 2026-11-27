"use client";

import { useQuery } from "@tanstack/react-query";

import type { CohortDetail } from "@/lib/cohorts";
import { averageProgress, trackQueries } from "@/lib/tracks";

/**
 * One track's people and figures in a cohort, worked out from the cohort's
 * own data (which the cohort page shares) plus the track's curriculum and its
 * students' progress. Counts are null until they've loaded; with no cohort
 * picked, there's nothing to count.
 */
export function useTrackStats(
  trackId: string,
  cohortId: string | undefined,
  cohort: CohortDetail | undefined,
) {
  const students = cohort?.studentList.filter((s) => s.trackIds.includes(trackId)) ?? [];
  const instructors = cohort?.instructorList.filter((i) => i.trackId === trackId) ?? [];
  const known = !cohortId || Boolean(cohort);

  const curriculum = useQuery({
    ...trackQueries.curriculum(trackId, cohortId ?? ""),
    enabled: Boolean(cohortId),
  });
  const progress = useQuery({
    ...trackQueries.progress(trackId, cohortId ?? "", students.map((s) => s.user.id)),
    enabled: Boolean(cohortId && cohort),
  });

  return {
    students,
    instructors,
    studentCount: known ? students.length : null,
    instructorCount: known ? instructors.length : null,
    pendingInvites: known
      ? students.filter((s) => s.onboardingStatus === "INVITED").length
      : null,
    curriculum: cohortId ? curriculum.data : null,
    /** "--" when the track has no curriculum in this cohort yet. */
    lessons: !cohortId
      ? "--"
      : curriculum.isPending
        ? null
        : (curriculum.data?.totalLessons ?? "--"),
    progressRows: progress.data,
    /** Undefined when it couldn't be loaded. */
    progress: !cohortId
      ? 0
      : progress.isError
        ? undefined
        : progress.data
          ? averageProgress(progress.data)
          : null,
  };
}

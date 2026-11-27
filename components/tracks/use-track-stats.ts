"use client";

import { useQuery } from "@tanstack/react-query";

import type { CohortDetail } from "@/lib/cohorts";
import { averageProgress, trackQueries } from "@/lib/tracks";

/**
 * One track's people and figures in a cohort, worked out from the cohort's
 * own data (which the cohort page shares) plus the track's curriculum and its
 * students' progress. Counts are null until they've loaded; with no cohort
 * picked, there's nothing to count.
 *
 * Progress costs one request per student, so only the track's page loads it
 * (`loadProgress`); elsewhere it's read from the cache if that page was opened.
 */
export function useTrackStats(
  trackId: string,
  cohortId: string | undefined,
  cohort: CohortDetail | undefined,
  { loadProgress = false } = {},
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
    enabled: loadProgress && Boolean(cohortId && cohort) && students.length > 0,
  });
  const nobodyToCount = !cohortId || (Boolean(cohort) && students.length === 0);

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
    progressRows: nobodyToCount ? [] : progress.data,
    /** Not loaded here, and not opened on the track's page yet. */
    progressNotLoaded: !nobodyToCount && !loadProgress && !progress.data,
    /** Undefined when it couldn't be loaded, or isn't loaded here. */
    progress: nobodyToCount
      ? 0
      : progress.data
        ? averageProgress(progress.data)
        : progress.isError || !loadProgress
          ? undefined
          : null,
  };
}

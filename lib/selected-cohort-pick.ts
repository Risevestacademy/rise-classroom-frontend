/*
 * The admin's picked cohort is kept in a cookie so the server can render
 * cohort-scoped pages with it. Shared by `selected-cohort.ts` (browser) and
 * the server pages, so there is no "use client" here.
 */

export const SELECTED_COHORT_COOKIE = "rise.admin.selectedCohortId";

/**
 * The cohort with `storedId`, or the first ongoing cohort (then the first
 * one) when nothing was picked yet or the picked one no longer exists.
 */
export function pickCohort<T extends { id: string; status: string }>(
  cohorts: readonly T[],
  storedId: string,
) {
  return (
    cohorts.find((c) => c.id === storedId) ??
    cohorts.find((c) => c.status === "ONGOING") ??
    cohorts[0]
  );
}

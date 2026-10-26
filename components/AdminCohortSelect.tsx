"use client";

import { SelectInput } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { setSelectedCohortId, useSelectedCohort } from "@/lib/selected-cohort";

/**
 * Picks the cohort the admin area works with.
 * Students, instructors, tracks, curriculum and the dashboard follow it.
 * PENDING-BACKEND: the calendar has no events API to scope.
 */
export function AdminCohortSelect() {
  const { cohort, cohorts, cohortsQuery } = useSelectedCohort();

  if (cohortsQuery.isPending) {
    return <Skeleton className="h-10 w-36 rounded-lg" />;
  }
  if (cohorts.length === 0) return null;

  return (
    <SelectInput
      aria-label="Cohort"
      value={cohort?.id ?? ""}
      onChange={setSelectedCohortId}
      options={cohorts.map((c) => ({ value: c.id, label: c.name }))}
      className="h-10 w-auto max-w-48 gap-3 border-neutral-200 bg-neutral-100 px-4 font-medium text-neutral-800 hover:bg-neutral-200"
      chevronClassName="text-neutral-800"
    />
  );
}

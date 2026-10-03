"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Layers } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CreateCohortDialog } from "@/components/CreateCohortDialog";
import { EditCohortDialog } from "@/components/EditCohortDialog";
import {
  cohortStatusBadge,
  cohortStatusLabels,
  formatCohortDate,
} from "@/components/CohortFormFields";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries, type CohortStatus } from "@/lib/admin";

const statusFilters: { label: string; value: CohortStatus | undefined }[] = [
  { label: "All statuses", value: undefined },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Terminated", value: "TERMINATED" },
];

function formatCreatedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CohortsPage() {
  const [statusFilter, setStatusFilter] = React.useState<
    CohortStatus | undefined
  >(undefined);

  const cohortsQuery = useQuery(adminQueries.cohorts(statusFilter));
  const allCohortsQuery = useQuery(adminQueries.cohorts());

  const cohorts = cohortsQuery.data ?? [];
  const allCohorts = allCohortsQuery.data ?? [];

  function countWithStatus(status: CohortStatus) {
    return allCohorts.filter((cohort) => cohort.status === status).length;
  }

  const showEmptyState =
    !cohortsQuery.isPending && allCohorts.length === 0 && !statusFilter;

  return (
    <>
      <AdminTopNav breadcrumb={["Academy", "Cohorts"]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {cohortsQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Layers className="h-12 w-12 text-neutral-300" />
            <p className="font-semibold text-neutral-900">
              Couldn&apos;t load cohorts
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              {cohortsQuery.error.message}
            </p>
          </div>
        ) : showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Layers className="h-12 w-12 text-neutral-300" />
            <p className="font-semibold text-neutral-900">
              No cohorts created yet.
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              A cohort is a group of students and instructors who go through the
              program together. Create your first cohort to start inviting
              people.
            </p>
            <div className="mt-2">
              <CreateCohortDialog />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Cohorts</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Create and manage cohorts. Each cohort groups the students and
                  instructors taking the program over the same period.
                </p>
              </div>
              <CreateCohortDialog />
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white">
              <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {allCohortsQuery.isPending ? (
                    <>
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="mt-2 h-4 w-48" />
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-neutral-900">
                        {allCohorts.length} Cohort
                        {allCohorts.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {countWithStatus("ONGOING")} Ongoing ·{" "}
                        {countWithStatus("COMPLETED")} Completed ·{" "}
                        {countWithStatus("TERMINATED")} Terminated
                      </p>
                    </>
                  )}
                </div>

                <div className="relative">
                  <select
                    aria-label="Filter by status"
                    value={statusFilter ?? ""}
                    onChange={(event) =>
                      setStatusFilter(
                        (event.target.value || undefined) as
                          CohortStatus | undefined,
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-transparent py-2 pr-9 pl-3 text-sm font-medium text-neutral-700 outline-none focus:border-primary-500 sm:w-44"
                  >
                    {statusFilters.map((option) => (
                      <option key={option.label} value={option.value ?? ""}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs tracking-wider text-neutral-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Cohort</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="w-12 px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortsQuery.isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-t border-neutral-200">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-44" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                        </tr>
                      ))
                    ) : cohorts.length === 0 ? (
                      <tr className="border-t border-neutral-200">
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-sm text-neutral-500"
                        >
                          No cohorts match this filter.
                        </td>
                      </tr>
                    ) : (
                      cohorts.map((cohort) => (
                        <tr
                          key={cohort.id}
                          className="border-t border-neutral-200"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                                <Layers className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900">
                                  {cohort.name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Year {cohort.year}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {formatCohortDate(cohort.startDate)} –{" "}
                            {formatCohortDate(cohort.endDate)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge status={cohortStatusBadge[cohort.status]}>
                              {cohortStatusLabels[cohort.status]}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-neutral-500">
                            {formatCreatedDate(cohort.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <EditCohortDialog
                              cohortId={cohort.id}
                              cohortName={cohort.name}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries, assignmentsFor, type AdminUser } from "@/lib/admin";

const PAGE_SIZE = 20;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatJoined(user: AdminUser) {
  // Invited instructors haven't joined yet, so there is no date to show.
  if (user.onboardingStatus === "INVITED") return "--";

  return new Date(user.onboardedAt ?? user.createdAt).toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" }
  );
}

/** Delays a value so typing in the search box doesn't fire a request per key. */
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function InstructorsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounced(search);

  const instructorsQuery = useQuery(
    adminQueries.users({
      role: "INSTRUCTOR",
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    })
  );

  const activeQuery = useQuery(
    adminQueries.userCount({
      role: "INSTRUCTOR",
      onboardingStatus: "COMPLETED",
    })
  );
  const pendingQuery = useQuery(
    adminQueries.userCount({
      role: "INSTRUCTOR",
      onboardingStatus: "INVITED",
    })
  );

  const instructors = instructorsQuery.data?.items ?? [];
  const total = instructorsQuery.data?.total ?? 0;
  const totalPages = instructorsQuery.data?.totalPages ?? 1;

  const isSearching = debouncedSearch.length > 0;
  const showEmptyState =
    !instructorsQuery.isPending && total === 0 && !isSearching;

  return (
    <>
      <AdminTopNav breadcrumb={["People", "Instructors"]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {instructorsQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Users className="h-12 w-12 text-neutral-200" />
            <p className="font-semibold text-neutral-800">
              Couldn&apos;t load instructors
            </p>
            <p className="max-w-80 text-sm text-neutral-400">
              {instructorsQuery.error.message}
            </p>
          </div>
        ) : showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Users className="h-12 w-12 text-neutral-200" />
            <p className="font-semibold text-neutral-800">
              No instructors yet.
            </p>
            <p className="max-w-80 text-sm text-neutral-400">
              Instructors will appear here once they&apos;ve been invited to
              your program.
            </p>
            <div className="mt-2">
              <InviteInstructorDialog />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">
                  Instructors
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                  Manage instructors across your program
                </p>
              </div>
              <InviteInstructorDialog />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {instructorsQuery.isPending ? (
                    <>
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="mt-2 h-4 w-40" />
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-neutral-800">
                        {total} Instructor{total === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {activeQuery.data ?? 0} Active ·{" "}
                        {pendingQuery.data ?? 0} Pending
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-neutral-300 sm:flex-none">
                    <Search className="h-4 w-4 shrink-0" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        // A new search starts from the first page again.
                        setPage(1);
                      }}
                      placeholder="Search by name or email"
                      className="w-full min-w-0 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs tracking-wider text-neutral-400 uppercase">
                    <tr>
                      <th className="w-10 px-5 py-3">
                        <input type="checkbox" className="h-4 w-4 rounded" />
                      </th>
                      <th className="px-5 py-3">Instructor</th>
                      <th className="px-5 py-3">Track</th>
                      <th className="px-5 py-3">Cohort</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="w-12 px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructorsQuery.isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-t border-neutral-100">
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-44" />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                        </tr>
                      ))
                    ) : instructors.length === 0 ? (
                      <tr className="border-t border-neutral-100">
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-neutral-400"
                        >
                          No instructors match &ldquo;{debouncedSearch}&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      instructors.map((instructor) => {
                        const { tracks, cohorts } = assignmentsFor(instructor);
                        const isPendingInvite =
                          instructor.onboardingStatus === "INVITED";

                        return (
                          <tr
                            key={instructor.id}
                            className="border-t border-neutral-100"
                          >
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-brand text-xs font-semibold text-brand-primary">
                                  {initials(instructor.name)}
                                </span>
                                <div>
                                  <p className="font-medium text-neutral-800">
                                    {instructor.displayName ?? instructor.name}
                                  </p>
                                  <p className="text-xs text-neutral-400">
                                    {instructor.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-neutral-600">
                              {tracks.join(", ") || "—"}
                            </td>
                            <td className="px-5 py-4 text-neutral-600">
                              {cohorts.join(", ") || "—"}
                            </td>
                            <td className="px-5 py-4">
                              {instructor.status === "SUSPENDED" ? (
                                <Badge status="error">Suspended</Badge>
                              ) : (
                                <Badge
                                  status={
                                    isPendingInvite ? "warning" : "success"
                                  }
                                >
                                  {isPendingInvite ? "Pending" : "Active"}
                                </Badge>
                              )}
                            </td>
                            <td className="px-5 py-4 text-neutral-400">
                              {formatJoined(instructor)}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                aria-label="Row actions"
                                className="text-neutral-300 hover:text-neutral-600"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 border-t border-neutral-100 p-5">
                  <p className="text-sm text-neutral-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => current - 1)}
                      disabled={page <= 1 || instructorsQuery.isFetching}
                      className="flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={
                        page >= totalPages || instructorsQuery.isFetching
                      }
                      className="flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

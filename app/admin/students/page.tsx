"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Search,
  Users,
} from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteStudentDialog } from "@/components/InviteStudentDialog";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries, assignmentsFor } from "@/lib/admin";
import { formatJoined, getStudentStatus } from "./student-display";

const pageSize = 20;

/** Delays a value so typing in the search box doesn't fire a request per key. */
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const debouncedSearch = useDebounced(search);

  const studentsQuery = useQuery(
    adminQueries.users({
      role: "STUDENT",
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
    }),
  );
  const activeQuery = useQuery(
    adminQueries.userCount({ role: "STUDENT", onboardingStatus: "COMPLETED" }),
  );
  const pendingQuery = useQuery(
    adminQueries.userCount({ role: "STUDENT", onboardingStatus: "INVITED" }),
  );

  const students = studentsQuery.data?.items ?? [];
  const total = studentsQuery.data?.total ?? 0;
  const totalPages = studentsQuery.data?.totalPages ?? 1;

  const isSearching = debouncedSearch.length > 0;
  const showEmptyState =
    !studentsQuery.isPending && total === 0 && !isSearching;

  const allSelected =
    students.length > 0 &&
    students.every((student) => selected.has(student.id));
  const someSelected = students.some((student) => selected.has(student.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const student of students) {
        if (allSelected) {
          next.delete(student.id);
        } else {
          next.add(student.id);
        }
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <>
      <AdminTopNav breadcrumb={["People", "Students"]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {studentsQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Users className="h-12 w-12 text-neutral-300" />
            <p className="font-semibold text-neutral-900">
              Couldn&apos;t load students
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              {studentsQuery.error.message}
            </p>
          </div>
        ) : showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Users className="h-14 w-14 text-primary-500" strokeWidth={1.5} />
            <p className="text-xl font-semibold text-neutral-900">
              No students yet
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              Students will appear here once they&apos;ve been invited to your
              program
            </p>
            <div className="mt-2">
              <InviteStudentDialog />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Students
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Manage students across your program
                </p>
              </div>
              <InviteStudentDialog />
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {studentsQuery.isPending ? (
                    <>
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="mt-2 h-4 w-40" />
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-neutral-900">
                        {total} student{total === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {activeQuery.data ?? 0} Active ·{" "}
                        {pendingQuery.data ?? 0} Pending
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400 sm:flex-none">
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
                      className="w-full min-w-0 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-500"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-neutral-200 text-xs tracking-wider text-neutral-700 uppercase">
                    <tr>
                      <th className="w-12 px-5 py-3">
                        <Checkbox
                          aria-label="Select all students on this page"
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Track</th>
                      <th className="px-5 py-3 font-medium">Cohort</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="w-12 px-5 py-3">
                        <MoreHorizontal className="h-4 w-4" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsQuery.isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-t border-neutral-200">
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-11 w-11 rounded-full" />
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
                    ) : students.length === 0 ? (
                      <tr className="border-t border-neutral-200">
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-neutral-500"
                        >
                          No students match &ldquo;{debouncedSearch}&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => {
                        const { tracks, cohorts } = assignmentsFor(student);
                        const status = getStudentStatus(student);
                        const name = student.displayName ?? student.name;
                        const href = `/admin/students/${student.id}`;

                        return (
                          <tr
                            key={student.id}
                            onClick={() => router.push(href)}
                            className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-100"
                          >
                            <td
                              className="px-5 py-4"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Checkbox
                                aria-label={`Select ${name}`}
                                checked={selected.has(student.id)}
                                onCheckedChange={() => toggleOne(student.id)}
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <InitialsAvatar
                                  name={student.name}
                                  className="h-11 w-11 text-sm"
                                />
                                <div className="min-w-0">
                                  <Link
                                    href={href}
                                    onClick={(event) => event.stopPropagation()}
                                    className="font-medium text-neutral-900 hover:underline"
                                  >
                                    {name}
                                  </Link>
                                  <p className="text-neutral-500">
                                    {student.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-neutral-700">
                              {tracks.join(", ") || "—"}
                            </td>
                            <td className="px-5 py-4 text-neutral-700">
                              {cohorts.join(", ") || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <Badge status={status.badge}>
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-neutral-700">
                              {formatJoined(student)}
                            </td>
                            <td
                              className="px-5 py-4"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                aria-label="Row actions"
                                className="text-neutral-500 hover:text-neutral-700"
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
                <div className="flex items-center justify-between gap-4 border-t border-neutral-200 p-5">
                  <p className="text-sm text-neutral-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => current - 1)}
                      disabled={page <= 1 || studentsQuery.isFetching}
                      className="flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={page >= totalPages || studentsQuery.isFetching}
                      className="flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 disabled:opacity-40"
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

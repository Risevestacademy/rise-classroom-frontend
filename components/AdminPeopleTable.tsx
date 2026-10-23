"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { UserRowActions } from "@/components/UserRowActions";
import {
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminQueries,
  assignmentsFor,
  type AdminUser,
  type UserFilters,
} from "@/lib/admin";
import {
  formatJoined,
  getStudentStatus,
} from "@/app/admin/students/student-display";

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

/** Track ids a user is assigned to (instructors) or enrolled on (students). */
function trackIdsFor(user: AdminUser) {
  const ids = new Set<string>();
  for (const assignment of user.instructorTrack ?? []) {
    if (assignment.track?.id) ids.add(assignment.track.id);
  }
  for (const membership of user.studentProfile ?? []) {
    for (const enrollment of membership.enrollment ?? []) {
      if (enrollment.track?.id) ids.add(enrollment.track.id);
    }
  }
  return Array.from(ids);
}

type Role = "STUDENT" | "INSTRUCTOR";

/** Filter keys match the `/admin/users` query params they set. */
function peopleFilters(
  role: Role,
  tracks: { id: string; name: string }[],
): PeopleFilter<AdminUser>[] {
  const noun = role === "STUDENT" ? "students" : "instructors";
  const filters: PeopleFilter<AdminUser>[] = [
    {
      key: "trackId",
      title: "Track",
      description: "Filter by the learning track they belong to.",
      allLabel: "All tracks",
      options: tracks.map((track) => ({ value: track.id, label: track.name })),
      values: trackIdsFor,
    },
    {
      key: "status",
      title: "Account status",
      description: `Find ${noun} whose account is active or suspended.`,
      allLabel: "All",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "SUSPENDED", label: "Suspended" },
      ],
      values: (user) => [user.status],
    },
  ];

  if (role === "STUDENT") {
    filters.push({
      key: "onboardingStatus",
      title: "Onboarding",
      description:
        "Find students who have joined or are yet to accept their invite.",
      allLabel: "All",
      options: [
        { value: "INVITED", label: "Invited" },
        { value: "COMPLETED", label: "Joined" },
      ],
      values: (user) => [user.onboardingStatus],
    });
  }

  return filters;
}

/** The API takes one value per filter, so each section holds at most one. */
function toUserFilters(values: PeopleFilterValues): UserFilters {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, picked]) => picked.length > 0)
      .map(([key, picked]) => [key, picked[0]]),
  );
}

/** The program-wide Students / Instructors page body under People. */
export function AdminPeopleTable({
  role,
  title,
  description,
  action,
  label,
  personHeader,
  emptyState,
  rowHref,
}: {
  role: Role;
  title: string;
  description: string;
  /** The invite button shown beside the page title. */
  action: React.ReactNode;
  /** Nouns used in the count, e.g. "student" / "students". */
  label: { singular: string; plural: string };
  personHeader: string;
  /** Shown instead of the table when nobody has been invited yet. */
  emptyState: React.ReactNode;
  rowHref?: (user: AdminUser) => string;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const debouncedSearch = useDebounced(search);
  const userFilters = toUserFilters(filterValues);

  const usersQuery = useQuery(
    adminQueries.users({
      role,
      ...userFilters,
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
    }),
  );
  const activeQuery = useQuery(
    adminQueries.userCount({ role, onboardingStatus: "COMPLETED" }),
  );
  const pendingQuery = useQuery(
    adminQueries.userCount({ role, onboardingStatus: "INVITED" }),
  );
  const tracksQuery = useQuery(adminQueries.tracks());

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 1;
  const filters = peopleFilters(role, tracksQuery.data ?? []);

  const isNarrowed =
    debouncedSearch.length > 0 || Object.keys(userFilters).length > 0;
  const showEmptyState = !usersQuery.isPending && total === 0 && !isNarrowed;

  const allSelected =
    users.length > 0 && users.every((user) => selected.has(user.id));
  const someSelected = users.some((user) => selected.has(user.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const user of users) {
        if (allSelected) next.delete(user.id);
        else next.add(user.id);
      }
      return next;
    });
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (usersQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold text-text-primary">
          Couldn&apos;t load {label.plural}
        </p>
        <p className="max-w-80 font-work text-sm text-text-secondary">
          {usersQuery.error.message}
        </p>
      </div>
    );
  }

  if (showEmptyState) return emptyState;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          <p className="mt-1 font-work text-sm text-text-secondary">
            {description}
          </p>
        </div>
        {action}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {usersQuery.isPending ? (
              <>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="mt-1.5 h-4 w-36" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-text-primary">
                  {total} {total === 1 ? label.singular : label.plural}
                </h2>
                <p className="font-work text-sm text-text-secondary">
                  {activeQuery.data ?? 0} Active · {pendingQuery.data ?? 0}{" "}
                  Pending
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="relative flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-2.5 text-text-muted sm:w-[281px] sm:flex-none">
              <Search01 className="size-5 shrink-0" />
              <span className="sr-only">Search by name or email</span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  // A new search starts from the first page again.
                  setPage(1);
                }}
                placeholder="Search by name or email"
                className="w-full min-w-0 bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 font-work text-sm text-text-muted"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>
        </div>

        {/* `relative` keeps the absolutely positioned checkbox inputs inside the
          scroll area; without it they widen the whole page on mobile. */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left">
            <thead className="bg-neutral-100 text-sm font-medium text-text-primary uppercase">
              <tr className="h-11">
                <th className="w-[69px] border-r border-neutral-200 pl-3.5">
                  <Checkbox
                    aria-label={`Select all ${label.plural} on this page`}
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onCheckedChange={toggleAll}
                    className="size-4"
                  />
                </th>
                <th className="w-[319px] border-r border-neutral-200 px-3 font-medium">
                  {personHeader}
                </th>
                <th className="w-[210px] border-r border-neutral-200 px-3 font-medium">
                  Track
                </th>
                <th className="w-[160px] border-r border-neutral-200 px-3 font-medium">
                  Cohort
                </th>
                <th className="w-[160px] border-r border-neutral-200 px-3 font-medium">
                  Status
                </th>
                <th className="w-[135px] px-3 font-medium">Joined</th>
                <th className="w-[82px] px-3 font-medium">
                  <MoreHorizontal className="size-5" />
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isPending
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr
                      key={index}
                      className="h-[85px] border-b border-neutral-200"
                    >
                      <td className="pl-3.5">
                        <Skeleton className="size-4" />
                      </td>
                      <td className="px-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-11 rounded-full" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-3">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-3">
                        <Skeleton className="size-5" />
                      </td>
                    </tr>
                  ))
                : users.map((user) => {
                    const { tracks, cohorts } = assignmentsFor(user);
                    const status = getStudentStatus(user);
                    const name = user.displayName ?? user.name;
                    const href = rowHref?.(user);

                    return (
                      <tr
                        key={user.id}
                        onClick={href ? () => router.push(href) : undefined}
                        className={
                          href
                            ? "h-[85px] cursor-pointer border-b border-neutral-200 hover:bg-neutral-50"
                            : "h-[85px] border-b border-neutral-200"
                        }
                      >
                        <td
                          className="pl-3.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            aria-label={`Select ${name}`}
                            checked={selected.has(user.id)}
                            onCheckedChange={(checked) =>
                              toggleOne(user.id, checked)
                            }
                            className="size-4"
                          />
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={user.name}
                              className="size-11 font-work text-lg font-normal"
                            />
                            <div className="min-w-0">
                              {href ? (
                                <Link
                                  href={href}
                                  onClick={(event) => event.stopPropagation()}
                                  className="block truncate text-sm font-medium text-text-primary hover:underline"
                                >
                                  {name}
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-medium text-text-primary">
                                  {name}
                                </p>
                              )}
                              <p className="mt-1 truncate font-work text-sm text-text-secondary">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="truncate px-3 font-work text-sm text-text-primary">
                          {tracks.join(", ") || "--"}
                        </td>
                        <td className="truncate px-3 font-work text-sm text-text-primary">
                          {cohorts.join(", ") || "--"}
                        </td>
                        <td className="px-3">
                          <Badge
                            variant="light"
                            status={status.badge}
                            className="font-medium"
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-3 font-work text-sm text-text-primary">
                          {formatJoined(user)}
                        </td>
                        <td
                          className="px-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <UserRowActions user={user} />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!usersQuery.isPending && users.length === 0 && (
          <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
            No one matches your search or filters.
          </p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <p className="font-work text-sm text-text-secondary">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1 || usersQuery.isFetching}
                className="flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-3 font-work text-sm text-text-primary disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages || usersQuery.isFetching}
                className="flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-3 font-work text-sm text-text-primary disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        <PeopleFilterDialog
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filters}
          value={filterValues}
          singleSelect
          onApply={(next) => {
            setFilterValues(next);
            // New filters start from the first page again.
            setPage(1);
          }}
        />
      </section>
    </>
  );
}

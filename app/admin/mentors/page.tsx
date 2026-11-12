"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Add01, Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  PeopleSelectionBar,
  ResendInvitesAction,
} from "@/components/PeopleSelectionBar";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { MentorActionsMenu } from "@/components/MentorActionsMenu";
import { StatCard } from "@/components/StatCard";
import {
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { usePageParams } from "@/lib/use-page-params";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminQueries,
  staffAssignments,
  type UserFilters,
} from "@/lib/admin";
import { adminDashboardQueries } from "@/lib/admin-dashboard";
import { toMentor, type Mentor, type MentorStatus } from "@/lib/mentors";
import { useSelectedCohort } from "@/lib/selected-cohort";
import { useDebounced } from "@/lib/use-debounced";
import { useRowSelection } from "@/lib/use-row-selection";
import { cn } from "@/lib/utils";

/** Status pills sit on the brand surface; only the text is coloured. */
const statusBadge: Record<MentorStatus, { label: string; text: string }> = {
  active: { label: "Active", text: "text-text-success" },
  pending: { label: "Pending", text: "text-text-warning" },
  inactive: { label: "Inactive", text: "text-text-default-badge" },
};

/** What each status on this page means in `/admin/users` query params. */
const statusQuery: Record<MentorStatus, UserFilters> = {
  active: { status: "ACTIVE", onboardingStatus: "COMPLETED" },
  pending: { status: "ACTIVE", onboardingStatus: "INVITED" },
  inactive: { status: "SUSPENDED" },
};

function mentorFilters(
  tracks: { id: string; name: string }[],
): PeopleFilter<Mentor>[] {
  return [
    {
      key: "status",
      title: "Status",
      allLabel: "All",
      options: [
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending" },
        { value: "inactive", label: "Inactive" },
      ],
      values: (mentor) => [mentor.status],
    },
    {
      key: "trackId",
      title: "Track",
      allLabel: "All tracks",
      options: tracks.map((track) => ({ value: track.id, label: track.name })),
      values: (mentor) =>
        staffAssignments(mentor.user).flatMap((assignment) =>
          assignment.track ? [assignment.track.id] : [],
        ),
    },
  ];
}

const headerCell =
  "border-r border-border-default px-2.5 font-work text-sm font-medium tracking-[-0.01em]";

export default function MentorsPage() {
  const { cohortId, isReady } = useSelectedCohort();
  const [search, setSearch] = React.useState("");
  const { page, setPage, pageSize, setPageSize } = usePageParams();
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const selection = useRowSelection((mentor: Mentor) => mentor.id);
  const debouncedSearch = useDebounced(search);
  const pickedStatus = filterValues.status?.[0] as MentorStatus | undefined;
  const pickedTrack = filterValues.trackId?.[0];

  // Another cohort has its own pages, so start it from the first one.
  const [listedCohortId, setListedCohortId] = React.useState(cohortId);
  if (listedCohortId !== cohortId) {
    setListedCohortId(cohortId);
    // Not on the first load, so a page from the URL is kept.
    if (listedCohortId !== undefined) setPage(1);
    selection.clear();
  }

  const mentorsQuery = useQuery({
    ...adminQueries.users({
      role: "MENTOR",
      cohortId,
      ...(pickedStatus && statusQuery[pickedStatus]),
      trackId: pickedTrack,
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
    }),
    enabled: isReady,
    // Keeps the rows and pagination on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
  const totalQuery = useQuery({
    ...adminQueries.userCount({ role: "MENTOR", cohortId }),
    enabled: isReady,
  });
  const activeQuery = useQuery({
    ...adminQueries.userCount({
      role: "MENTOR",
      cohortId,
      ...statusQuery.active,
    }),
    enabled: isReady,
  });
  const tracksQuery = useQuery(adminQueries.tracks());
  const rows = (mentorsQuery.data?.items ?? []).map(toMentor);
  const totalPages = mentorsQuery.data?.totalPages ?? 1;

  // Removing the last row of the last page leaves this page empty.
  if (totalPages > 0 && page > totalPages) setPage(totalPages);

  // Only platform-wide: the control tower doesn't count mentorships per cohort.
  const controlTower = useQuery({
    ...adminDashboardQueries.controlTower(),
    enabled: isReady && !cohortId,
  });
  const filters = mentorFilters(tracksQuery.data ?? []);
  const isLoading = mentorsQuery.isPending;
  const isNarrowed =
    debouncedSearch.length > 0 || Boolean(pickedStatus || pickedTrack);

  const stats = [
    { title: "Total mentors", value: totalQuery.data ?? "--" },
    { title: "Active mentors", value: activeQuery.data ?? "--" },
    // PENDING-BACKEND: admins can't list mentorships yet, so mentors without
    // students can't be counted.
    { title: "Unassigned mentors", value: "--" },
    {
      title: "Students assigned",
      value:
        controlTower.data?.metricsOverview.totalActiveMentorships ?? "--",
    },
  ];

  const headerCheckbox = selection.headerState(rows);

  return (
    <>
      <AdminTopNav
        breadcrumb={["People", { label: "Mentors", href: "/admin/mentors" }]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">
              Mentors
            </h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Manage mentors across your program
            </p>
          </div>
          <InviteInstructorDialog
            role="MENTOR"
            renderTrigger={(open) => (
              <Button size="medium" className="gap-2" onClick={open}>
                <Add01 className="size-[18px]" />
                Invite mentor
              </Button>
            )}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              loading={isLoading}
            />
          ))}
        </div>

        <section className="mt-6 overflow-hidden rounded-xl bg-surface-default">
          <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-default p-2.5 text-text-muted sm:w-[281px] sm:flex-none">
              <Search01 className="size-4 shrink-0" />
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
              className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border-default bg-surface-default px-2 py-1 font-work text-sm text-text-muted"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>

          {/* `relative` keeps the absolutely positioned checkbox inputs inside the
            scroll area; without it they widen the whole page on mobile. */}
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed text-left">
              <thead className="bg-surface-subtle text-text-primary">
                <tr className="h-11">
                  <th className="w-[69px] border-r border-border-default pl-3">
                    <Checkbox
                      aria-label="Select all mentors"
                      {...headerCheckbox}
                      onCheckedChange={() => selection.toggleAll(rows)}
                      className="size-4 border-icon-secondary"
                    />
                  </th>
                  <th className={cn(headerCell, "w-[294px] px-3")}>Mentor</th>
                  <th className={cn(headerCell, "w-[210px] px-3")}>Track</th>
                  <th className={cn(headerCell, "w-[212px]")}>
                    Students assigned
                  </th>
                  <th className={cn(headerCell, "w-[159px]")}>Status</th>
                  <th className={cn(headerCell, "w-[135px]")}>Joined</th>
                  <th className="w-[57px] px-2.5">
                    <MoreHorizontal className="size-6" />
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr
                      key={index}
                      className="h-[85px] border-b border-border-default bg-neutral-50"
                    >
                      <td className="pl-3">
                        <Skeleton className="size-4" />
                      </td>
                      <td className="px-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10 rounded-full" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-2.5">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-2.5">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-2.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-2.5">
                        <Skeleton className="size-5" />
                      </td>
                    </tr>
                  ))}
                {rows.map((mentor) => {
                  const status = statusBadge[mentor.status];
                  return (
                    <tr
                      key={mentor.id}
                      className="h-[85px] border-b border-border-default bg-neutral-50"
                    >
                      <td className="pl-3">
                        <Checkbox
                          aria-label={`Select ${mentor.name}`}
                          checked={selection.isSelected(mentor)}
                          onCheckedChange={(checked) =>
                            selection.toggle(mentor, checked)
                          }
                          className="size-4 border-icon-secondary"
                        />
                      </td>
                      <td className="px-3">
                        <div className="flex items-center gap-3">
                          <PersonAvatar name={mentor.name} src={mentor.user.image} colorKey={mentor.id} size={40} />
                          <div className="min-w-0">
                            <Link href={`/admin/mentors/${mentor.id}`} className="truncate font-work text-sm font-medium tracking-[-0.01em] text-black cursor-pointer">
                              {mentor.name}
                            </Link>
                            <p className="mt-1 truncate font-work text-sm text-text-secondary">
                              {mentor.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="truncate px-3 font-work text-sm text-text-primary">
                        {mentor.track}
                      </td>
                      <td className="px-2.5 font-work text-sm text-black">
                        {mentor.studentsAssigned ?? "--"}
                      </td>
                      <td className="px-2.5">
                        <span
                          className={`inline-flex h-6 items-center rounded-full bg-surface-brand p-1.5 text-xs font-medium ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-2.5 font-work text-sm text-black">
                        {mentor.joined}
                      </td>
                      <td className="px-2.5">
                        <MentorActionsMenu mentor={mentor} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {mentorsQuery.isError ? (
            <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
              Couldn&apos;t load mentors. {mentorsQuery.error.message}
            </p>
          ) : (
            !isLoading &&
            rows.length === 0 && (
              <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
                {isNarrowed
                  ? "No one matches your search or filters."
                  : "No mentors yet. Invited mentors will appear here."}
              </p>
            )
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

        {rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={mentorsQuery.data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={mentorsQuery.isFetching}
            className="mt-4"
          />
        )}

        <PeopleSelectionBar
          items={selection.items}
          noun={{ singular: "mentor", plural: "mentors" }}
          onClear={selection.clear}
          exportFileName="mentors"
          exportColumns={[
            { header: "Name", value: (mentor) => mentor.name },
            { header: "Email", value: (mentor) => mentor.email },
            { header: "Track", value: (mentor) => mentor.track },
            { header: "Status", value: (mentor) => statusBadge[mentor.status].label },
            { header: "Joined", value: (mentor) => mentor.joined },
          ]}
          actions={(notify) => (
            <ResendInvitesAction
              users={selection.items.map((mentor) => mentor.user)}
              onResult={notify}
            />
          )}
        />
      </main>
    </>
  );
}

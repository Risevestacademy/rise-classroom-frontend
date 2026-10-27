"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Add01, Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { MentorActionsMenu } from "@/components/MentorActionsMenu";
import { StatCard } from "@/components/StatCard";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { mentorQueries, type Mentor, type MentorStatus } from "@/lib/mentors";
import { useSelectedCohort } from "@/lib/selected-cohort";
import { cn } from "@/lib/utils";

/** Status pills sit on the brand surface; only the text is coloured. */
const statusBadge: Record<MentorStatus, { label: string; text: string }> = {
  active: { label: "Active", text: "text-text-success" },
  pending: { label: "Pending", text: "text-text-warning" },
  inactive: { label: "Inactive", text: "text-text-default-badge" },
};

function mentorFilters(mentors: Mentor[]): PeopleFilter<Mentor>[] {
  const tracks = Array.from(new Set(mentors.map((mentor) => mentor.track)));
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
      key: "track",
      title: "Track",
      allLabel: "All tracks",
      options: tracks.map((track) => ({ value: track, label: track })),
      values: (mentor) => [mentor.track],
    },
  ];
}

const headerCell =
  "border-r border-border-default px-2.5 font-work text-sm font-medium tracking-[-0.01em]";

export default function MentorsPage() {
  const { cohortId, isReady } = useSelectedCohort();
  const mentorsQuery = useQuery({
    ...mentorQueries.list(cohortId),
    enabled: isReady,
  });
  const mentors = mentorsQuery.data ?? [];
  const filters = mentorFilters(mentors);
  const isLoading = mentorsQuery.isPending;
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const query = search.trim().toLowerCase();
  const rows = mentors.filter(
    (mentor) =>
      (mentor.name.toLowerCase().includes(query) ||
        mentor.email.toLowerCase().includes(query)) &&
      matchesPeopleFilters(mentor, filters, filterValues),
  );

  const stats = [
    { title: "Total mentors", value: mentors.length },
    {
      title: "Active mentors",
      value: mentors.filter((mentor) => mentor.status === "active").length,
    },
    // PENDING-BACKEND: admins can't list mentorships yet, so these two
    // can't be counted.
    { title: "Unassigned mentors", value: "--" },
    { title: "Students assigned", value: "--" },
  ];

  const allSelected =
    rows.length > 0 && rows.every((mentor) => selected.has(mentor.id));
  const someSelected = rows.some((mentor) => selected.has(mentor.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const mentor of rows) {
        if (allSelected) next.delete(mentor.id);
        else next.add(mentor.id);
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
                onChange={(event) => setSearch(event.target.value)}
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
              <thead className="bg-surface-subtle text-text-primary uppercase">
                <tr className="h-11">
                  <th className="w-[69px] border-r border-border-default pl-3">
                    <Checkbox
                      aria-label="Select all mentors"
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={toggleAll}
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
                          checked={selected.has(mentor.id)}
                          onCheckedChange={(checked) =>
                            toggleOne(mentor.id, checked)
                          }
                          className="size-4 border-icon-secondary"
                        />
                      </td>
                      <td className="px-3">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar
                            name={mentor.name}
                            className="size-10 font-work text-base font-normal"
                          />
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
                {mentors.length === 0
                  ? "No mentors yet. Invited mentors will appear here."
                  : "No one matches your search or filters."}
              </p>
            )
          )}

          <PeopleFilterDialog
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            value={filterValues}
            onApply={setFilterValues}
          />
        </section>
      </main>
    </>
  );
}

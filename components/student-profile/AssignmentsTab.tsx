"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";

import { Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { cn } from "@/lib/utils";
import {
  assignments,
  type AssignmentStatus,
} from "@/app/admin/students/[id]/profile-data";
import { BrandBadge, Card, CardHeader } from "./shared";

type Assignment = (typeof assignments)[number];

const statusBadge: Record<
  AssignmentStatus,
  { label: string; className: string }
> = {
  notSubmitted: { label: "Not submitted", className: "text-text-error" },
  submitted: {
    label: "Submitted",
    className: "bg-surface-subtle text-text-info",
  },
  awaitingGrading: { label: "Awaiting grading", className: "text-text-warning" },
  graded: { label: "Graded", className: "text-text-success" },
  overdue: { label: "Overdue", className: "text-text-error" },
};

function isPastDue(assignment: Assignment) {
  return new Date(`${assignment.due}T23:59:59`) < new Date();
}

const filters: PeopleFilter<Assignment>[] = [
  {
    key: "status",
    title: "Status",
    allLabel: "All",
    options: [
      { value: "notSubmitted", label: "Not submitted" },
      { value: "submitted", label: "Submitted" },
      { value: "awaitingGrading", label: "Awaiting grading" },
      { value: "graded", label: "Graded" },
      { value: "overdue", label: "Overdue" },
    ],
    values: (assignment) => [assignment.status],
  },
  {
    key: "due",
    title: "Due date",
    allLabel: "All time",
    options: [
      { value: "upcoming", label: "Upcoming" },
      { value: "overdue", label: "Overdue" },
    ],
    values: (assignment) => [isPastDue(assignment) ? "overdue" : "upcoming"],
  },
];

function formatDue(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const headerCell =
  "border-r border-border-default font-work text-sm font-medium tracking-[-0.01em] text-text-primary uppercase";

export function AssignmentsTab({ firstName }: { firstName: string }) {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);

  const query = search.trim().toLowerCase();
  const rows = assignments.filter(
    (assignment) =>
      (assignment.title.toLowerCase().includes(query) ||
        assignment.moduleName.toLowerCase().includes(query)) &&
      matchesPeopleFilters(assignment, filters, filterValues),
  );

  return (
    <Card className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader
          title="Assignments"
          subtitle={`${firstName}'s assignments performance across all modules`}
        />
        <div className="flex items-center gap-3">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-default p-2.5 text-text-muted sm:w-[281px] sm:flex-none">
            <Search01 className="size-4 shrink-0" />
            <span className="sr-only">Search assignment</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignment"
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
      </div>

      {/* `relative` keeps the absolutely positioned inputs inside the scroll
        area; without it they widen the whole page on mobile. */}
      <div className="relative overflow-x-auto">
        <div className="flex min-w-[960px] flex-col gap-2">
          <div className="flex h-11 bg-surface-subtle">
            <div className={cn(headerCell, "flex w-[296px] items-center rounded-tl-lg p-3")}>
              Assignment
            </div>
            <div className={cn(headerCell, "flex w-[254px] items-center p-3")}>
              Module
            </div>
            <div className={cn(headerCell, "flex w-[161px] items-center px-2.5 py-3")}>
              Due
            </div>
            <div className={cn(headerCell, "flex w-[135px] items-center px-2.5 py-3")}>
              Status
            </div>
            <div className={cn(headerCell, "flex w-[159px] items-center px-2.5 py-3")}>
              Grade
            </div>
            <div
              className={cn(
                headerCell,
                "flex flex-1 items-center rounded-tr-lg border-r-0 px-2.5 py-3",
              )}
            >
              Action
            </div>
          </div>

          <ul className="flex flex-col gap-4">
            {rows.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>

          {rows.length === 0 && (
            <p className="py-10 text-center font-work text-sm text-text-muted">
              No assignments match your search or filters.
            </p>
          )}
        </div>
      </div>

      <PeopleFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        value={filterValues}
        onApply={setFilterValues}
      />
    </Card>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const status = statusBadge[assignment.status];

  return (
    <li className="flex h-[68px] items-center border-b border-border-default font-work text-sm">
      <div className="flex w-[296px] min-w-0 flex-col gap-1 p-3">
        <p className="truncate font-medium tracking-[-0.01em] text-text-primary">
          {assignment.title}
        </p>
        <p className="truncate text-text-secondary">{assignment.kind}</p>
      </div>
      <div className="flex w-[254px] min-w-0 flex-col gap-1 p-3 text-text-secondary">
        <p className="truncate">{assignment.module}</p>
        <p className="truncate">{assignment.moduleName}</p>
      </div>
      <div className="flex w-[161px] flex-col gap-1 px-2.5 text-text-secondary">
        <p>{formatDue(assignment.due)}</p>
        <p>{assignment.dueContext}</p>
      </div>
      <div className="w-[135px] px-2.5">
        <BrandBadge className={cn("w-fit", status.className)}>
          {status.label}
        </BrandBadge>
      </div>
      <div className="w-[159px] px-2.5">
        {assignment.score === undefined ? (
          <span className="text-text-secondary">--</span>
        ) : (
          <span>
            <span className="font-medium text-text-primary">
              {assignment.score}
            </span>
            <span className="text-text-secondary">/{assignment.outOf}</span>
          </span>
        )}
      </div>
      <div className="flex-1 px-2.5">
        <AssignmentMenu assignment={assignment} />
      </div>
    </li>
  );
}

/** The "…" menu on an assignment row. The design doesn't show where it leads yet. */
function AssignmentMenu({ assignment }: { assignment: Assignment }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${assignment.title} options`}
        className="flex size-8 items-center justify-center text-icon-primary"
      >
        <MoreHorizontal className="size-6" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="bg-surface-subtle font-work text-sm text-text-primary shadow-[0_1px_3px_rgb(0_0_0/0.15)] outline-none">
            <Menu.Item className="flex cursor-pointer p-2.5 outline-none data-highlighted:bg-neutral-200">
              View assignment
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

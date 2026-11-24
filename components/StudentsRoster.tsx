"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";

import { Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { StatusPill } from "@/components/cohorts/CohortPeopleTable";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { actionsMenuPopupClass } from "@/components/MentorActionsMenu";
import {
  needsAttention,
  progressLabel,
  progressTone,
  StudentName,
  studentStatusPill,
} from "@/components/MentorOverviewCards";
import { PeopleSelectionBar } from "@/components/PeopleSelectionBar";
import { PersonAvatar } from "@/components/PersonAvatar";
import { StatCard } from "@/components/StatCard";
import { MenteeTableRowsSkeleton } from "@/components/student-profile/skeletons";
import { ProgressBar } from "@/components/student-profile/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { useRowSelection } from "@/lib/use-row-selection";
import { cn } from "@/lib/utils";
import type { AssignedStudent } from "@/app/admin/mentors/[id]/profile-data";

const studentFilters: PeopleFilter<AssignedStudent>[] = [
  {
    key: "status",
    title: "Status",
    allLabel: "All",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "inactive", label: "Inactive" },
    ],
    values: (student) => [student.status],
  },
];

const headerCell =
  "border-r border-border-default px-2.5 font-work text-sm font-medium tracking-[-0.01em]";

/**
 * A mentor's or instructor's students: totals, then a searchable, filterable
 * table with progress. Shared by the admin staff profile and the mentor's own
 * Students page.
 */
export function StudentsRoster({
  students,
  loading,
  emptyMessage,
  attention,
  studentHref,
  actions,
  exportFileName,
}: {
  students: AssignedStudent[];
  loading: boolean;
  /** Shown when there are no students at all (none yet, or loading failed). */
  emptyMessage: string;
  /** "Students needing attention"; `"--"` when progress can't be known. */
  attention?: number | "--";
  /** Where a student's name links to, if anywhere. */
  studentHref?: (student: AssignedStudent) => string;
  /** The items in a row's actions menu. */
  actions: (student: AssignedStudent) => React.ReactNode;
  exportFileName: string;
}) {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>({});
  const [filterOpen, setFilterOpen] = React.useState(false);
  const selection = useRowSelection((student: AssignedStudent) => student.email);

  const query = search.trim().toLowerCase();
  const rows = students.filter(
    (student) =>
      (student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)) &&
      matchesPeopleFilters(student, studentFilters, filterValues),
  );
  const headerCheckbox = selection.headerState(rows);

  const stats = [
    { title: "Total students", value: students.length },
    {
      title: "Active students",
      value: students.filter((student) => student.status === "active").length,
    },
    {
      title: "Students needing attention",
      value: attention ?? students.filter(needsAttention).length,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(3,minmax(0,272px))]">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} loading={loading} />
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
            <thead className="bg-surface-subtle text-text-primary">
              <tr className="h-11">
                <th className="w-[69px] border-r border-border-default pl-3">
                  <Checkbox
                    aria-label="Select all students"
                    {...headerCheckbox}
                    onCheckedChange={() => selection.toggleAll(rows)}
                    className="size-4 border-icon-secondary"
                  />
                </th>
                <th className={cn(headerCell, "w-[431px] px-3")}>Student</th>
                <th className={cn(headerCell, "w-[160px]")}>Status</th>
                <th className={cn(headerCell, "w-[420px]")}>Overall progress</th>
                <th className="w-[56px] px-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && <MenteeTableRowsSkeleton />}
              {rows.map((student) => {
                const tone = progressTone(student);
                const pill = studentStatusPill[student.status];
                return (
                  <tr key={student.email} className="h-[69px] border-b border-border-default">
                    <td className="pl-3">
                      <Checkbox
                        aria-label={`Select ${student.name}`}
                        checked={selection.isSelected(student)}
                        onCheckedChange={(checked) => selection.toggle(student, checked)}
                        className="size-4 border-icon-secondary"
                      />
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={student.name} src={student.image} colorKey={student.id} size={40} />
                        <div className="min-w-0">
                          <StudentName student={student} href={studentHref?.(student)} />
                          <p className="truncate font-work text-sm text-text-secondary">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5">
                      <StatusPill status={pill.status}>{pill.label}</StatusPill>
                    </td>
                    <td className="px-2.5 py-3">
                      <div className="flex items-center gap-4">
                        <span className={cn("w-9 text-lg/6 font-semibold", tone.text)}>{progressLabel(student)}</span>
                        <ProgressBar value={student.progress ?? 0} fillClassName={tone.bar} className="w-[150px]" />
                      </div>
                    </td>
                    <td className="px-2.5">
                      <Menu.Root>
                        <Menu.Trigger
                          aria-label={`${student.name} actions`}
                          className="flex size-8 items-center justify-center text-text-primary"
                        >
                          <MoreHorizontal className="size-6" />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner align="end" sideOffset={4} className="z-50">
                            <Menu.Popup className={actionsMenuPopupClass}>{actions(student)}</Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && !loading && (
          <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
            {students.length > 0 ? "No one matches your search or filters." : emptyMessage}
          </p>
        )}

        <PeopleFilterDialog
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={studentFilters}
          value={filterValues}
          onApply={setFilterValues}
        />
      </section>

      <PeopleSelectionBar
        items={selection.items}
        noun={{ singular: "student", plural: "students" }}
        onClear={selection.clear}
        exportFileName={exportFileName}
        exportColumns={[
          { header: "Name", value: (student) => student.name },
          { header: "Email", value: (student) => student.email },
          { header: "Status", value: (student) => studentStatusPill[student.status].label },
          { header: "Overall progress", value: (student) => progressLabel(student) },
        ]}
      />
    </>
  );
}

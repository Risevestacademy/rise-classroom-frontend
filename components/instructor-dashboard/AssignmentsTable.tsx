"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/curriculum/components/ContentTable";
import type { ModuleStatus } from "@/features/curriculum/types";

export type TrackAssignment = {
  assignment: {
    id: string;
    title: string;
    type: string;
    mode: string;
    dueAt?: string | null;
    afterLesson?: number | null;
    status: ModuleStatus;
  };
  module: {
    id: string;
    title: string;
  };
  modulePosition: number;
  submissionsCount?: number;
};

type AssignmentsTableProps = {
  assignments: TrackAssignment[];
  isLoading?: boolean;
  onOpenAssignment?: (assignmentId: string) => void;
};

function formatAssignmentDate(date?: string | null) {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssignmentsTable({
  assignments,
  isLoading = false,
  onOpenAssignment,
}: AssignmentsTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set()
  );

  const allSelected =
    assignments.length > 0 &&
    assignments.every(({ assignment }) =>
      selectedIds.has(assignment.id)
    );

  const someSelected =
    assignments.some(({ assignment }) =>
      selectedIds.has(assignment.id)
    ) && !allSelected;

  function toggleOne(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(assignments.map(({ assignment }) => assignment.id))
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 text-left text-sm">
        <thead className="bg-neutral-100 text-xs tracking-wider text-neutral-500 uppercase">
          <tr>
            <th className="w-12 rounded-l-lg px-4 py-4">
              <Checkbox
                aria-label="Select all assignments"
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
              />
            </th>

            <th className="px-4 py-4 font-medium">Assignment</th>
            <th className="px-4 py-4 font-medium">Module</th>
            <th className="px-4 py-4 font-medium">Due</th>
            <th className="px-4 py-4 font-medium">Submissions</th>
            <th className="px-4 py-4 font-medium">Status</th>
            <th className="w-20 rounded-r-lg px-4 py-4 font-medium">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-neutral-200">
                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-4" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1.5 h-4 w-24" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-1.5 h-4 w-28" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-20" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-10" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>

                <td className="px-4 py-5">
                  <Skeleton className="h-4 w-4" />
                </td>
              </tr>
            ))
          ) : assignments.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm text-neutral-400"
              >
                No assignments match your search or filter.
              </td>
            </tr>
          ) : (
            assignments.map((item) => {
              const { assignment, module: owner, modulePosition } = item;

              return (
                <tr
                  key={assignment.id}
                  className="border-b border-neutral-200"
                >
                  <td className="px-4 py-5">
                    <Checkbox
                      aria-label={`Select ${assignment.title}`}
                      checked={selectedIds.has(assignment.id)}
                      onCheckedChange={() => toggleOne(assignment.id)}
                    />
                  </td>

                  <td className="px-4 py-5">
                    <button
                      type="button"
                      onClick={() => onOpenAssignment?.(assignment.id)}
                      className="text-left font-medium text-neutral-800 hover:underline"
                    >
                      {assignment.title}
                    </button>

                    <p className="mt-0.5 text-neutral-500">
                      {assignment.type} · {assignment.mode}
                    </p>
                  </td>

                  <td className="px-4 py-5 text-neutral-600">
                    <p>Module {modulePosition}</p>
                    <p className="mt-0.5">{owner.title}</p>
                  </td>

                  <td className="px-4 py-5 text-neutral-600">
                    <p>{formatAssignmentDate(assignment.dueAt)}</p>

                    {assignment.afterLesson && (
                      <p className="mt-0.5">
                        After lesson {assignment.afterLesson}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-5 text-neutral-600">
                    {item.submissionsCount ?? "--"}
                  </td>

                  <td className="px-4 py-5">
                    <StatusBadge status={assignment.status} />
                  </td>

                  <td className="px-4 py-5">
                    <button
                      type="button"
                      onClick={() => onOpenAssignment?.(assignment.id)}
                      className="text-xs font-medium text-brand-primary hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
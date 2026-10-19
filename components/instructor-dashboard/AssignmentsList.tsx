"use client";

import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssignmentItem } from "@/components/instructor-dashboard/data";

interface AssignmentsListProps {
  assignments: AssignmentItem[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function AssignmentsList({
  assignments,
  searchQuery,
  onSearchQueryChange,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
}: AssignmentsListProps) {
  return (
    <div className="space-y-6 max-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Assignments
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Manage all assignments in this curriculum
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-[35px] w-[220px] rounded-xl border border-neutral-200 bg-white sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assignments.."
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-1"
            />
          </div>

          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-200">
            <TableRow className="border-b border-neutral-200 hover:bg-transparent">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={
                    assignments.length > 0 &&
                    selectedIds.length === assignments.length
                  }
                  onCheckedChange={onToggleSelectAll}
                  className="rounded border-neutral-300"
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Assignment
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Module
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Due
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Submissions
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assignments.map((assignment) => {
              const isSelected = selectedIds.includes(assignment.id);

              return (
                <TableRow
                  key={assignment.id}
                  className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 ${
                    isSelected ? "bg-neutral-50/80" : ""
                  }`}
                >
                  <TableCell className="pl-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelectRow(assignment.id)}
                      className="rounded border-neutral-300"
                    />
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">
                        {assignment.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.type}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        {assignment.moduleNumber}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.moduleTitle}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        {assignment.dueDate}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.dueRelative}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-xs font-medium text-neutral-700">
                    {assignment.submissions.completed}/
                    {assignment.submissions.total}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                      variant="secondary"
                      className={
                        assignment.status === "Published"
                          ? "bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0"
                          : "bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0"
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 text-right pr-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submissionsData } from "@/components/instructor-dashboard/data";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updateAssignment,
  type AssignmentRecord,
} from "@/lib/instructor";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useDeleteItem } from "@/lib/use-instructor-forms";

const BADGE_BASE = "rounded-full px-2.5 py-0.5 text-xs font-medium border-0";

const GREEN = "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100";
const NEUTRAL = "bg-surface-default-badge text-text-default-badge";
const AMBER = "bg-surface-warning-badge text-text-warning";

const PUBLISH_BADGE: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: GREEN },
  DRAFT: { label: "Draft", className: AMBER },
};

const badgeFor = (
  map: Record<string, { label: string; className: string }>,
  value: string
) => map[value] ?? { label: value, className: NEUTRAL };

export type AssignmentRow = AssignmentRecord & {
  moduleNumber: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonNumber: number;
  afterLesson: string;
  dueDateLabel: string;
  // dueRelative: string;
};

interface AssignmentsListProps {
  assignments: AssignmentRow[];
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
  const [viewing, setViewing] = useState<AssignmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRow | null>(null);
  const [submissionSelectedIds, setSubmissionSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteItem("assignment");
  const statusMutation = useMutation({
    mutationFn: (assignment: AssignmentRow) =>
      updateAssignment(assignment.id, {
        publishStatus:
          assignment.publishStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["instructor"] }),
  });
  const viewingPublishBadge = viewing
    ? badgeFor(PUBLISH_BADGE, viewing.publishStatus)
    : null;

  const mockSubmissions = submissionsData;

  const isAllSubmissionsSelected =
    mockSubmissions.length > 0 &&
    submissionSelectedIds.length === mockSubmissions.length;

  const handleSelectAllSubmissions = () => {
    if (isAllSubmissionsSelected) {
      setSubmissionSelectedIds([]);
    } else {
      setSubmissionSelectedIds(mockSubmissions.map((item) => item.id));
    }
  };

  const handleSelectSubmissionRow = (id: string) => {
    setSubmissionSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
              <TableHead className="w-16 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assignments.map((assignment) => {
              const isSelected = selectedIds.includes(assignment.id);
              const publishBadge = badgeFor(PUBLISH_BADGE, assignment.publishStatus);

              return (
                <TableRow
                  key={assignment.id}
                  className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 ${isSelected ? "bg-neutral-50/80" : ""
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
                    <p className="text-xs font-semibold text-neutral-900">
                      {assignment.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {assignment.submissionType.replace("_", " ").toLowerCase()}
                    </p>
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-medium text-neutral-700">
                      {assignment.moduleNumber}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {assignment.moduleTitle}
                    </p>
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-medium text-neutral-700">
                      {assignment.dueAt ? assignment.dueDateLabel : "No due date"}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      After Lesson {assignment.lessonNumber}
                    </p>
                  </TableCell>

                  <TableCell className="py-4 text-xs font-medium text-neutral-700">
                    —
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                    variant="light"
                    className={`${BADGE_BASE} ${publishBadge.className}`}
                  >
                    {publishBadge.label}
                  </Badge>
                  </TableCell>

                  <TableCell className="w-16 py-4 pr-6">
                    <div className="flex w-full justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="min-w-18! border-none ring-0 bg-white! cursor-pointer"
                          align="end"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => setViewing(assignment)}
                              className="cursor-pointer"
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate(assignment)}
                              className="cursor-pointer"
                              disabled={statusMutation.isPending}
                            >
                              {assignment.publishStatus === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(assignment)}
                              className="cursor-pointer text-error-text"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="w-[80%] !max-w-none h-[80%] !bottom-4 !right-4 !left-auto !top-auto !translate-x-0 !translate-y-0">
          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="bg-neutral-200 px-2 py-1 !h-auto rounded-lg gap-1 inline-flex shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]">
              <TabsTrigger
                value="overview"
                className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="submissions"
                className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
              >
                Submissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="outline-none tracking-wide">
              <DialogHeader>
                <DialogTitle>{viewing?.title}</DialogTitle>
                <DialogDescription>
                  Project . Individual
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row pt-4 gap-3">
                <Card className="w-[70%] bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-[18px] font-semibold">
                      Assignment Brief
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5 text-[14px]">
                    <div className="space-y-1">
                      <p className="font-medium">Assignment title</p>
                      <p className="font-regular">{viewing?.title}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">Description</p>
                      <p className="font-regular">
                        {viewing?.description || "No description"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-[30%] bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-[18px] font-semibold">
                      Assignment details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Submission type:</span>
                      <span className="text-neutral-900 font-semibold">
                        {viewing?.submissionType.replace("_", " ").toLowerCase() ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Due date:</span>
                      <div className="text-right">
                        <p className="text-neutral-900 font-semibold">
                          {viewing?.dueDateLabel}
                        </p>
                        {/* <p className="text-neutral-500 text-[11px]">
                          {viewing?.dueRelative}
                        </p> */}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Relative to lesson:</span>
                      <span className="text-neutral-900 font-semibold">
                        {viewing?.afterLesson}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-neutral-500 font-medium">Status:</span>
                      {viewingPublishBadge && (
                        <Badge
                          variant="light"
                          className={`${BADGE_BASE} ${viewingPublishBadge.className}`}
                        >
                          {viewingPublishBadge.label}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-4 outline-none">
              <div className="w-full bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50/80">
                    <TableRow className="border-b border-neutral-200/80 hover:bg-transparent">
                      <TableHead className="w-12 text-center pl-4 pr-0">
                        <Checkbox
                          checked={isAllSubmissionsSelected}
                          onCheckedChange={handleSelectAllSubmissions}
                          aria-label="Select all submissions"
                          className="rounded border-neutral-300"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Student
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Date Submitted
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Grade
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5 text-right pr-6">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {mockSubmissions.map((submission) => {
                      const isSelected = submissionSelectedIds.includes(submission.id);

                      return (
                        <TableRow
                          key={submission.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                        >
                          <TableCell className="w-12 text-center pl-4 pr-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectSubmissionRow(submission.id)}
                              aria-label={`Select ${submission.name}`}
                              className="rounded border-neutral-300"
                            />
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-neutral-900">
                                  {submission.name}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {submission.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-neutral-800">
                                {submission.dateSubmitted}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {submission.timeSubmitted}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            {submission.status === "Submitted" ? (
                              <Badge
                                variant="light"
                                status="success"
                                className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 shadow-none"
                              >
                                Submitted
                              </Badge>
                            ) : (
                              <Badge
                                variant="light"
                                status="error"
                                className="bg-rose-100/80 text-rose-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 shadow-none"
                              >
                                Not submitted
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5 text-xs font-medium text-neutral-600">
                            {submission.grade}
                          </TableCell>
                          <TableCell className="w-16 py-4 pr-6">
                            <div className="flex w-full justify-end">
                              <MoreHorizontal className="h-4 w-4" />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
      />
    </div>
  );
}
"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, NotebookPen, Plus } from "lucide-react";

import { InitialsAvatar } from "@/components/InitialsAvatar";
import {
  RowActionsMenu,
  StatusBadge,
  TableToolbar,
  useRowSelection,
  type StatusFilter,
} from "@/components/curriculum/ContentTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FileChip } from "@/components/ui/file-upload";
import { DetailRows, DetailSheet } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  submissionTypes,
  curriculumKeys,
  curriculumQueries,
  deleteAssignment,
  formatDate,
  formatTime,
  updateAssignment,
  type CurriculumAssignment,
  type ModuleAssignment,
  type ModuleStatus,
} from "@/lib/curriculum";

export function AddAssignmentButton({
  curriculumId,
}: {
  curriculumId: string;
}) {
  return (
    <Button
      size="lg"
      nativeButton={false}
      render={
        <Link href={`/admin/curriculum/${curriculumId}/assignments/new`} />
      }
    >
      <Plus className="h-4 w-4" />
      Add assignment
    </Button>
  );
}

export function AssignmentsTab({
  curriculumId,
  studentCount,
  onOpenAssignment,
}: {
  curriculumId: string;
  studentCount: number;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  const queryClient = useQueryClient();
  const assignmentsQuery = useQuery(
    curriculumQueries.assignments(curriculumId),
  );
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] =
    React.useState<CurriculumAssignment | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: curriculumKeys.modules(curriculumId),
    });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ModuleStatus }) =>
      updateAssignment(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const items = assignmentsQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const filtered = items.filter(
    ({ assignment }) =>
      assignment.title.toLowerCase().includes(query) &&
      (statusFilter === "ALL" || assignment.status === statusFilter),
  );
  const selection = useRowSelection(
    filtered.map(({ assignment }) => assignment.id),
  );

  if (assignmentsQuery.isSuccess && items.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No Assignment yet"
        description="Add your first and attach to a lesson in a module for students"
        action={<AddAssignmentButton curriculumId={curriculumId} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TableToolbar
        title="Assignments"
        description="Manage all assignments in this curriculum"
        searchPlaceholder="Search assignments.."
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="bg-neutral-100 text-xs tracking-wider text-neutral-500 uppercase">
            <tr>
              <th className="w-12 rounded-l-lg px-4 py-4">
                <Checkbox
                  aria-label="Select all assignments"
                  checked={selection.allSelected}
                  indeterminate={selection.someSelected}
                  onCheckedChange={selection.toggleAll}
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-neutral-400"
                >
                  No assignments match your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const { assignment, module: owner, modulePosition } = item;
                const submitted = assignment.submissions.filter(
                  (s) => s.submittedAt,
                ).length;
                return (
                  <tr
                    key={assignment.id}
                    className="border-b border-neutral-200"
                  >
                    <td className="px-4 py-5">
                      <Checkbox
                        aria-label={`Select ${assignment.title}`}
                        checked={selection.isSelected(assignment.id)}
                        onCheckedChange={() => selection.toggle(assignment.id)}
                      />
                    </td>
                    <td className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => onOpenAssignment(assignment.id)}
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
                      <p>
                        {assignment.dueAt
                          ? formatDate(assignment.dueAt)
                          : "No due date"}
                      </p>
                      {assignment.afterLesson && (
                        <p className="mt-0.5">
                          After lesson {assignment.afterLesson}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-5 text-neutral-600">
                      {submitted}/{studentCount}
                    </td>
                    <td className="px-4 py-5">
                      <StatusBadge status={assignment.status} />
                    </td>
                    <td className="px-4 py-5">
                      <RowActionsMenu
                        label={assignment.title}
                        status={assignment.status}
                        onView={() => onOpenAssignment(assignment.id)}
                        onToggleStatus={() =>
                          statusMutation.mutate({
                            id: assignment.id,
                            status:
                              assignment.status === "PUBLISHED"
                                ? "DRAFT"
                                : "PUBLISHED",
                          })
                        }
                        onDelete={() => setDeleteTarget(item)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.assignment.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.assignment.id)
        }
      />
    </div>
  );
}

const sheetTabs = [
  { value: "overview", label: "Overview" },
  { value: "submissions", label: "Submissions" },
];

export function AssignmentSheet({
  curriculumId,
  assignmentId,
  onClose,
}: {
  curriculumId: string;
  assignmentId: string;
  onClose: () => void;
}) {
  const assignmentQuery = useQuery(
    curriculumQueries.assignment(curriculumId, assignmentId),
  );
  const assignment = assignmentQuery.data?.assignment;

  return (
    <DetailSheet onClose={onClose}>
      {assignmentQuery.isError && (
        <p className="py-10 text-center text-sm text-neutral-400">
          {assignmentQuery.error.message}
        </p>
      )}

      {assignment && (
        <Tabs defaultValue="overview" className="gap-8">
          <TabsList variant="pill">
            {sheetTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <OverviewPanel assignment={assignment} />
          </TabsContent>
          <TabsContent value="submissions">
            <DialogTitle className="sr-only">
              {assignment.title} submissions
            </DialogTitle>
            <SubmissionsPanel assignment={assignment} />
          </TabsContent>
        </Tabs>
      )}
    </DetailSheet>
  );
}

function OverviewPanel({ assignment }: { assignment: ModuleAssignment }) {
  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Type", value: assignment.type },
    {
      label: "Submission type",
      value: submissionTypes[assignment.submissionType],
    },
    {
      label: "Due date",
      value: assignment.dueAt ? (
        <>
          {formatDate(assignment.dueAt)}
          <span className="block font-normal">
            {formatTime(assignment.dueAt)}
          </span>
        </>
      ) : (
        "No due date"
      ),
    },
    {
      label: "Relative to lesson",
      value: assignment.afterLesson
        ? `After lesson ${assignment.afterLesson}`
        : "—",
    },
    {
      label: "Status",
      value: <StatusBadge status={assignment.status} />,
    },
  ];

  return (
    <>
      <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
      <p className="mt-1 text-sm text-neutral-500">
        {assignment.type} · {assignment.mode}
      </p>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-800">
            Assignment Brief
          </h3>
          <dl className="mt-4 flex flex-col gap-6 text-sm">
            <BriefItem label="Assignment title" value={assignment.title} />
            <BriefItem label="Description" value={assignment.description} />
            {assignment.instructions && (
              <BriefItem
                label="Instruction for students"
                value={assignment.instructions}
              />
            )}
            {assignment.resources.length > 0 && (
              <div>
                <dt className="font-medium text-neutral-800">
                  Supporting resources
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {assignment.resources.map((file) => (
                    <FileChip key={file.id} file={file} />
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-800">
            Assignment details
          </h3>
          <DetailRows rows={details} />
        </section>
      </div>
    </>
  );
}

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-neutral-800">{label}</dt>
      <dd className="mt-1 text-neutral-600">{value}</dd>
    </div>
  );
}

function SubmissionsPanel({ assignment }: { assignment: ModuleAssignment }) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const submissions = assignment.submissions;
  const allSelected =
    submissions.length > 0 && submissions.every((s) => selectedIds.has(s.id));

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  if (submissions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-neutral-400">
        No students have been assigned this yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-180 text-left text-sm">
        <thead className="bg-neutral-100 text-xs tracking-wider text-neutral-500 uppercase">
          <tr>
            <th className="w-12 rounded-l-lg px-4 py-4">
              <Checkbox
                aria-label="Select all submissions"
                checked={allSelected}
                indeterminate={selectedIds.size > 0 && !allSelected}
                onCheckedChange={() =>
                  setSelectedIds(
                    allSelected
                      ? new Set()
                      : new Set(submissions.map((s) => s.id)),
                  )
                }
              />
            </th>
            <th className="px-4 py-4 font-medium normal-case">Student</th>
            <th className="px-4 py-4 font-medium">Date submitted</th>
            <th className="px-4 py-4 font-medium">Status</th>
            <th className="px-4 py-4 font-medium">Grade</th>
            <th className="w-20 rounded-r-lg px-4 py-4 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-b border-neutral-200">
              <td className="px-4 py-5">
                <Checkbox
                  aria-label={`Select ${submission.studentName}`}
                  checked={selectedIds.has(submission.id)}
                  onCheckedChange={() => toggleOne(submission.id)}
                />
              </td>
              <td className="px-4 py-5">
                <div className="flex items-center gap-3">
                  <InitialsAvatar
                    name={submission.studentName}
                    className="h-10 w-10"
                  />
                  <div>
                    <p className="font-medium text-neutral-800">
                      {submission.studentName}
                    </p>
                    <p className="text-neutral-500">
                      {submission.studentEmail}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-5 text-neutral-600">
                {submission.submittedAt ? (
                  <>
                    <p>{formatDate(submission.submittedAt)}</p>
                    <p>{formatTime(submission.submittedAt)}</p>
                  </>
                ) : (
                  "--"
                )}
              </td>
              <td className="px-4 py-5">
                <Badge
                  variant="light"
                  status={submission.submittedAt ? "success" : "error"}
                >
                  {submission.submittedAt ? "Submitted" : "Not submitted"}
                </Badge>
              </td>
              <td className="px-4 py-5 text-neutral-600">
                {submission.grade ?? "--"}
              </td>
              <td className="px-4 py-5">
                <button
                  type="button"
                  aria-label={`${submission.studentName} actions`}
                  className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Shapes } from "lucide-react";

import {
  RowActionsMenu,
  StatusBadge,
  TableToolbar,
  useRowSelection,
  type StatusFilter,
} from "@/components/curriculum/ContentTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FileTypeIcon } from "@/components/ui/file-upload";
import { DetailRows, DetailSheet } from "@/components/ui/sheet";
import {
  curriculumKeys,
  curriculumQueries,
  deleteResource,
  formatDate,
  formatTime,
  resourceKind,
  updateResource,
  type CurriculumResource,
  type ModuleStatus,
} from "@/lib/curriculum";
import { formatFileSize } from "@/lib/utils";

export function AddResourceButton({
  curriculumId,
  label = "Add Resources",
}: {
  curriculumId: string;
  label?: string;
}) {
  return (
    <Button
      size="lg"
      nativeButton={false}
      render={<Link href={`/admin/curriculum/${curriculumId}/resources/new`} />}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function ResourcesTab({
  curriculumId,
  onOpenResource,
}: {
  curriculumId: string;
  onOpenResource: (resourceId: string) => void;
}) {
  const queryClient = useQueryClient();
  const resourcesQuery = useQuery(curriculumQueries.resources(curriculumId));
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] =
    React.useState<CurriculumResource | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: curriculumKeys.modules(curriculumId),
    });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ModuleStatus }) =>
      updateResource(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const items = resourcesQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const filtered = items.filter(
    ({ resource }) =>
      resource.title.toLowerCase().includes(query) &&
      (statusFilter === "ALL" || resource.status === statusFilter),
  );
  const selection = useRowSelection(
    filtered.map(({ resource }) => resource.id),
  );

  if (resourcesQuery.isSuccess && items.length === 0) {
    return (
      <EmptyState
        icon={Shapes}
        title="No resource yet"
        description="Add your first resource and attach to a lesson in a module for students"
        action={
          <AddResourceButton curriculumId={curriculumId} label="Add resource" />
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TableToolbar
        title="Resources"
        description="Manage all resources in this curriculum"
        searchPlaceholder="Search resources"
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
                  aria-label="Select all resources"
                  checked={selection.allSelected}
                  indeterminate={selection.someSelected}
                  onCheckedChange={selection.toggleAll}
                />
              </th>
              <th className="px-4 py-4 font-medium">Name</th>
              <th className="px-4 py-4 font-medium">Module</th>
              <th className="px-4 py-4 font-medium">Uploaded</th>
              <th className="px-4 py-4 font-medium">Type &amp; size</th>
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
                  No resources match your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const { resource, module: owner, modulePosition } = item;
                return (
                  <tr key={resource.id} className="border-b border-neutral-200">
                    <td className="px-4 py-5">
                      <Checkbox
                        aria-label={`Select ${resource.title}`}
                        checked={selection.isSelected(resource.id)}
                        onCheckedChange={() => selection.toggle(resource.id)}
                      />
                    </td>
                    <td className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => onOpenResource(resource.id)}
                        className="text-left font-medium text-neutral-800 hover:underline"
                      >
                        {resource.title}
                      </button>
                    </td>
                    <td className="px-4 py-5 text-neutral-600">
                      <p>Module {modulePosition}</p>
                      <p className="mt-0.5">{owner.title}</p>
                    </td>
                    <td className="px-4 py-5 text-neutral-600">
                      {formatDate(resource.uploadedAt)}
                    </td>
                    <td className="px-4 py-5 text-neutral-600">
                      <p>{resourceKind(resource.name, resource.url)}</p>
                      <p className="mt-0.5">
                        {formatFileSize(resource.sizeBytes)}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <StatusBadge status={resource.status} />
                    </td>
                    <td className="px-4 py-5">
                      <RowActionsMenu
                        label={resource.title}
                        status={resource.status}
                        onView={() => onOpenResource(resource.id)}
                        onToggleStatus={() =>
                          statusMutation.mutate({
                            id: resource.id,
                            status:
                              resource.status === "PUBLISHED"
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
        itemName={deleteTarget?.resource.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.resource.id)
        }
      />
    </div>
  );
}

export function ResourceSheet({
  curriculumId,
  resourceId,
  onClose,
}: {
  curriculumId: string;
  resourceId: string;
  onClose: () => void;
}) {
  const resourceQuery = useQuery(
    curriculumQueries.resource(curriculumId, resourceId),
  );
  const item = resourceQuery.data;

  return (
    <DetailSheet onClose={onClose}>
      {resourceQuery.isError && (
        <p className="py-10 text-center text-sm text-neutral-400">
          {resourceQuery.error.message}
        </p>
      )}

      {item && (
        <>
          <DialogTitle className="text-2xl">{item.resource.title}</DialogTitle>
          <p className="mt-1 text-sm text-neutral-500">
            Attached to Module {item.modulePosition}
            {item.lessonPosition && ` · Lesson ${item.lessonPosition}`}
          </p>

          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-800">Preview</h3>
              <div className="mt-4 flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-warning-surface">
                <FileTypeIcon name={item.resource.name} className="scale-150" />
                <p className="mt-2 text-sm text-neutral-600">
                  {item.resource.name}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={!item.resource.url}
                  onClick={() =>
                    window.open(item.resource.url, "_blank", "noreferrer")
                  }
                  className="border-neutral-200 text-neutral-800"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-800">
                Resource details
              </h3>
              <DetailRows
                rows={[
                  { label: "Type", value: resourceKind(item.resource.name, item.resource.url) },
                  {
                    label: "Size",
                    value: formatFileSize(item.resource.sizeBytes),
                  },
                  {
                    label: "Date uploaded",
                    value: (
                      <>
                        {formatDate(item.resource.uploadedAt)}
                        <span className="block font-normal">
                          {formatTime(item.resource.uploadedAt)}
                        </span>
                      </>
                    ),
                  },
                  { label: "Uploaded by", value: item.resource.uploadedBy },
                  {
                    label: "Status",
                    value: <StatusBadge status={item.resource.status} />,
                  },
                ]}
              />
            </section>
          </div>
        </>
      )}
    </DetailSheet>
  );
}

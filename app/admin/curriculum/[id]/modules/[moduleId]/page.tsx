"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";
import {
  Calendar,
  CirclePlay,
  MoreHorizontal,
  Pencil,
  Plus,
  Video,
} from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CurriculumSummaryCard } from "@/components/curriculum/CurriculumSummaryCard";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { InfoNote } from "@/components/ui/info-note";
import { FileChip } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/curriculum/ContentTable";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  curriculumKeys,
  curriculumQueries,
  updateModule,
  type CurriculumModule,
  type ModuleLesson,
  type ModuleStatus,
} from "@/lib/curriculum";

const STATUS_LABELS: Record<ModuleStatus, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
};

function formatClassDate(value: string) {
  return new Date(value)
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .replace(/,(?= \d{4})/, "");
}

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = React.use(params);
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(curriculumQueries.detail(id));
  const modulesQuery = useQuery(curriculumQueries.modules(id));
  const moduleQuery = useQuery(curriculumQueries.module(moduleId));
  const [removeTarget, setRemoveTarget] = React.useState<{
    name: string;
    changes: Partial<CurriculumModule>;
  } | null>(null);

  const updateMutation = useMutation({
    mutationFn: (changes: Partial<CurriculumModule>) =>
      updateModule(moduleId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.module(moduleId),
      });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.modules(id) });
      setRemoveTarget(null);
    },
  });

  const isNotFound = [curriculumQuery.error, moduleQuery.error].some(
    (error) => error instanceof ApiError && error.status === 404,
  );
  if (isNotFound) notFound();

  const curriculum = curriculumQuery.data;
  const curriculumModule = moduleQuery.data;
  const modules = modulesQuery.data ?? [];
  const position = modules.findIndex((m) => m.id === moduleId) + 1;

  if (!curriculum || !curriculumModule) return null;

  const editHref = `/admin/curriculum/${id}/modules/${moduleId}/edit`;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Academy",
          "Curriculum",
          curriculum.title,
          `Module ${position}`,
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end gap-3">
          <Menu.Root>
            <Menu.Trigger
              render={
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-neutral-200 text-neutral-800"
                />
              }
            >
              Change Status
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6} className="z-50">
                <Menu.Popup className="w-40 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                  {(Object.keys(STATUS_LABELS) as ModuleStatus[]).map(
                    (status) => (
                      <Menu.Item
                        key={status}
                        disabled={status === curriculumModule.status}
                        onClick={() => updateMutation.mutate({ status })}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-neutral-700 outline-none data-disabled:cursor-default data-disabled:text-neutral-400 data-highlighted:bg-neutral-100"
                      >
                        {STATUS_LABELS[status]}
                        {status === curriculumModule.status && (
                          <span className="text-xs">Current</span>
                        )}
                      </Menu.Item>
                    ),
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href={editHref} />}
          >
            <Pencil className="h-4 w-4" />
            Edit module
          </Button>
        </div>

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            {curriculumModule.coverImage && (
              <div className="relative aspect-2/1 w-full overflow-hidden rounded-2xl">
                <Image
                  src={curriculumModule.coverImage}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            )}

            {curriculumModule.liveClassRecordings.length > 0 && (
              <div className="flex flex-wrap gap-6">
                {curriculumModule.liveClassRecordings.map((recording) => (
                  <figure key={recording.title} className="w-44">
                    <div className="relative aspect-3/2 overflow-hidden rounded-lg">
                      <Image
                        src={recording.thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="mt-1 text-xs text-neutral-600">
                      {recording.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-neutral-800">
                  {curriculumModule.title}
                </h1>
                <StatusBadge status={curriculumModule.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {curriculumModule.description}
              </p>
            </div>

            {curriculumModule.outcomes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-neutral-800">
                  What students will learn
                </h2>
                <p className="text-xs text-neutral-500">
                  By the end of this module, students will be able to:
                </p>
                <ol className="mt-3 flex flex-col gap-2">
                  {curriculumModule.outcomes.map((outcome, index) => (
                    <li
                      key={outcome}
                      className="flex gap-4 text-sm text-neutral-700"
                    >
                      <span className="text-xs text-neutral-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <ContentCard
              title="Module lessons"
              description={
                curriculumModule.lessons.length === 0
                  ? "No lessons are attached to this module yet."
                  : `${curriculumModule.lessons.length} lesson${curriculumModule.lessons.length === 1 ? " is" : "s are"} currently attached to this module.`
              }
            >
              {curriculumModule.lessons.map((lesson, index) => (
                <ItemCard
                  key={lesson.id}
                  eyebrow={[`Lesson ${index + 1}`, lesson.topic]
                    .filter(Boolean)
                    .join(" · ")}
                  item={lesson}
                  editHref={editHref}
                  onRemove={() =>
                    setRemoveTarget({
                      name: `lesson ${index + 1}`,
                      changes: {
                        lessons: curriculumModule.lessons.filter(
                          (l) => l.id !== lesson.id,
                        ),
                      },
                    })
                  }
                />
              ))}
            </ContentCard>

            <ContentCard
              title="Assignments"
              description="Add practical exercises that help students apply what they’ve learned."
            >
              {curriculumModule.assignments.length === 0 ? (
                <p className="text-sm text-neutral-400">No assignments yet.</p>
              ) : (
                curriculumModule.assignments.map((assignment, index) => (
                  <ItemCard
                    key={assignment.id}
                    eyebrow={`Assignment ${index + 1} · ${assignment.type} · ${assignment.mode}`}
                    item={assignment}
                    editHref={editHref}
                    onRemove={() =>
                      setRemoveTarget({
                        name: `assignment ${index + 1}`,
                        changes: {
                          assignments: curriculumModule.assignments.filter(
                            (a) => a.id !== assignment.id,
                          ),
                        },
                      })
                    }
                  />
                ))
              )}
            </ContentCard>

            <ContentCard
              title="Module content"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={editHref} />}
                  className="border-neutral-200 text-neutral-800"
                >
                  Manage resources
                </Button>
              }
            >
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Class recording link
                </p>
                {curriculumModule.recordingLink ? (
                  <a
                    href={curriculumModule.recordingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-3 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-brand-primary hover:underline"
                  >
                    <CirclePlay className="h-4 w-4 shrink-0 text-neutral-300" />
                    <span className="truncate">
                      {curriculumModule.recordingLink}
                    </span>
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-neutral-400">
                    No recording added yet.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Supporting resources
                </p>
                {curriculumModule.resources.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {curriculumModule.resources.map((file) => (
                      <FileChip key={file.id} file={file} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-neutral-400">
                    No resources added yet.
                  </p>
                )}
              </div>
            </ContentCard>
          </div>

          <aside className="flex flex-col gap-4">
            <CurriculumSummaryCard
              curriculum={curriculum}
              label="Part of curriculum"
              moduleTitle={`Module ${position}`}
              moduleCaption={`${position} of ${modules.length} modules in this curriculum.`}
            />

            <section className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                  <Calendar className="h-4 w-4" />
                  Curriculum live classes
                </p>
                <Badge variant="light" status="info">
                  {curriculum.liveClasses.length} classes
                </Badge>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                These live sessions are attached to the curriculum and are
                visible to all students enrolled in the track.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                {curriculum.liveClasses.map((liveClass) => (
                  <div
                    key={liveClass.id}
                    className="rounded-lg border border-neutral-200 p-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                        <Video className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          {liveClass.title}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Curriculum live class
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 flex gap-2 text-xs text-neutral-500">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {liveClass.scheduledFor
                        ? formatClassDate(liveClass.scheduledFor)
                        : "Date and instructor details will be confirmed before the session is published."}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="medium"
                className="mt-3 border-neutral-200 text-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Add live class
              </Button>
            </section>

            {curriculumModule.status === "DRAFT" && (
              <InfoNote title="Not visible to students yet">
                <p>
                  Draft modules aren&apos;t visible to students until you
                  publish them. Review your lessons and resources before
                  publishing.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full border-neutral-200 text-neutral-800"
                >
                  Preview as student
                </Button>
              </InfoNote>
            )}
          </aside>
        </div>

        <DeleteConfirmDialog
          open={removeTarget !== null}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          itemName={removeTarget?.name ?? ""}
          isPending={updateMutation.isPending}
          onConfirm={() =>
            removeTarget && updateMutation.mutate(removeTarget.changes)
          }
        />
      </main>
    </>
  );
}

function ContentCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-800">{title}</h2>
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ItemCard({
  eyebrow,
  item,
  editHref,
  onRemove,
}: {
  eyebrow: string;
  item: Pick<ModuleLesson, "title" | "description" | "resources">;
  editHref: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl bg-neutral-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">{eyebrow}</p>
          <p className="mt-0.5 font-medium text-neutral-800">{item.title}</p>
        </div>

        <Menu.Root>
          <Menu.Trigger
            aria-label={`${eyebrow} actions`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-neutral-800 hover:bg-neutral-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={6} className="z-50">
              <Menu.Popup className="w-36 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                <Menu.Item
                  render={<Link href={editHref} />}
                  className="flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100"
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  onClick={onRemove}
                  className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
                >
                  Delete
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {item.description && (
        <p className="mt-3 text-sm text-neutral-600">{item.description}</p>
      )}

      {item.resources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.resources.map((file) => (
            <FileChip key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

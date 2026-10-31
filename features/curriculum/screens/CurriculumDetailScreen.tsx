"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";
import {
  ChevronDown,
  GraduationCap,
  GripVertical,
  MoreVertical,
  NotebookPen,
  Plus,
  Shapes,
  Video,
} from "lucide-react";
import { cn } from "cn";

import {
  AddAssignmentButton,
  AssignmentSheet,
  AssignmentsTab,
} from "@/features/curriculum/components/Assignments";
import { StatusBadge } from "@/features/curriculum/components/ContentTable";
import { CurriculumStats } from "@/features/curriculum/components/CurriculumStats";
import {
  AddNoteButton,
  NoteDialog,
  NotesTab,
} from "@/features/curriculum/components/Notes";
import {
  AddResourceButton,
  ResourceSheet,
  ResourcesTab,
} from "@/features/curriculum/components/Resources";
import { SettingsTab } from "@/features/curriculum/components/SettingsTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import {
  trackDetails,
  formatModuleNumber,
} from "@/features/curriculum/mappers";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type { CurriculumModule } from "@/features/curriculum/types";

const tabLabels = {
  overview: "Overview",
  modules: "Modules",
  assignments: "Assignments",
  resources: "Resources",
  notes: "Notes",
  settings: "Settings",
} as const;

type TabKey = keyof typeof tabLabels;

function isTabKey(value: unknown): value is TabKey {
  return typeof value === "string" && value in tabLabels;
}

export type CurriculumDetailSearchParams = {
  tab?: string;
  assignment?: string;
  resource?: string;
  note?: string;
  created?: string;
  module?: string;
};

/*
 * The page's shape while the curriculum loads. Also the route's loading.tsx, so it
 * shows straight away instead of a blank page while the server answers.
 */
export function CurriculumDetailSkeleton() {
  const { TopNav, breadcrumbRoot } = useCurriculumScope();

  return (
    <>
      <TopNav breadcrumb={breadcrumbRoot} />
      <main className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-32 w-full rounded-2xl sm:h-40" />
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="mt-5 flex flex-wrap gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-28" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="mt-8 h-10 w-full max-w-2xl rounded-full" />
        <div className="mt-6 flex max-w-2xl flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    </>
  );
}

export function CurriculumDetailScreen({
  id,
  searchParams,
}: {
  id: string;
  searchParams: CurriculumDetailSearchParams;
}) {
  const {
    tab,
    assignment: openAssignmentId,
    resource: openResourceId,
    note: openNoteId,
    created: createdTitle,
    module: createdInModule,
  } = searchParams;
  const { api, paths, permissions, TopNav, breadcrumbRoot } =
    useCurriculumScope();
  const activeTab: TabKey = isTabKey(tab) ? tab : "overview";
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(api.queries.detail(id));
  const assignmentsQuery = useQuery(api.queries.assignments(id));
  const resourcesQuery = useQuery(api.queries.resources(id));
  const notesQuery = useQuery(api.queries.notes(id));
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const goTo = React.useCallback(
    (query: Record<string, string>) =>
      router.replace(paths.detail(id, query), { scroll: false }),
    [id, router, paths],
  );
  // Closes a sheet or toast while staying on the current tab.
  const clearOverlay = React.useCallback(
    () => goTo({ tab: activeTab }),
    [goTo, activeTab],
  );

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteCurriculum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: api.keys.list() });
      router.push(paths.list);
    },
  });

  if (
    curriculumQuery.error instanceof ApiError &&
    curriculumQuery.error.status === 404 &&
    !deleteMutation.isSuccess
  ) {
    notFound();
  }

  const curriculum = curriculumQuery.data;
  if (!curriculum) {
    if (!curriculumQuery.isError) return <CurriculumDetailSkeleton />;
    return (
      <>
        <TopNav breadcrumb={breadcrumbRoot} />
        <main className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <p className="py-10 text-center text-sm text-text-error">
            {curriculumQuery.error.message}
          </p>
        </main>
      </>
    );
  }

  const track = trackDetails(curriculum.track.name);

  return (
    <>
      <TopNav
        breadcrumb={[
          ...breadcrumbRoot,
          { label: curriculum.title, href: paths.detail(id) },
        ]}
      />
      <main className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="relative h-32 w-full overflow-hidden rounded-2xl sm:h-40">
          <Image
            src="/curriculum-art.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-800">
                {curriculum.title}
              </h1>
              <Badge variant="light" status="success">
                {curriculum.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {track.label} · {curriculum.cohort}
            </p>

            <CurriculumStats
              className="mt-5"
              totalModules={curriculum.totalModules}
              totalLessons={curriculum.totalLessons}
              totalAssignments={curriculum.totalAssignments}
            />
          </div>

          <div className="flex flex-col gap-2 sm:items-end sm:text-right">
            <Image
              src="/default-avatar.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <p className="text-sm text-neutral-600">
              Instructor:{" "}
              <span className="font-medium text-neutral-800">
                {curriculum.instructor.name}
              </span>
            </p>
            <p className="text-sm text-neutral-500">
              {curriculum.instructor.email}
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => goTo({ tab: String(value) })}
          className="mt-8 gap-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-full overflow-x-auto">
              <TabsList variant="pill">
                {(Object.keys(tabLabels) as TabKey[]).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {tabLabels[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {activeTab === "assignments" && !!assignmentsQuery.data?.length && (
              <AddAssignmentButton curriculumId={id} />
            )}

            {activeTab === "resources" && !!resourcesQuery.data?.length && (
              <AddResourceButton curriculumId={id} />
            )}

            {activeTab === "notes" && !!notesQuery.data?.length && (
              <AddNoteButton
                onClick={() => goTo({ tab: "notes", note: "new" })}
              />
            )}

            {activeTab === "modules" && (
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={paths.newModule(id)} />}
              >
                <Plus className="h-4 w-4" />
                Add Module
              </Button>
            )}
          </div>

          <TabsContent value="overview" className="flex flex-col gap-8">
            <section className="max-w-2xl">
              <h2 className="text-lg font-bold text-neutral-800">
                About this curriculum
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {curriculum.description || "No description provided."}
              </p>
            </section>

            <section className="w-full max-w-sm rounded-xl bg-neutral-100 p-5">
              <h2 className="text-lg font-bold text-neutral-800">Usage</h2>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    track.iconClassName,
                  )}
                >
                  <track.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-neutral-800">
                    {track.label} · {curriculum.cohort}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {curriculum.studentCount} Students
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="modules">
            <ModulesTab curriculumId={id} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab
              curriculumId={id}
              studentCount={curriculum.studentCount}
              onOpenAssignment={(assignmentId) =>
                goTo({ tab: "assignments", assignment: assignmentId })
              }
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab
              curriculumId={id}
              onOpenResource={(resourceId) =>
                goTo({ tab: "resources", resource: resourceId })
              }
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab
              curriculumId={id}
              onAddNote={() => goTo({ tab: "notes", note: "new" })}
              onEditNote={(noteId) => goTo({ tab: "notes", note: noteId })}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab curriculum={curriculum} />
          </TabsContent>
        </Tabs>

        {permissions.canDeleteCurriculum && (
          <Menu.Root>
            <Menu.Trigger
              aria-label="Curriculum actions"
              className="fixed right-6 bottom-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-neutral-800 shadow-sm hover:bg-neutral-100 sm:right-10 sm:bottom-10"
            >
              <MoreVertical className="h-4 w-4" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner
                side="top"
                align="end"
                sideOffset={8}
                className="z-50"
              >
                <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                  <Menu.Item
                    onClick={() => setConfirmDelete(true)}
                    className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
                  >
                    Delete curriculum
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}

        {openAssignmentId && (
          <AssignmentSheet
            curriculumId={id}
            assignmentId={openAssignmentId}
            onClose={clearOverlay}
          />
        )}

        {openNoteId && (
          <NoteDialog
            curriculumId={id}
            noteId={openNoteId === "new" ? undefined : openNoteId}
            onClose={clearOverlay}
          />
        )}

        {openResourceId && (
          <ResourceSheet
            curriculumId={id}
            resourceId={openResourceId}
            onClose={clearOverlay}
          />
        )}

        {createdTitle && (
          <SuccessToast
            title={
              activeTab === "resources"
                ? "New resource added"
                : "New Assignment added"
            }
            message={
              <>
                {activeTab === "assignments" && "Assignment "}&ldquo;
                {createdTitle}
                &rdquo; has been successfully created and added to module{" "}
                {createdInModule}
              </>
            }
            onDismiss={clearOverlay}
          />
        )}

        <DeleteConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          itemName={curriculum.title}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      </main>
    </>
  );
}

function ModulesTab({ curriculumId }: { curriculumId: string }) {
  const { api, paths } = useCurriculumScope();
  const queryClient = useQueryClient();
  const modulesQuery = useQuery(api.queries.modules(curriculumId));
  const modules = modulesQuery.data ?? [];

  const [expandedIds, setExpandedIds] = React.useState<Set<string> | null>(
    null,
  );
  const [dragOrder, setDragOrder] = React.useState<string[] | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.reorderModules(curriculumId, orderedIds),
    onMutate: (orderedIds) => {
      queryClient.setQueryData(
        api.keys.modules(curriculumId),
        (current: CurriculumModule[] | undefined) =>
          orderedIds
            .map((moduleId) => current?.find((m) => m.id === moduleId))
            .filter((m): m is CurriculumModule => m !== undefined),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: api.keys.modules(curriculumId),
      }),
  });

  // First module starts expanded until anything is toggled.
  const expanded = expandedIds ?? new Set(modules.slice(0, 1).map((m) => m.id));

  function toggle(moduleId: string) {
    const next = new Set(expanded);
    if (next.has(moduleId)) next.delete(moduleId);
    else next.add(moduleId);
    setExpandedIds(next);
  }

  function handleDragOver(overId: string) {
    if (!draggingId || draggingId === overId) return;
    const order = dragOrder ?? modules.map((m) => m.id);
    const from = order.indexOf(draggingId);
    const to = order.indexOf(overId);
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, draggingId);
    setDragOrder(next);
  }

  function handleDragEnd() {
    if (dragOrder) reorderMutation.mutate(dragOrder);
    setDraggingId(null);
    setDragOrder(null);
  }

  const ordered = dragOrder
    ? dragOrder
        .map((moduleId) => modules.find((m) => m.id === moduleId))
        .filter((m): m is CurriculumModule => m !== undefined)
    : modules;

  if (modulesQuery.isSuccess && modules.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-neutral-400">
        No modules yet. Add a module to start building this curriculum.
      </p>
    );
  }

  if (modulesQuery.isPending) {
    return (
      <div className="flex max-w-4xl flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3">
            <Skeleton className="mt-5 h-5 w-5" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-3">
      {ordered.map((curriculumModule, index) => {
        const isExpanded = expanded.has(curriculumModule.id);
        return (
          <div
            key={curriculumModule.id}
            onDragOver={(event) => {
              event.preventDefault();
              handleDragOver(curriculumModule.id);
            }}
            className={cn(
              "flex items-start gap-3",
              draggingId === curriculumModule.id && "opacity-50",
            )}
          >
            <button
              type="button"
              draggable
              aria-label={`Drag to reorder ${curriculumModule.title}`}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                const row = event.currentTarget.parentElement;
                if (row) event.dataTransfer.setDragImage(row, 16, 16);
                setDraggingId(curriculumModule.id);
              }}
              onDragEnd={handleDragEnd}
              className="mt-5 cursor-grab text-neutral-800 active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={paths.module(curriculumId, curriculumModule.id)}
                    className="text-lg font-bold text-neutral-800 hover:underline"
                  >
                    {formatModuleNumber(index)}. {curriculumModule.title}
                  </Link>
                  <StatusBadge status={curriculumModule.status} />
                </div>
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse module" : "Expand module"}
                  aria-expanded={isExpanded}
                  onClick={() => toggle(curriculumModule.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {isExpanded && (
                <ModuleSummary curriculumModule={curriculumModule} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleSummary({
  curriculumModule,
}: {
  curriculumModule: CurriculumModule;
}) {
  const lessonCount = curriculumModule.lessons.length;
  const assignmentCount = curriculumModule.assignments.length;
  const included = [
    curriculumModule.recordingLink && {
      icon: Video,
      label: "Live class recording",
    },
    lessonCount > 0 && {
      icon: GraduationCap,
      label: `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`,
    },
    assignmentCount > 0 && {
      icon: NotebookPen,
      label: `${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"}`,
    },
    curriculumModule.resources.length > 0 && {
      icon: Shapes,
      label: "Other supporting resources",
    },
  ].filter((item) => !!item);

  return (
    <>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        {curriculumModule.description}
      </p>
      <p className="mt-5 font-medium text-neutral-800">What&apos;s Included</p>
      {included.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">Nothing added yet.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {included.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-1.5 text-sm text-neutral-500"
            >
              <item.icon className="h-4 w-4 text-neutral-800" />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

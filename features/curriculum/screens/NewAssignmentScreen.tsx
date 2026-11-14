"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { InfoNote } from "@/components/ui/info-note";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  AssignmentBriefFields,
  AssignmentSettingsFields,
  assignmentFieldsFrom,
  assignmentValuesFrom,
  emptyAssignmentValues,
  isAssignmentReady,
  type AssignmentValues,
} from "@/features/curriculum/components/AssignmentFields";
import { trackDetails } from "@/features/curriculum/mappers";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type {
  Curriculum,
  CurriculumModule,
} from "@/features/curriculum/types";

export function NewAssignmentScreen({ id }: { id: string }) {
  return <AssignmentFormScreen id={id} />;
}

export function EditAssignmentScreen({
  id,
  assignmentId,
}: {
  id: string;
  assignmentId: string;
}) {
  return <AssignmentFormScreen id={id} assignmentId={assignmentId} />;
}

/* Adds an assignment, or edits one when `assignmentId` is given. */
function AssignmentFormScreen({
  id,
  assignmentId,
}: {
  id: string;
  assignmentId?: string;
}) {
  const { api, paths, TopNav, breadcrumbRoot } = useCurriculumScope();
  const curriculumQuery = useQuery(api.queries.detail(id));
  const modulesQuery = useQuery(api.queries.modules(id));
  const existingQuery = useQuery(api.queries.assignment(id, assignmentId ?? ""));
  const editing = assignmentId !== undefined;
  const existing = editing ? existingQuery.data : undefined;

  if (
    curriculumQuery.error instanceof ApiError &&
    curriculumQuery.error.status === 404
  ) {
    notFound();
  }
  if (editing && modulesQuery.isSuccess && !existing) notFound();

  const curriculum = curriculumQuery.data;
  const title = editing ? "Edit Assignment" : "Add Assignment";

  return (
    <>
      <TopNav
        breadcrumb={[
          ...breadcrumbRoot,
          { label: curriculum?.title ?? "…", href: paths.detail(id) },
          {
            label: title,
            href: editing
              ? paths.editAssignment(id, assignmentId)
              : paths.newAssignment(id),
          },
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={paths.detail(id, { tab: "assignments" })}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Assignment
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-neutral-800">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {editing
            ? "Update this assignment's details and due date."
            : "Create a new assignment for this curriculum."}
        </p>

        {editing && !existing ? (
          <AssignmentFormSkeleton />
        ) : (
          <AssignmentForm
            key={existing?.assignment.id ?? "new"}
            curriculumId={id}
            curriculum={curriculum}
            modules={modulesQuery.data ?? []}
            modulesPending={modulesQuery.isPending}
            assignmentId={existing?.assignment.id}
            initial={
              existing
                ? assignmentValuesFrom(existing.assignment, existing.module.id)
                : emptyAssignmentValues
            }
          />
        )}
      </main>
    </>
  );
}

function AssignmentForm({
  curriculumId,
  curriculum,
  modules,
  modulesPending,
  assignmentId,
  initial,
}: {
  curriculumId: string;
  curriculum: Curriculum | undefined;
  modules: CurriculumModule[];
  modulesPending: boolean;
  assignmentId?: string;
  initial: AssignmentValues;
}) {
  const { api, paths } = useCurriculumScope();
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = assignmentId !== undefined;
  const [values, setValues] = React.useState(initial);

  const selectedModuleId = values.moduleId || modules[0]?.id || "";
  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const backHref = paths.detail(curriculumId, { tab: "assignments" });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fields = assignmentFieldsFrom(values);
      if (assignmentId) {
        await api.updateAssignment(assignmentId, {
          ...fields,
          lessonId: fields.afterLesson
            ? (selectedModule?.lessons[fields.afterLesson - 1]?.id ?? null)
            : null,
        });
        return null;
      }
      return api.createAssignment(selectedModuleId, fields);
    },
    onSuccess: async (created) => {
      const changed = new Set([initial.moduleId, selectedModuleId]);
      await Promise.all(
        [...changed]
          .filter(Boolean)
          .map((moduleId) =>
            api.refreshModule(queryClient, curriculumId, moduleId),
          ),
      );
      if (!created) {
        router.push(backHref);
        return;
      }
      const position = modules.findIndex((m) => m.id === selectedModuleId) + 1;
      router.push(
        paths.detail(curriculumId, {
          tab: "assignments",
          created: created.title,
          module: String(position),
        }),
      );
    },
  });

  const canSubmit =
    isAssignmentReady(values) &&
    selectedModuleId !== "" &&
    !saveMutation.isPending;

  return (
    <>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-800">Basic Information</h2>
            <div className="mt-5">
              <AssignmentBriefFields
                values={values}
                onChange={(changes) =>
                  setValues((current) => ({ ...current, ...changes }))
                }
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="lg"
              nativeButton={false}
              render={<Link href={backHref} />}
              className="border-neutral-200 text-neutral-800"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              disabled={!canSubmit}
              onClick={() => saveMutation.mutate()}
            >
              {editing
                ? saveMutation.isPending
                  ? "Saving…"
                  : "Save changes"
                : saveMutation.isPending
                  ? "Creating…"
                  : "Create Assignment"}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-lg font-bold text-neutral-800">
              Assignment Settings
            </h2>
            {curriculum && (
              <p className="mt-1 text-sm text-neutral-500">
                {trackDetails(curriculum.track.name).label} ·{" "}
                {curriculum.cohort}
              </p>
            )}

            <div className="mt-5">
              <AssignmentSettingsFields
                values={{ ...values, moduleId: selectedModuleId }}
                onChange={(changes) =>
                  setValues((current) => ({ ...current, ...changes }))
                }
                pending={modulesPending}
                moduleOptions={modules.map((m, index) => ({
                  value: m.id,
                  label: `Module ${index + 1} - ${m.title}`,
                }))}
                /* The API can't move an assignment to another module. */
                disabledModules={
                  editing
                    ? modules
                        .filter((m) => m.id !== selectedModuleId)
                        .map((m) => m.id)
                    : undefined
                }
                moduleHint={
                  editing
                    ? "An assignment stays in the module it was created in"
                    : undefined
                }
                lessonCount={selectedModule?.lessons.length ?? 0}
              />
            </div>
          </section>

          {editing && (
            <InfoNote title="Changes apply straight away">
              <p>
                Students see your changes as soon as you save. Moving the due
                date doesn&apos;t change whether work already handed in was
                marked late.
              </p>
            </InfoNote>
          )}
        </aside>
      </div>

      {saveMutation.isError && (
        <p className="mt-4 text-sm text-text-error">
          {saveMutation.error.message}
        </p>
      )}
    </>
  );
}

function AssignmentFormSkeleton() {
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

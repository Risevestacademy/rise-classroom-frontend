"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Clock } from "lucide-react";

import { AlertCircle, Calendar } from "@/assets/icons";
import { InfoNote } from "@/components/ui/info-note";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Hint, InputWrapper, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { LinkListField } from "@/features/curriculum/components/LinkListField";
import { trackDetails } from "@/features/curriculum/mappers";
import { useCurriculumScope } from "@/features/curriculum/scope";
import {
  submissionTypes,
  type Curriculum,
  type CurriculumModule,
  type ModuleAssignment,
  type ResourceFile,
  type SubmissionType,
} from "@/features/curriculum/types";

const noLesson = "none";
/* The time an assignment is due when the instructor only picks a date. */
const defaultDueTime = "23:59";

const pad = (value: number) => String(value).padStart(2, "0");

/* The date and time inputs work in the viewer's local time, as "YYYY-MM-DD" and "HH:mm". */
function toDateInput(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(value: string) {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type FormValues = {
  title: string;
  description: string;
  instructions: string;
  resources: ResourceFile[];
  moduleId: string;
  dueDate: string;
  dueTime: string;
  afterLesson: string;
  submissionType: SubmissionType;
};

const emptyValues: FormValues = {
  title: "",
  description: "",
  instructions: "",
  resources: [],
  moduleId: "",
  dueDate: "",
  dueTime: defaultDueTime,
  afterLesson: noLesson,
  submissionType: "FILE_UPLOAD",
};

function valuesFrom(assignment: ModuleAssignment, moduleId: string): FormValues {
  return {
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    resources: assignment.resources,
    moduleId,
    dueDate: assignment.dueAt ? toDateInput(assignment.dueAt) : "",
    dueTime: assignment.dueAt ? toTimeInput(assignment.dueAt) : defaultDueTime,
    afterLesson: assignment.afterLesson ? String(assignment.afterLesson) : noLesson,
    submissionType: assignment.submissionType,
  };
}

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
                ? valuesFrom(existing.assignment, existing.module.id)
                : emptyValues
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
  initial: FormValues;
}) {
  const { api, paths } = useCurriculumScope();
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = assignmentId !== undefined;

  const [title, setTitle] = React.useState(initial.title);
  const [description, setDescription] = React.useState(initial.description);
  const [instructions, setInstructions] = React.useState(initial.instructions);
  const [resources, setResources] = React.useState(initial.resources);
  const [moduleId, setModuleId] = React.useState(initial.moduleId);
  const [dueDate, setDueDate] = React.useState(initial.dueDate);
  const [dueTime, setDueTime] = React.useState(initial.dueTime);
  const [afterLesson, setAfterLesson] = React.useState(initial.afterLesson);
  const [submissionType, setSubmissionType] = React.useState(
    initial.submissionType,
  );

  const selectedModuleId = moduleId || modules[0]?.id || "";
  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const backHref = paths.detail(curriculumId, { tab: "assignments" });
  const dueAt = dueDate ? `${dueDate}T${dueTime || defaultDueTime}:00` : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fields = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        resources,
        submissionType,
        dueAt,
      };
      const lessonNumber = afterLesson === noLesson ? null : Number(afterLesson);
      if (assignmentId) {
        await api.updateAssignment(assignmentId, {
          ...fields,
          afterLesson: lessonNumber,
          lessonId: lessonNumber
            ? (selectedModule?.lessons[lessonNumber - 1]?.id ?? null)
            : null,
        });
        return null;
      }
      return api.createAssignment(selectedModuleId, {
        ...fields,
        afterLesson: lessonNumber,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: api.keys.modules(curriculumId) });
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
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    selectedModuleId !== "" &&
    !saveMutation.isPending;

  return (
    <>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-800">Basic Information</h2>

            <div className="mt-5 flex flex-col gap-4">
              <FormField
                label="Assignment title"
                required
                inputProps={{
                  type: "basic",
                  size: "medium",
                  value: title,
                  onChange: (event) => setTitle(event.target.value),
                  placeholder: "Visual Hierarchy",
                  leadingIcon: null,
                }}
              />
              <Field.Root className="flex flex-col">
                <Label required>Description</Label>
                <div className="mt-1.5">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Redesign a simple landing page using hierarchy and contrast"
                    className="min-h-28"
                  />
                </div>
              </Field.Root>
              <Field.Root className="flex flex-col">
                <Label icon={<></>}>Instructions for students</Label>
                <div className="mt-1.5">
                  <Textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Use typography, spacing, and color to guide the viewer through the page."
                    className="min-h-28"
                  />
                </div>
              </Field.Root>
              <LinkListField
                label="Resources"
                links={resources}
                onChange={setResources}
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

            <div className="mt-5 flex flex-col gap-5">
              {modulesPending ? (
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Select
                    size="large"
                    label="Module"
                    required
                    value={selectedModuleId}
                    onChange={(value) => {
                      setModuleId(value);
                      setAfterLesson(noLesson);
                    }}
                    options={modules.map((m, index) => ({
                      value: m.id,
                      label: `Module ${index + 1} - ${m.title}`,
                    }))}
                    /* The API can't move an assignment to another module. */
                    disabledOptions={
                      editing
                        ? modules
                            .filter((m) => m.id !== selectedModuleId)
                            .map((m) => m.id)
                        : undefined
                    }
                  />
                  {editing && (
                    /* Hint only works inside a Field, so this copies its look. */
                    <p className="flex items-center gap-1 font-work text-[13px]/[18px] text-text-secondary">
                      <AlertCircle variant="solid" size={14} />
                      An assignment stays in the module it was created in
                    </p>
                  )}
                </div>
              )}

              <Field.Root className="flex flex-col">
                <Label icon={<></>}>Due date</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <InputWrapper size="medium" className="min-w-0 flex-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:size-4">
                      <Calendar />
                    </span>
                    <Field.Control
                      type="date"
                      aria-label="Due date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </InputWrapper>
                  <InputWrapper size="medium" className="min-w-0 flex-2">
                    <Clock className="size-4 shrink-0 text-neutral-500" />
                    <input
                      type="time"
                      aria-label="Due time"
                      value={dueTime}
                      disabled={!dueDate}
                      onChange={(event) => setDueTime(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none disabled:text-text-disabled"
                    />
                  </InputWrapper>
                </div>
                <Hint>
                  {dueDate
                    ? "Students will see the due date in their dashboard"
                    : "No due date. Pick a date to set one."}
                </Hint>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate("");
                      setDueTime(defaultDueTime);
                    }}
                    className="mt-1 w-fit text-xs font-medium text-brand-primary hover:underline"
                  >
                    Remove due date
                  </button>
                )}
              </Field.Root>

              {modulesPending ? (
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : (
                <Select
                  size="large"
                  label="Due relative to lesson"
                  value={afterLesson}
                  onChange={setAfterLesson}
                  options={[
                    { value: noLesson, label: "Not tied to a lesson" },
                    ...(selectedModule?.lessons ?? []).map((_, index) => ({
                      value: String(index + 1),
                      label: `After lesson ${index + 1}`,
                    })),
                  ]}
                />
              )}

              <Select
                size="large"
                label="Assignment type"
                value={submissionType}
                onChange={(value) => setSubmissionType(value as SubmissionType)}
                options={Object.entries(submissionTypes).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
              />
            </div>
          </section>

          {editing ? (
            <InfoNote title="Changes apply straight away">
              <p>
                Students see your changes as soon as you save. Moving the due
                date doesn&apos;t change whether work already handed in was
                marked late.
              </p>
            </InfoNote>
          ) : (
            <InfoNote title="Create now, build next">
              <p>
                After creating your module, add lessons, quizzes and assignments
                from its detail page.
              </p>
              <p>
                Draft modules aren&apos;t visible to students until you publish
                them.
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

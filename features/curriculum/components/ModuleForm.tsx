"use client";

import * as React from "react";
import Link from "next/link";
import { Field } from "@base-ui/react/field";
import { CirclePlay, NotebookPen, Plus, Trash2, X } from "lucide-react";

import { CurriculumSummaryCard } from "@/features/curriculum/components/CurriculumSummaryCard";
import { LinkListField } from "@/features/curriculum/components/LinkListField";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { InfoNote } from "@/components/ui/info-note";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/ui/field";
import { Hint, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyAssignment } from "@/features/curriculum/mappers";
import type {
  Curriculum,
  CurriculumModule,
  ModuleAssignment,
  ModuleLesson,
  ResourceFile,
  SaveModuleInput,
} from "@/features/curriculum/types";

const placeholderOutcomes = [
  "Understand the basics of visual hierarchy, contrast, and composition",
  "Apply color, typography, and spacing to communicate a message",
  "Create a simple composition that guides the viewer’s attention",
];

/** The fields lessons and assignments share in this form. */
type DraftItem = {
  id: string;
  title: string;
  description: string;
  resources: ResourceFile[];
};

function emptyLesson(): ModuleLesson {
  return {
    id: crypto.randomUUID(),
    topic: "",
    title: "",
    description: "",
    resources: [],
  };
}

function keepFilled<T extends DraftItem>(drafts: T[]): T[] {
  return drafts
    .filter((draft) => draft.title.trim())
    .map((draft) => ({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
    }));
}

export function ModuleForm({
  heading,
  curriculum,
  moduleTitle,
  moduleCaption,
  initialModule,
  submitLabel,
  pendingLabel,
  isPending,
  errorMessage,
  cancelHref,
  onSubmit,
}: {
  heading: string;
  curriculum: Curriculum;
  moduleTitle: string;
  moduleCaption: string;
  initialModule?: CurriculumModule;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  errorMessage?: string;
  cancelHref: string;
  onSubmit: (input: SaveModuleInput) => void;
}) {
  const [title, setTitle] = React.useState(initialModule?.title ?? "");
  const [description, setDescription] = React.useState(
    initialModule?.description ?? "",
  );
  const [outcomes, setOutcomes] = React.useState<string[]>(
    initialModule?.outcomes.length ? initialModule.outcomes : ["", "", ""],
  );
  const [recordingLink, setRecordingLink] = React.useState(
    initialModule?.recordingLink ?? "",
  );
  const [resources, setResources] = React.useState<ResourceFile[]>(
    initialModule?.resources ?? [],
  );
  const [lessons, setLessons] = React.useState<ModuleLesson[]>(
    initialModule?.lessons.length ? initialModule.lessons : [emptyLesson()],
  );
  const [assignments, setAssignments] = React.useState<ModuleAssignment[]>(
    initialModule?.assignments.length
      ? initialModule.assignments
      : [emptyAssignment()],
  );
  const [keepAsDraft, setKeepAsDraft] = React.useState(
    initialModule ? initialModule.status === "DRAFT" : true,
  );

  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && !isPending;

  function handleSubmit() {
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status: keepAsDraft ? "DRAFT" : "PUBLISHED",
      outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
      recordingLink: recordingLink.trim(),
      resources,
      lessons: keepFilled(lessons),
      assignments: keepFilled(assignments),
    });
  }

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold text-neutral-800">{heading}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Define what students will learn, then build out your module content.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          <FormSection
            title="Module details"
            description="Give this module a clear title and a short introduction."
          >
            <FormField
              label="Module title"
              required
              inputProps={{
                type: "basic",
                size: "medium",
                value: title,
                onChange: (event) => setTitle(event.target.value),
                placeholder: "Introduction to Design",
                leadingIcon: null,
              }}
            />
            <Field.Root className="flex flex-col">
              <Label required>Description</Label>
              <div className="mt-1.5">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Discover how product design turns user needs into useful, intuitive and meaningful experiences."
                  className="min-h-28"
                />
              </div>
              <Hint>This introduction will appear on the module page.</Hint>
            </Field.Root>
          </FormSection>

          <FormSection
            title="What students will learn"
            description="By the end of this module, students will be able to:"
          >
            <div className="flex flex-col gap-3">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-xs text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input
                    value={outcome}
                    onChange={(event) =>
                      setOutcomes((current) =>
                        current.map((o, i) =>
                          i === index ? event.target.value : o,
                        ),
                      )
                    }
                    placeholder={
                      placeholderOutcomes[index] ?? "Add an outcome"
                    }
                    aria-label={`Outcome ${index + 1}`}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 hover:bg-neutral-100 focus:border-brand-primary"
                  />
                  <IconButton
                    label={`Remove outcome ${index + 1}`}
                    onClick={() =>
                      setOutcomes((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              ))}
            </div>
            <AddButton
              onClick={() => setOutcomes((current) => [...current, ""])}
            >
              Add outcome
            </AddButton>
          </FormSection>

          <FormSection
            title="Module content"
            description="Add a class recording and links to supporting material. You can add more later."
          >
            <FormField
              label="Class recording link"
              labelIcon={<></>}
              inputProps={{
                type: "basic",
                size: "medium",
                value: recordingLink,
                onChange: (event) => setRecordingLink(event.target.value),
                placeholder:
                  "https://risecampus.com/academy/introduction-to-design",
                leadingIcon: (
                  <CirclePlay className="fill-neutral-800 text-white" />
                ),
              }}
            />
            <LinkListField links={resources} onChange={setResources} />
          </FormSection>

          <FormSection
            title="Lessons"
            description="Add lessons to keep this module focused and easy to complete."
          >
            <DraftList
              kind="Lesson"
              drafts={lessons}
              onChange={setLessons}
              createEmpty={emptyLesson}
              eyebrow={(lesson) => lesson.topic}
              titlePlaceholder="Introduction to visual design"
              descriptionPlaceholder="Cover the basics of design thinking, visual principles, and how to communicate ideas clearly."
            />
          </FormSection>

          <FormSection
            title="Assignments"
            description="Add practical exercises that help students apply what they’ve learned."
          >
            <DraftList
              kind="Assignment"
              drafts={assignments}
              onChange={setAssignments}
              createEmpty={() => emptyAssignment()}
              titlePlaceholder="Visual Hierarchy"
              descriptionPlaceholder="Redesign a simple landing page using hierarchy and contrast"
            />
          </FormSection>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-600">
            <Checkbox
              checked={keepAsDraft}
              onCheckedChange={(checked) => setKeepAsDraft(checked)}
            />
            Keep as draft until the module is ready for students
          </label>

          {errorMessage && (
            <p className="text-sm text-text-error">{errorMessage}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
            <Button
              variant="secondary"
              size="lg"
              nativeButton={false}
              render={<Link href={cancelHref} />}
              className="border-neutral-200 text-neutral-800"
            >
              Cancel
            </Button>
            <Button size="lg" disabled={!canSubmit} onClick={handleSubmit}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <CurriculumSummaryCard
            curriculum={curriculum}
            label="Adding to"
            moduleTitle={moduleTitle}
            moduleCaption={moduleCaption}
            showEditIcon
          />
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
        </aside>
      </div>
    </>
  );
}

/* Stands in for the form while the curriculum and its modules load. */
export function ModuleFormSkeleton() {
  return (
    <>
      <Skeleton className="mt-4 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
              <div className="mt-5 flex flex-col gap-4">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            </section>
          ))}
        </div>
        <aside className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </aside>
      </div>
    </>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="font-bold text-neutral-800">{title}</h2>
      <p className="text-sm text-neutral-500">{description}</p>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function DraftList<T extends DraftItem>({
  kind,
  drafts,
  onChange,
  createEmpty,
  eyebrow,
  titlePlaceholder,
  descriptionPlaceholder,
}: {
  kind: "Lesson" | "Assignment";
  drafts: T[];
  onChange: (drafts: T[]) => void;
  createEmpty: () => T;
  eyebrow?: (draft: T) => string | undefined;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
}) {
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  function update(id: string, changes: Partial<DraftItem>) {
    onChange(drafts.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }

  function remove(id: string) {
    onChange(drafts.filter((d) => d.id !== id));
  }

  // Blank drafts go straight away; anything with content asks first.
  function requestRemove(draft: T, index: number) {
    const isBlank =
      !draft.title.trim() &&
      !draft.description.trim() &&
      draft.resources.length === 0;
    if (isBlank) remove(draft.id);
    else
      setDeleteTarget({
        id: draft.id,
        name: `${kind.toLowerCase()} ${index + 1}`,
      });
  }

  return (
    <>
      {drafts.map((draft, index) => (
        <div key={draft.id} className="rounded-xl bg-neutral-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {kind === "Assignment" && (
                <NotebookPen className="mt-0.5 h-4 w-4 text-neutral-800" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {kind} {index + 1}
                  {eyebrow?.(draft) && ` · ${eyebrow(draft)}`}
                </p>
                <p className="text-xs text-neutral-400">
                  {draft.resources.length} supporting resource
                  {draft.resources.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={`Remove ${kind.toLowerCase()} ${index + 1}`}
              onClick={() => requestRemove(draft, index)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-error-badge text-text-error hover:bg-error-border"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <FormField
              label={`${kind} title`}
              required
              inputProps={{
                type: "basic",
                size: "medium",
                value: draft.title,
                onChange: (event) =>
                  update(draft.id, { title: event.target.value }),
                placeholder: titlePlaceholder,
                leadingIcon: null,
              }}
            />
            <FormField
              label="Description"
              labelIcon={<></>}
              inputProps={{
                type: "basic",
                size: "medium",
                value: draft.description,
                onChange: (event) =>
                  update(draft.id, { description: event.target.value }),
                placeholder: descriptionPlaceholder,
                leadingIcon: null,
              }}
            />
            <LinkListField
              links={draft.resources}
              onChange={(resources) => update(draft.id, { resources })}
            />
          </div>
        </div>
      ))}

      <AddButton onClick={() => onChange([...drafts, createEmpty()])}>
        Add {kind.toLowerCase()}
      </AddButton>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        onConfirm={() => {
          if (deleteTarget) remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="w-fit border-neutral-200 text-neutral-800"
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </Button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-800 hover:bg-neutral-100"
    >
      {children}
    </button>
  );
}

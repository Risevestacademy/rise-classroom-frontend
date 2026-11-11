"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";

import { AlertCircle } from "@/assets/icons";
import { FileDropzone } from "@/components/ui/file-upload";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DueDateField } from "@/features/curriculum/components/DueDateField";
import {
  defaultMaxPoints,
  resourceFromUpload,
} from "@/features/curriculum/mappers";
import {
  submissionTypes,
  type ModuleAssignment,
  type ResourceFile,
  type SubmissionType,
} from "@/features/curriculum/types";

export const noLesson = "none";

/** What the assignment form holds, as the fields edit it. */
export type AssignmentValues = {
  title: string;
  description: string;
  instructions: string;
  resources: ResourceFile[];
  moduleId: string;
  dueAt: string | null;
  afterLesson: string;
  maxPoints: string;
  submissionType: SubmissionType;
};

export const emptyAssignmentValues: AssignmentValues = {
  title: "",
  description: "",
  instructions: "",
  resources: [],
  moduleId: "",
  dueAt: null,
  afterLesson: noLesson,
  maxPoints: String(defaultMaxPoints),
  submissionType: "FILE_UPLOAD",
};

export function assignmentValuesFrom(
  assignment: ModuleAssignment,
  moduleId: string,
): AssignmentValues {
  return {
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    resources: assignment.resources,
    moduleId,
    dueAt: assignment.dueAt,
    afterLesson: assignment.afterLesson
      ? String(assignment.afterLesson)
      : noLesson,
    maxPoints: String(assignment.maxPoints),
    submissionType: assignment.submissionType,
  };
}

/** A whole number above 0, or null while the field doesn't hold one. */
export function parseMaxPoints(value: string) {
  if (!/^\d{1,4}$/.test(value.trim())) return null;
  const points = Number(value);
  return points > 0 ? points : null;
}

/** The saved fields, once the form is valid. */
export function assignmentFieldsFrom(values: AssignmentValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    resources: values.resources,
    submissionType: values.submissionType,
    dueAt: values.dueAt,
    afterLesson:
      values.afterLesson === noLesson ? null : Number(values.afterLesson),
    maxPoints: parseMaxPoints(values.maxPoints) ?? defaultMaxPoints,
  };
}

export function isAssignmentReady(values: AssignmentValues) {
  return (
    values.title.trim().length > 0 &&
    values.description.trim().length > 0 &&
    values.instructions.trim().length > 0 &&
    parseMaxPoints(values.maxPoints) !== null
  );
}

type Change = (changes: Partial<AssignmentValues>) => void;

const resourceExtensions = [".jpeg", ".jpg", ".png", ".pdf", ".mp4"];

/** Title, description, instructions and resources. */
export function AssignmentBriefFields({
  values,
  onChange,
}: {
  values: AssignmentValues;
  onChange: Change;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Assignment title"
        required
        inputProps={{
          type: "basic",
          size: "medium",
          value: values.title,
          onChange: (event) => onChange({ title: event.target.value }),
          placeholder: "Visual Hierarchy",
          leadingIcon: null,
        }}
      />
      <Field.Root className="flex flex-col">
        <Label required>Description</Label>
        <div className="mt-1.5">
          <Textarea
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Redesign a simple landing page using hierarchy and contrast"
            className="min-h-28"
          />
        </div>
      </Field.Root>
      <Field.Root className="flex flex-col">
        <Label required>Instructions for students</Label>
        <div className="mt-1.5">
          <Textarea
            value={values.instructions}
            onChange={(event) =>
              onChange({ instructions: event.target.value })
            }
            placeholder="Use typography, spacing, and color to guide the viewer through the page."
            className="min-h-28"
          />
        </div>
      </Field.Root>
      {/* PENDING-BACKEND: the API has no file uploads, so picked files stay in
        the session. */}
      <FileDropzone
        label="Resources"
        optional
        files={values.resources}
        onChange={(resources) => onChange({ resources })}
        createFile={resourceFromUpload}
        extensions={resourceExtensions}
        maxBytes={50e6}
        formatsLabel="JPEG, PNG, PDF, and MP4"
      />
    </div>
  );
}

function SelectSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/** Module, due date, lesson, maximum points and submission type. */
export function AssignmentSettingsFields({
  values,
  onChange,
  moduleOptions,
  disabledModules,
  moduleHint,
  lessonCount,
  pending = false,
}: {
  values: AssignmentValues;
  onChange: Change;
  moduleOptions: { value: string; label: string }[];
  disabledModules?: string[];
  /** Shown under the module, e.g. why it can't change. */
  moduleHint?: string;
  /** How many lessons the chosen module has, to attach the assignment to. */
  lessonCount: number;
  /** Shows skeletons while the modules load. */
  pending?: boolean;
}) {
  const pointsInvalid =
    values.maxPoints.trim() !== "" && parseMaxPoints(values.maxPoints) === null;

  return (
    <div className="flex flex-col gap-5">
      {pending ? (
        <SelectSkeleton />
      ) : (
        <div className="flex flex-col gap-1.5">
          <Select
            size="large"
            label="Module"
            required
            value={values.moduleId}
            onChange={(moduleId) =>
              onChange({ moduleId, afterLesson: noLesson })
            }
            options={moduleOptions}
            disabledOptions={disabledModules}
          />
          {moduleHint && (
            /* Hint only works inside a Field, so this copies its look. */
            <p className="flex items-center gap-1 font-work text-[13px]/[18px] text-text-secondary">
              <AlertCircle variant="solid" size={14} />
              {moduleHint}
            </p>
          )}
        </div>
      )}

      <DueDateField
        value={values.dueAt}
        onChange={(dueAt) => onChange({ dueAt })}
      />

      {pending ? (
        <SelectSkeleton />
      ) : (
        <Select
          size="large"
          label="Attach to lesson"
          value={values.afterLesson}
          onChange={(afterLesson) => onChange({ afterLesson })}
          options={[
            { value: noLesson, label: "Not tied to a lesson" },
            ...Array.from({ length: lessonCount }, (_, index) => ({
              value: String(index + 1),
              label: `After lesson ${index + 1}`,
            })),
          ]}
        />
      )}

      <FormField
        label="Maximum points"
        required
        invalid={pointsInvalid}
        error={pointsInvalid ? "Enter a whole number above 0" : undefined}
        hint={
          pointsInvalid
            ? undefined
            : "Students see their earned score out of this total (e.g. 85/100)."
        }
        inputProps={{
          type: "basic",
          size: "medium",
          inputMode: "numeric",
          value: values.maxPoints,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ maxPoints: event.target.value }),
          placeholder: String(defaultMaxPoints),
          leadingIcon: null,
          trailingIcon: (
            <span className="font-work text-xs text-text-muted">pts</span>
          ),
        }}
      />

      <Select
        size="large"
        label="Assignment type"
        value={values.submissionType}
        onChange={(value) =>
          onChange({ submissionType: value as SubmissionType })
        }
        options={Object.entries(submissionTypes).map(([value, label]) => ({
          value,
          label,
        }))}
      />
    </div>
  );
}

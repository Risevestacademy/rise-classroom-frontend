"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { Calendar } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InfoNote } from "@/components/ui/info-note";
import { FileDropzone } from "@/components/ui/file-upload";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Hint, InputWrapper, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  submissionTypes,
  trackDetails,
  createAssignment,
  curriculumKeys,
  curriculumQueries,
  resourceFromUpload,
  type ResourceFile,
  type SubmissionType,
} from "@/lib/curriculum";

const acceptedExtensions = [".jpeg", ".jpg", ".png", ".pdf", ".mp4"];
const maxFileBytes = 50e6;
const noLesson = "none";

export default function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(curriculumQueries.detail(id));
  const modulesQuery = useQuery(curriculumQueries.modules(id));

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [resources, setResources] = React.useState<ResourceFile[]>([]);
  const [moduleId, setModuleId] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [afterLesson, setAfterLesson] = React.useState(noLesson);
  const [submissionType, setSubmissionType] =
    React.useState<SubmissionType>("FILE_UPLOAD");

  const modules = modulesQuery.data ?? [];
  const selectedModuleId = moduleId || modules[0]?.id || "";
  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const backHref = `/admin/curriculum/${id}?tab=assignments`;

  const createMutation = useMutation({
    mutationFn: () =>
      createAssignment(selectedModuleId, {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        resources,
        submissionType,
        dueAt: dueDate ? `${dueDate}T23:59:00` : null,
        afterLesson: afterLesson === noLesson ? null : Number(afterLesson),
      }),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.modules(id) });
      const position = modules.findIndex((m) => m.id === selectedModuleId) + 1;
      const params = new URLSearchParams({
        tab: "assignments",
        created: assignment.title,
        module: String(position),
      });
      router.push(`/admin/curriculum/${id}?${params}`);
    },
  });

  if (
    curriculumQuery.error instanceof ApiError &&
    curriculumQuery.error.status === 404
  ) {
    notFound();
  }

  const curriculum = curriculumQuery.data;
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    selectedModuleId !== "" &&
    !createMutation.isPending;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Academy",
          "Curriculum",
          curriculum?.title ?? "…",
          "Add Assignment",
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Assignment
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-neutral-800">
          Add Assignment
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create a new assignment for this curriculum.
        </p>

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
                <FileDropzone
                  label="Resources"
                  optional
                  files={resources}
                  onChange={setResources}
                  createFile={resourceFromUpload}
                  extensions={acceptedExtensions}
                  maxBytes={maxFileBytes}
                  formatsLabel="JPEG, PNG, PDF, and MP4"
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
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating…" : "Create Assignment"}
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
                  {trackDetails[curriculum.track].label} · {curriculum.cohort}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-5">
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
                />

                <Field.Root className="flex flex-col">
                  <Label icon={<></>}>Date</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <InputWrapper size="medium" className="min-w-0 flex-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:size-4">
                        <Calendar />
                      </span>
                      <Field.Control
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </InputWrapper>
                    <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-800">
                      11:59 PM
                    </span>
                  </div>
                  <Hint>Students will see due date in their dashboard</Hint>
                </Field.Root>

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

                <Select
                  size="large"
                  label="Assignment type"
                  value={submissionType}
                  onChange={(value) =>
                    setSubmissionType(value as SubmissionType)
                  }
                  options={Object.entries(submissionTypes).map(
                    ([value, label]) => ({
                      value,
                      label,
                    }),
                  )}
                />
              </div>
            </section>

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

        {createMutation.isError && (
          <p className="mt-4 text-sm text-text-error">
            {createMutation.error.message}
          </p>
        )}
      </main>
    </>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File01, Video, Link01, Camera02 } from "@/assets/icons";
import { ChevronLeft, FileText, Link2 } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { FileDropzone } from "@/components/ui/file-upload";
import { InfoNote } from "@/components/ui/info-note";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  resourceKinds,
  createResource,
  curriculumKeys,
  curriculumQueries,
  resourceFromUpload,
  type ResourceFile,
  type ResourceKind,
} from "@/lib/curriculum";

const maxFileBytes = 50e6;
const wholeModule = "module";

export default function NewResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(curriculumQueries.detail(id));
  const modulesQuery = useQuery(curriculumQueries.modules(id));

  const [kind, setKind] = React.useState<ResourceKind>("PDF");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [files, setFiles] = React.useState<ResourceFile[]>([]);
  const [url, setUrl] = React.useState("");
  const [moduleId, setModuleId] = React.useState("");
  const [lessonId, setLessonId] = React.useState("");

  const modules = modulesQuery.data ?? [];
  const selectedModuleId = moduleId || modules[0]?.id || "";
  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const lessons = selectedModule?.lessons ?? [];
  const selectedLessonId = lessonId || lessons[0]?.id || wholeModule;
  const file = files[0];
  const isLink = kind === "Link";
  const backHref = `/admin/curriculum/${id}?tab=resources`;

  const Icons: Record<ResourceKind, React.ReactNode> = {
    PDF: <File01 className="text-text-info" />,
    Video: <Video className="text-text-info" />,
    Link: <Link01 className="text-text-info" />,
    Image: <Camera02 className="text-text-info" />,
    Document: <FileText className="text-text-info" />,
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createResource(
        selectedModuleId,
        selectedLessonId === wholeModule ? null : selectedLessonId,
        isLink
          ? {
              name: url.trim(),
              sizeBytes: null,
              title: title.trim(),
              description: description.trim(),
              url: url.trim(),
            }
          : {
              name: file.name,
              sizeBytes: file.sizeBytes,
              title: title.trim(),
              description: description.trim(),
            },
      ),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.modules(id) });
      const position = modules.findIndex((m) => m.id === selectedModuleId) + 1;
      const query = new URLSearchParams({
        tab: "resources",
        created: resource.title,
        module: String(position),
      });
      router.push(`/admin/curriculum/${id}?${query}`);
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
    (isLink ? url.trim().length > 0 : file !== undefined) &&
    selectedModuleId !== "" &&
    !createMutation.isPending;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Academy",
          { label: "Curriculum", href: "/admin/curriculum" },
          { label: curriculum?.title ?? "…", href: `/admin/curriculum/${id}` },
          { label: "Add Resource", href: `/admin/curriculum/${id}/resources/new` },
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-neutral-800">
          Add Resource
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload a new resource for this curriculum.
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="font-bold text-neutral-800">Basic Information</h2>

              <div className="mt-5 flex flex-col gap-4">
                <Select
                  size="large"
                  label="Resource type"
                  value={kind}
                  onChange={(value) => {
                    setKind(value as ResourceKind);
                    setFiles([]);
                  }}
                  options={(Object.keys(resourceKinds) as ResourceKind[]).map(
                    (k) => ({
                      value: k,
                      label: k,
                    }),
                  )}
                  leadingIcon={Icons[kind]}
                />
                <FormField
                  label="Title"
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
                  <Label icon={<></>}>Description</Label>
                  <div className="mt-1.5">
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Redesign a simple landing page using hierarchy and contrast"
                      className="min-h-28"
                    />
                  </div>
                </Field.Root>
                {isLink ? (
                  <FormField
                    label="Link"
                    required
                    hint="Paste a full link starting with https://"
                    inputProps={{
                      type: "basic",
                      size: "medium",
                      value: url,
                      onChange: (event) => setUrl(event.target.value),
                      placeholder: "https://www.figma.com/file/…",
                      leadingIcon: <Link2 className="text-text-info" />,
                    }}
                  />
                ) : (
                  <FileDropzone
                    label="Resource"
                    files={files}
                    onChange={setFiles}
                    createFile={resourceFromUpload}
                    extensions={resourceKinds[kind].extensions}
                    maxBytes={maxFileBytes}
                    formatsLabel={resourceKinds[kind].formats}
                    multiple={false}
                  />
                )}
                <Select
                  size="large"
                  label="Attach to"
                  required
                  value={selectedModuleId}
                  onChange={(value) => {
                    setModuleId(value);
                    setLessonId("");
                  }}
                  options={modules.map((m, index) => ({
                    value: m.id,
                    label: `Module ${index + 1} - ${m.title}`,
                  }))}
                />
                <Select
                  size="large"
                  label="Lesson"
                  required
                  value={selectedLessonId}
                  onChange={setLessonId}
                  options={[
                    ...lessons.map((lesson, index) => ({
                      value: lesson.id,
                      label: `Lesson ${index + 1}`,
                    })),
                    {
                      value: wholeModule,
                      label: "Whole module (no specific lesson)",
                    },
                  ]}
                />
              </div>
            </section>

            {createMutation.isError && (
              <p className="text-sm text-text-error">
                {createMutation.error.message}
              </p>
            )}

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
                {createMutation.isPending ? "Creating…" : "Create resource"}
              </Button>
            </div>
          </div>

          <aside>
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
      </main>
    </>
  );
}

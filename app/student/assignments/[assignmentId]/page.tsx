"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Link2,
  Lock,
  MessageSquareText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { FileDropzone, type UploadedFile } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SubmittedWork } from "@/components/assignments/SubmittedWork";
import { Notice } from "@/components/lessons/Notice";
import { ResourceRow } from "@/components/lessons/ResourceRow";
import { formatDate, formatTime } from "@/features/curriculum/mappers";
import {
  submissionBadges,
  submissionTypes,
} from "@/features/curriculum/types";
import {
  canEditSubmission,
  saveSubmissionDraft,
  studentAssignmentKeys,
  studentAssignmentQueries,
  submissionFileExtensions,
  submissionFileMaxBytes,
  submitAssignment,
  type StudentAssignment,
  type StudentSubmission,
  type SubmissionDraft,
} from "@/lib/student-assignments";
import { toHttpUrl } from "@/lib/student-lessons";

const listHref = "/student/assignments";

function formatDue(value: string) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

/* The API stores attachments as bare URLs, so the last path segment stands in for a title. */
function attachmentTitle(url: string) {
  try {
    const name = new URL(url).pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : url;
  } catch {
    return url;
  }
}

function isPastDue(dueAt: string | null | undefined) {
  return dueAt ? new Date(dueAt).getTime() < Date.now() : false;
}

type PickedFile = UploadedFile & { file: File };

function SubmissionForm({
  assignment,
  submission,
}: {
  assignment: StudentAssignment;
  submission: StudentSubmission | null;
}) {
  const queryClient = useQueryClient();
  const type = assignment.submissionType;
  const [link, setLink] = useState(submission?.linkUrl ?? "");
  const [text, setText] = useState(submission?.textContent ?? "");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const linkInvalid = link.trim() !== "" && !toHttpUrl(link.trim());
  const pickedFile = files[0]?.file ?? null;
  /* Whether what's on screen differs from what the API already has. */
  const changed =
    type === "LINK"
      ? link.trim() !== (submission?.linkUrl ?? "")
      : type === "TEXT"
        ? text.trim() !== (submission?.textContent ?? "").trim()
        : pickedFile !== null;
  const hasWork =
    type === "LINK"
      ? link.trim() !== "" && !linkInvalid
      : type === "TEXT"
        ? text.trim() !== ""
        : pickedFile !== null || Boolean(submission?.fileUrl);

  function draft(): SubmissionDraft | null {
    if (type === "LINK") return { submissionType: type, linkUrl: link.trim() };
    if (type === "TEXT") return { submissionType: type, textContent: text.trim() };
    return pickedFile ? { submissionType: type, file: pickedFile } : null;
  }

  function onSaved(saved: StudentSubmission) {
    queryClient.setQueryData(
      studentAssignmentKeys.submission(assignment.id),
      saved,
    );
    queryClient.invalidateQueries({
      queryKey: studentAssignmentKeys.allSubmissions,
    });
  }

  const save = useMutation({
    mutationFn: () => {
      const next = draft();
      if (!next) throw new Error("Add your work before saving.");
      return saveSubmissionDraft(assignment.id, next);
    },
    onSuccess: (saved) => {
      onSaved(saved);
      setFiles([]);
      setSavedAt(new Date().toISOString());
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const next = draft();
      /* Only send the draft again when it changed; a saved file needs no re-upload. */
      if (next && (changed || !submission)) {
        await saveSubmissionDraft(assignment.id, next);
      }
      return submitAssignment(assignment.id);
    },
    onSuccess: async () => {
      setFiles([]);
      await queryClient.invalidateQueries({
        queryKey: studentAssignmentKeys.submission(assignment.id),
      });
      queryClient.invalidateQueries({
        queryKey: studentAssignmentKeys.allSubmissions,
      });
    },
  });

  const busy = save.isPending || submit.isPending;
  const error = save.error ?? submit.error;
  const pastDue = isPastDue(assignment.dueAt);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (hasWork && !busy) submit.mutate();
      }}
      className="flex flex-col gap-5"
    >
      {type === "LINK" && (
        <FormField
          label="Link to your work"
          required
          invalid={linkInvalid}
          error={linkInvalid ? "Enter a full link, starting with https://" : undefined}
          hint={linkInvalid ? undefined : "For example a Figma file, Google Doc or GitHub repo"}
          inputProps={{
            type: "basic",
            size: "medium",
            value: link,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
              setLink(event.target.value),
            placeholder: "https://",
            leadingIcon: <Link2 />,
          }}
        />
      )}

      {type === "TEXT" && (
        <Field.Root className="flex flex-col">
          <Label required>Your answer</Label>
          <div className="mt-1.5">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write your answer here"
              className="min-h-48"
            />
          </div>
        </Field.Root>
      )}

      {type === "FILE_UPLOAD" && (
        <div className="flex flex-col gap-3">
          {submission?.fileUrl && files.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700">Saved file</p>
              <SubmittedWork work={submission} />
            </div>
          )}
          <FileDropzone
            label={submission?.fileUrl ? "Replace file" : "Your file"}
            files={files}
            onChange={setFiles}
            createFile={(file) => ({
              id: `${file.name}-${file.lastModified}`,
              name: file.name,
              sizeBytes: file.size,
              file,
            })}
            extensions={submissionFileExtensions}
            maxBytes={submissionFileMaxBytes}
            formatsLabel="PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG and MP4"
            multiple={false}
          />
        </div>
      )}

      {pastDue && (
        <p className="flex items-start gap-2 rounded-xl bg-surface-warning-badge px-3 py-2.5 text-xs text-text-warning">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          The due date has passed. You can still submit, but it will be marked late.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-text-error">
          {error.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={!hasWork || busy}
          className="w-full"
        >
          {submit.isPending ? "Submitting…" : "Submit assignment"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={!changed || !hasWork || busy}
          onClick={() => save.mutate()}
          className="w-full border-neutral-200 text-neutral-800"
        >
          {save.isPending ? "Saving…" : "Save draft"}
        </Button>
        <p className="text-center text-xs text-neutral-400">
          {savedAt && !changed
            ? `Draft saved at ${formatTime(savedAt)}`
            : "You can change your work until you submit it."}
        </p>
      </div>
    </form>
  );
}

function ResultCard({ submission }: { submission: StudentSubmission }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">Your grade</p>
      <p className="mt-1 text-3xl font-medium text-neutral-800">
        {submission.grade ?? "--"}
        <span className="text-base text-neutral-400">/100</span>
      </p>
      {submission.feedback && (
        <div className="mt-4 rounded-2xl bg-surface-brand p-4">
          <p className="text-xs font-medium text-brand-700">
            Feedback{submission.reviewer?.name ? ` from ${submission.reviewer.name}` : ""}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-600">
            {submission.feedback}
          </p>
        </div>
      )}
      {submission.reviewedAt && (
        <p className="mt-3 text-xs text-neutral-400">
          Reviewed {formatDue(submission.reviewedAt)}
        </p>
      )}
    </section>
  );
}

function AssignmentView({
  assignment,
  submission,
}: {
  assignment: StudentAssignment;
  submission: StudentSubmission | null;
}) {
  const editable = canEditSubmission(submission);
  const badge = submission ? submissionBadges[submission.status] : null;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-xs">
        <Link
          href={listHref}
          aria-label="Back to assignments"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link href={listHref} className="text-neutral-400 hover:text-neutral-600">
          Assignments
        </Link>
        <ChevronRight className="h-3 w-3 text-neutral-400" />
        <span className="truncate font-medium text-neutral-800">
          {assignment.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-medium text-neutral-800">
                {assignment.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                {assignment.dueAt ? `Due ${formatDue(assignment.dueAt)}` : "No due date"}
                {" · "}Submit as {submissionTypes[assignment.submissionType].toLowerCase()}
              </p>
            </div>
            <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {badge ? (
                <Badge variant="light" status={badge.status}>
                  {badge.label}
                </Badge>
              ) : (
                <Badge variant="light" status="neutral">
                  Not started
                </Badge>
              )}
              {submission?.isLate && (
                <Badge variant="light" status="warning">
                  Late
                </Badge>
              )}
            </span>
          </div>

          {assignment.description && (
            <section>
              <h2 className="text-sm font-medium text-neutral-800">Description</h2>
              <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-600">
                {assignment.description}
              </p>
            </section>
          )}

          {assignment.instructions && (
            <div className="rounded-2xl bg-surface-brand p-4">
              <p className="text-xs font-medium text-brand-700">
                Instructions from your instructor
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-600">
                {assignment.instructions}
              </p>
            </div>
          )}

          {assignment.attachments.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-neutral-800">Resources</h2>
              <div className="mt-3 flex flex-col gap-1 rounded-2xl bg-neutral-100 p-2">
                {assignment.attachments.map((url) => (
                  <ResourceRow
                    key={url}
                    resource={{ title: attachmentTitle(url), url }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          {submission?.status === "GRADED" && <ResultCard submission={submission} />}

          {submission?.status === "CHANGES_REQUESTED" && (
            <div className="flex items-start gap-3 rounded-2xl bg-surface-error-badge p-4">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-text-error" />
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Your instructor asked for changes
                </p>
                {submission.changesRequestedReason && (
                  <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-600">
                    {submission.changesRequestedReason}
                  </p>
                )}
              </div>
            </div>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-800">Your work</h2>
            <div className="mt-4">
              {editable ? (
                <SubmissionForm
                  key={submission?.updatedAt ?? "new"}
                  assignment={assignment}
                  submission={submission}
                />
              ) : (
                submission && (
                  <div className="flex flex-col gap-3">
                    <SubmittedWork work={submission} />
                    {submission.submittedAt && (
                      <p className="text-xs text-neutral-400">
                        Submitted {formatDue(submission.submittedAt)}
                      </p>
                    )}
                    {submission.status !== "GRADED" && (
                      <p className="text-xs text-neutral-500">
                        Your instructor will review it and you&apos;ll see your
                        grade here.
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AssignmentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-[280px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function StudentAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const assignmentQuery = useQuery(
    studentAssignmentQueries.assignment(assignmentId),
  );
  const submissionQuery = useQuery(
    studentAssignmentQueries.submission(assignmentId),
  );

  if (assignmentQuery.isPending || submissionQuery.isPending) {
    return <AssignmentSkeleton />;
  }

  if (assignmentQuery.isError || submissionQuery.isError) {
    return (
      <Notice
        icon={Lock}
        title="This assignment isn't available"
        message={
          assignmentQuery.error?.message ??
          submissionQuery.error?.message ??
          "It may not be published yet, or it may not be part of your track."
        }
      >
        <Link
          href={listHref}
          className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:bg-brand-primary-hover"
        >
          Back to assignments
        </Link>
      </Notice>
    );
  }

  return (
    <AssignmentView
      assignment={assignmentQuery.data}
      submission={submissionQuery.data}
    />
  );
}

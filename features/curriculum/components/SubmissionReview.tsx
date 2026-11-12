"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { SubmittedWork } from "@/components/assignments/SubmittedWork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileChip } from "@/components/ui/file-upload";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTime } from "@/features/curriculum/mappers";
import { useCurriculumScope } from "@/features/curriculum/scope";
import {
  submissionBadges,
  type ModuleAssignment,
  type SubmissionDetail,
  type SubmissionReview,
} from "@/features/curriculum/types";

function formatWhen(value: string) {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/* A whole number from 0 to `max`, or null while the field doesn't hold one. */
function parseScore(value: string, max: number) {
  if (!/^\d{1,4}$/.test(value.trim())) return null;
  const score = Number(value);
  return score <= max ? score : null;
}

/**
 * PENDING-BACKEND: the API has no draft grades, so a saved draft is kept for
 * the session only.
 */
const gradeDrafts = new Map<string, { score: string; feedback: string }>();

const imageFile = /\.(png|jpe?g|gif|webp)$/i;

/* One student's submission over the assignment sheet: their work, the brief, and grading. */
export function SubmissionReviewDialog({
  assignment,
  moduleLabel,
  submissionId,
  onClose,
}: {
  assignment: ModuleAssignment;
  /** e.g. "Module 1 - Introduction to Design". */
  moduleLabel?: string;
  submissionId: string;
  onClose: () => void;
}) {
  const { api } = useCurriculumScope();
  const submissionQuery = useQuery(api.queries.submission(submissionId));
  const submission = submissionQuery.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[1040px] p-0 sm:p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pr-16 sm:px-6 sm:pt-6 sm:pr-20">
          <div>
            <DialogTitle>View submission</DialogTitle>
            <DialogDescription className="mt-1 text-neutral-500">
              {[assignment.title, moduleLabel].filter(Boolean).join(" · ")}
            </DialogDescription>
          </div>
          {assignment.afterLesson && (
            <Badge variant="light" status="info">
              Attached to lesson {assignment.afterLesson}
            </Badge>
          )}
        </div>

        {submissionQuery.isPending ? (
          <ReviewSkeleton />
        ) : submissionQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-text-error"
          >
            <p>
              Couldn&apos;t load this submission.{" "}
              {submissionQuery.error.message}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => submissionQuery.refetch()}
              className="border-neutral-200 text-neutral-800"
            >
              Try again
            </Button>
          </div>
        ) : (
          submission && (
            <ReviewContent assignment={assignment} submission={submission} />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewContent({
  assignment,
  submission,
}: {
  assignment: ModuleAssignment;
  submission: SubmissionDetail;
}) {
  const student = submission.studentProfile?.user;
  const badge = submissionBadges[submission.status];
  const preview =
    submission.submissionType === "FILE_UPLOAD" &&
    submission.fileUrl &&
    imageFile.test(submission.fileName || submission.fileUrl)
      ? submission.fileUrl
      : null;

  return (
    <ReviewForm assignment={assignment} submission={submission}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-100 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={student?.name ?? "Student"} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">
              {student?.name ?? "Unknown student"}
            </p>
            <p className="truncate text-sm text-neutral-500">
              {student?.email}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="light" status={badge.status}>
              {badge.label}
            </Badge>
            {submission.isLate && (
              <Badge variant="light" status="warning">
                Late
              </Badge>
            )}
          </span>
          {submission.submittedAt && (
            <p className="text-xs text-neutral-500">
              Submitted {formatWhen(submission.submittedAt)}
            </p>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-neutral-200 p-4">
        <h3 className="font-bold text-neutral-800">Submitted work</h3>
        <div className="mt-3 flex flex-col gap-3">
          <SubmittedWork work={submission} />
          {preview && (
            // A picture the student uploaded, shown as it is.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={submission.fileName || "Submitted work"}
              className="w-full rounded-lg border border-neutral-200"
            />
          )}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-neutral-800">Assignment brief</h3>
        <p className="mt-2 text-sm font-medium text-neutral-800">
          {assignment.description}
        </p>
        {assignment.instructions && (
          <p className="mt-1 text-sm text-neutral-600">
            {assignment.instructions}
          </p>
        )}
        {assignment.resources.length > 0 && (
          <>
            <p className="mt-3 text-sm font-medium text-neutral-800">
              Supporting resources
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {assignment.resources.map((file) => (
                <FileChip key={file.id} file={file} />
              ))}
            </div>
          </>
        )}
      </section>
    </ReviewForm>
  );
}

/* The work on the left, the grading panel on the right, and the publish bar below. */
function ReviewForm({
  assignment,
  submission,
  children,
}: {
  assignment: ModuleAssignment;
  submission: SubmissionDetail;
  children: React.ReactNode;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();
  const max = assignment.maxPoints;
  const saved = gradeDrafts.get(submission.id);
  const [score, setScore] = React.useState(saved?.score ?? "");
  const [feedback, setFeedback] = React.useState(saved?.feedback ?? "");
  const [draftSaved, setDraftSaved] = React.useState(false);
  const [requestingChanges, setRequestingChanges] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const review = useMutation({
    mutationFn: (input: SubmissionReview) =>
      api.reviewSubmission(submission.id, input),
    onSuccess: (_, input) => {
      if (input.status !== "UNDER_REVIEW") gradeDrafts.delete(submission.id);
      setRequestingChanges(false);
      queryClient.invalidateQueries({
        queryKey: api.keys.submission(submission.id),
      });
      queryClient.invalidateQueries({
        queryKey: api.keys.submissions(submission.assignmentId),
      });
    },
  });

  const gradeable =
    submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW";
  const parsedScore = parseScore(score, max);
  const scoreInvalid = score.trim() !== "" && parsedScore === null;

  return (
    <>
      <div className="grid items-start gap-5 px-4 pt-5 pb-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">{children}</div>

        <section className="rounded-xl border border-neutral-200 p-4">
          <h3 className="font-bold text-neutral-800">Grade submission</h3>

          {submission.status === "DRAFT" && (
            <p className="mt-2 text-sm text-neutral-500">
              The student is still working on this and hasn&apos;t submitted it
              yet.
            </p>
          )}

          {submission.status === "GRADED" && (
            <div className="mt-3 flex flex-col gap-4 text-sm">
              <p className="text-3xl font-medium text-neutral-800">
                {submission.grade ?? "--"}
                <span className="text-base text-neutral-400">/{max}</span>
              </p>
              {submission.feedback && (
                <div>
                  <p className="font-medium text-neutral-800">
                    Written feedback
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-600">
                    {submission.feedback}
                  </p>
                </div>
              )}
              {submission.reviewedAt && (
                <p className="text-xs text-neutral-400">
                  Published {formatWhen(submission.reviewedAt)}
                  {submission.reviewer?.name &&
                    ` by ${submission.reviewer.name}`}
                </p>
              )}
            </div>
          )}

          {submission.status === "CHANGES_REQUESTED" && (
            <div className="mt-2 flex flex-col gap-3 text-sm">
              <p className="text-neutral-500">
                You asked for changes. The student can edit their work and
                submit it again.
              </p>
              {submission.changesRequestedReason && (
                <div className="rounded-xl bg-neutral-100 p-3">
                  <p className="font-medium text-neutral-800">Your note</p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-600">
                    {submission.changesRequestedReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {gradeable && requestingChanges && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (reason.trim()) {
                  review.mutate({
                    status: "CHANGES_REQUESTED",
                    changesRequestedReason: reason.trim(),
                  });
                }
              }}
              className="mt-3 flex flex-col gap-4"
            >
              <Field.Root className="flex flex-col">
                <Label required>What should the student change?</Label>
                <div className="mt-1.5">
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain what needs to change before you can grade it"
                    className="min-h-28"
                  />
                </div>
              </Field.Root>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!reason.trim() || review.isPending}
                >
                  {review.isPending ? "Sending…" : "Send to student"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRequestingChanges(false)}
                  className="border-neutral-200 text-neutral-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {gradeable && !requestingChanges && (
            <div className="mt-2 flex flex-col gap-4">
              <p className="text-xs text-neutral-500">
                Only instructors can see this draft. No grade or feedback has
                been published.
              </p>
              <FormField
                label={`Score / ${max}`}
                required
                invalid={scoreInvalid}
                error={
                  scoreInvalid
                    ? `Enter a whole number from 0 to ${max}`
                    : undefined
                }
                hint={
                  scoreInvalid
                    ? undefined
                    : `Maximum points: ${max} · Draft score: ${parsedScore ?? "--"}/${max}`
                }
                inputProps={{
                  type: "basic",
                  size: "medium",
                  inputMode: "numeric",
                  value: score,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setScore(event.target.value);
                    setDraftSaved(false);
                  },
                  placeholder: "e.g. 85",
                  leadingIcon: null,
                }}
              />
              <Field.Root className="flex flex-col">
                <Label icon={<></>}>Written feedback</Label>
                <div className="mt-1.5">
                  <Textarea
                    value={feedback}
                    onChange={(event) => {
                      setFeedback(event.target.value);
                      setDraftSaved(false);
                    }}
                    placeholder="What went well, and what to work on next"
                    className="min-h-28"
                  />
                </div>
              </Field.Root>
              <p className="flex gap-2 rounded-lg bg-surface-brand p-3 text-xs leading-5 text-neutral-600">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Students see their score out of {max} and written feedback only
                once you publish the grade.
              </p>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => setRequestingChanges(true)}
                className="w-fit text-xs font-medium text-brand-primary hover:underline disabled:text-neutral-400"
              >
                Request changes instead
              </button>
            </div>
          )}

          {review.isError && (
            <p role="alert" className="mt-3 text-xs text-text-error">
              {review.error.message}
            </p>
          )}
        </section>
      </div>

      {gradeable && !requestingChanges && (
        <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-neutral-500" aria-live="polite">
            {draftSaved
              ? "Draft saved. Only instructors can see it."
              : "Save privately or publish when your review is complete."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={review.isPending}
              onClick={() => {
                gradeDrafts.set(submission.id, { score, feedback });
                setDraftSaved(true);
                // The student sees their work is being reviewed, not the draft.
                if (submission.status === "SUBMITTED") {
                  review.mutate({ status: "UNDER_REVIEW" });
                }
              }}
              className="border-neutral-200 text-neutral-800"
            >
              Save draft
            </Button>
            <Button
              disabled={parsedScore === null || review.isPending}
              onClick={() =>
                parsedScore !== null &&
                review.mutate({
                  status: "GRADED",
                  grade: parsedScore,
                  ...(feedback.trim() && { feedback: feedback.trim() }),
                })
              }
            >
              {review.isPending ? "Publishing…" : "Publish grade"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewSkeleton() {
  return (
    <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

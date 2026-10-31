"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { SubmittedWork } from "@/components/assignments/SubmittedWork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTime } from "@/features/curriculum/mappers";
import { useCurriculumScope } from "@/features/curriculum/scope";
import {
  submissionBadges,
  submissionTypes,
  type SubmissionDetail,
  type SubmissionReview,
} from "@/features/curriculum/types";

function formatWhen(value: string) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

/* A whole number from 0 to 100, or null while the field doesn't hold one. */
function parseGrade(value: string) {
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  const grade = Number(value);
  return grade <= 100 ? grade : null;
}

/* One student's submission: their work, and the instructor's review actions. */
export function SubmissionReviewPanel({
  assignmentId,
  submissionId,
  onBack,
}: {
  assignmentId: string;
  submissionId: string;
  onBack: () => void;
}) {
  const { api } = useCurriculumScope();
  const submissionQuery = useQuery(api.queries.submission(submissionId));
  const submission = submissionQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ChevronLeft className="h-4 w-4" />
        All submissions
      </button>

      {submissionQuery.isPending ? (
        <ReviewSkeleton />
      ) : submissionQuery.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 py-10 text-center text-sm text-text-error"
        >
          <p>Couldn&apos;t load this submission. {submissionQuery.error.message}</p>
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
          <ReviewContent assignmentId={assignmentId} submission={submission} />
        )
      )}
    </div>
  );
}

function ReviewContent({
  assignmentId,
  submission,
}: {
  assignmentId: string;
  submission: SubmissionDetail;
}) {
  const student = submission.studentProfile?.user;
  const badge = submissionBadges[submission.status];
  const cohort = submission.enrollment?.cohort?.name;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PersonAvatar name={student?.name ?? "Student"} size={48} />
          <div>
            {/* The sheet's title is already set by the Submissions tab. */}
            <h2 className="text-xl font-bold text-neutral-800">
              {student?.name ?? "Unknown student"}
            </h2>
            <p className="text-sm text-neutral-500">
              {[student?.email, cohort].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
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
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-800">Submission</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {submissionTypes[submission.submissionType]}
            {submission.submittedAt &&
              ` · Submitted ${formatWhen(submission.submittedAt)}`}
          </p>
          <div className="mt-4">
            <SubmittedWork work={submission} />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-800">Review</h3>
          <div className="mt-4">
            <ReviewActions assignmentId={assignmentId} submission={submission} />
          </div>
        </section>
      </div>
    </>
  );
}

function ReviewActions({
  assignmentId,
  submission,
}: {
  assignmentId: string;
  submission: SubmissionDetail;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();
  const [grade, setGrade] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [requestingChanges, setRequestingChanges] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const review = useMutation({
    mutationFn: (input: SubmissionReview) =>
      api.reviewSubmission(submission.id, input),
    onSuccess: () => {
      setRequestingChanges(false);
      queryClient.invalidateQueries({
        queryKey: api.keys.submission(submission.id),
      });
      queryClient.invalidateQueries({
        queryKey: api.keys.submissions(assignmentId),
      });
    },
  });

  if (submission.status === "DRAFT") {
    return (
      <p className="text-sm text-neutral-500">
        The student is still working on this and hasn&apos;t submitted it yet.
      </p>
    );
  }

  if (submission.status === "GRADED") {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <p className="text-neutral-500">Grade</p>
          <p className="mt-1 text-3xl font-medium text-neutral-800">
            {submission.grade ?? "--"}
            <span className="text-base text-neutral-400">/100</span>
          </p>
        </div>
        {submission.feedback && (
          <div>
            <p className="font-medium text-neutral-800">Feedback</p>
            <p className="mt-1 whitespace-pre-wrap text-neutral-600">
              {submission.feedback}
            </p>
          </div>
        )}
        {submission.reviewedAt && (
          <p className="text-xs text-neutral-400">
            Graded {formatWhen(submission.reviewedAt)}
            {submission.reviewer?.name && ` by ${submission.reviewer.name}`}
          </p>
        )}
      </div>
    );
  }

  if (submission.status === "CHANGES_REQUESTED") {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-neutral-500">
          You asked for changes. The student can edit their work and submit it
          again.
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
    );
  }

  const parsedGrade = parseGrade(grade);
  const gradeInvalid = grade.trim() !== "" && parsedGrade === null;

  return (
    <div className="flex flex-col gap-5">
      {submission.status === "SUBMITTED" && (
        <div className="flex flex-col gap-2 rounded-xl bg-neutral-100 p-3 text-sm">
          <p className="text-neutral-600">
            Let the student know you&apos;re looking at their work.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={review.isPending}
            onClick={() => review.mutate({ status: "UNDER_REVIEW" })}
            className="w-fit border-neutral-200 text-neutral-800"
          >
            Start review
          </Button>
        </div>
      )}

      {requestingChanges ? (
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
          className="flex flex-col gap-4"
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
            <Button type="submit" disabled={!reason.trim() || review.isPending}>
              {review.isPending ? "Sending…" : "Send to student"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRequestingChanges(false)}
              className="border-neutral-200 text-neutral-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (parsedGrade !== null) {
              review.mutate({
                status: "GRADED",
                grade: parsedGrade,
                ...(feedback.trim() && { feedback: feedback.trim() }),
              });
            }
          }}
          className="flex flex-col gap-4"
        >
          <FormField
            label="Grade"
            required
            invalid={gradeInvalid}
            error={gradeInvalid ? "Enter a whole number from 0 to 100" : undefined}
            hint={gradeInvalid ? undefined : "Out of 100"}
            inputProps={{
              type: "basic",
              size: "medium",
              inputMode: "numeric",
              value: grade,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                setGrade(event.target.value),
              placeholder: "e.g. 85",
              leadingIcon: null,
            }}
          />
          <Field.Root className="flex flex-col">
            <Label icon={<></>}>Feedback</Label>
            <div className="mt-1.5">
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="What went well, and what to work on next"
                className="min-h-28"
              />
            </div>
          </Field.Root>
          <Button type="submit" disabled={parsedGrade === null || review.isPending}>
            {review.isPending ? "Saving…" : "Save grade"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={review.isPending}
            onClick={() => setRequestingChanges(true)}
            className="border-neutral-200 text-neutral-800"
          >
            Request changes
          </Button>
        </form>
      )}

      {review.isError && (
        <p role="alert" className="text-xs text-text-error">
          {review.error.message}
        </p>
      )}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

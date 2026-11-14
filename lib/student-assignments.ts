import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type {
  AssignmentInstructions,
  AssignmentRecord,
  SubmissionStatus,
  SubmissionType,
  SubmittedWork,
} from "@/features/curriculum/types";

export function assignmentHref(assignmentId: string) {
  return `/student/assignments/${assignmentId}`;
}

/* GET /student/assignments/{id}, and the assignments inside the curriculum content. */
export type StudentAssignment = Omit<AssignmentRecord, "instructions"> & {
  instructions?: AssignmentInstructions | string | null;
  submissionLabel?: string | null;
  studentAssignment?: {
    status: SubmissionStatus;
    submittedAt?: string | null;
    missedAt?: string | null;
  };
};

/* The student's own submission for one assignment. */
export type StudentSubmission = SubmittedWork & {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  status: SubmissionStatus;
  submittedAt?: string | null;
  /** Set when the deadline passed before the work was handed in. */
  missedAt?: string | null;
  score?: number | null;
  feedback?: string | null;
  note?: string | null;
  reviewedAt?: string | null;
  changesRequestedReason?: string | null;
  updatedAt: string;
  assignment?: {
    id: string;
    title: string;
    dueAt?: string | null;
    submissionType: SubmissionType;
    maxScore?: number | null;
  };
  reviewer?: { name?: string } | null;
};

export function isLateSubmission(submission: StudentSubmission) {
  return Boolean(submission.submittedAt && submission.missedAt);
}

export function formatScore(score: number | null | undefined, maxScore?: number | null) {
  if (score == null) return null;
  return maxScore ? `${score}/${maxScore}` : String(score);
}

/* What the student is handing in. A file is sent as a multipart upload. */
export type SubmissionDraft =
  | { submissionType: "LINK"; linkUrl: string }
  | { submissionType: "TEXT"; textContent: string }
  | { submissionType: "FILE_UPLOAD"; file: File };

/* Files the API accepts for a submission, up to 25 MB. */
export const submissionFileExtensions = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".zip",
  ".jpg",
  ".jpeg",
  ".png",
  ".mp4",
] as const;
export const submissionFileMaxBytes = 25e6;

/* Work not yet handed in, or sent back, can still be changed. Late work is accepted. */
const editableStatuses: SubmissionStatus[] = [
  "ASSIGNED",
  "DRAFT",
  "MISSED",
  "CHANGES_REQUESTED",
];

export function canEditSubmission(submission: StudentSubmission | null) {
  return !submission || editableStatuses.includes(submission.status);
}

async function getAssignment(assignmentId: string) {
  const { data } = await api.get<Envelope<StudentAssignment>>(
    `/student/assignments/${assignmentId}`,
  );
  return data;
}

async function getMySubmission(assignmentId: string) {
  const { data } = await api.get<Envelope<StudentSubmission | null>>(
    `/student/assignments/${assignmentId}/submission`,
  );
  return data ?? null;
}

export async function saveSubmissionDraft(
  assignmentId: string,
  draft: SubmissionDraft,
) {
  let body: unknown = draft;
  if (draft.submissionType === "FILE_UPLOAD") {
    const form = new FormData();
    form.append("submissionType", draft.submissionType);
    form.append("file", draft.file);
    body = form;
  }
  const { data } = await api.post<Envelope<StudentSubmission>>(
    `/student/assignments/${assignmentId}/submission`,
    body,
  );
  return data;
}

/* Hands in the work, or the saved draft when `work` is null. The API marks it late if needed. */
export async function submitAssignment(
  assignmentId: string,
  work: SubmissionDraft | null = null,
) {
  let body: unknown;
  if (work?.submissionType === "FILE_UPLOAD") {
    const form = new FormData();
    form.append("file", work.file);
    body = form;
  } else if (work?.submissionType === "LINK") {
    body = { linkUrl: work.linkUrl };
  } else if (work?.submissionType === "TEXT") {
    body = { textContent: work.textContent };
  }
  const { data } = await api.post<Envelope<StudentSubmission>>(
    `/student/assignments/${assignmentId}/submit`,
    body,
  );
  return data;
}

async function listEnrollmentSubmissions(enrollmentId: string) {
  const { data } = await api.get<Envelope<Paginated<StudentSubmission>>>(
    `/student/enrollments/${enrollmentId}/submissions`,
    { query: { limit: 100 } },
  );
  return data;
}

export const studentAssignmentKeys = {
  assignment: (assignmentId: string) =>
    ["student", "assignments", assignmentId] as const,
  submission: (assignmentId: string) =>
    ["student", "assignments", assignmentId, "submission"] as const,
  /* Every enrollment's list sits under this prefix, so one invalidate refreshes them all. */
  allSubmissions: ["student", "submissions"] as const,
  enrollmentSubmissions: (enrollmentId: string) =>
    ["student", "submissions", enrollmentId] as const,
};

export const studentAssignmentQueries = {
  assignment: (assignmentId: string) =>
    queryOptions({
      queryKey: studentAssignmentKeys.assignment(assignmentId),
      queryFn: () => getAssignment(assignmentId),
    }),

  submission: (assignmentId: string) =>
    queryOptions({
      queryKey: studentAssignmentKeys.submission(assignmentId),
      queryFn: () => getMySubmission(assignmentId),
    }),

  enrollmentSubmissions: (enrollmentId: string) =>
    queryOptions({
      queryKey: studentAssignmentKeys.enrollmentSubmissions(enrollmentId),
      queryFn: () => listEnrollmentSubmissions(enrollmentId),
    }),
};

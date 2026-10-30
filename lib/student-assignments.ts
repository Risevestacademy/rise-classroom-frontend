import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type {
  SubmissionStatus,
  SubmissionType,
  SubmittedWork,
} from "@/features/curriculum/types";

export function assignmentHref(assignmentId: string) {
  return `/student/assignments/${assignmentId}`;
}

/* GET /student/assignments/{id}. Only published assignments on the student's track. */
export type StudentAssignment = {
  id: string;
  lessonId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueAt?: string | null;
  submissionType: SubmissionType;
  attachments: string[];
};

/* The student's own submission for one assignment. */
export type StudentSubmission = SubmittedWork & {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  status: SubmissionStatus;
  submittedAt?: string | null;
  isLate: boolean;
  grade?: number | null;
  feedback?: string | null;
  reviewedAt?: string | null;
  changesRequestedReason?: string | null;
  updatedAt: string;
  assignment?: {
    id: string;
    title: string;
    dueAt?: string | null;
    submissionType: SubmissionType;
  };
  reviewer?: { name: string } | null;
};

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

/* A draft or a returned submission can still be changed; anything handed in can't. */
export function canEditSubmission(submission: StudentSubmission | null) {
  return (
    !submission ||
    submission.status === "DRAFT" ||
    submission.status === "CHANGES_REQUESTED"
  );
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

/* Hands in the saved draft. The API checks it matches the submission type and marks it late if needed. */
export async function submitAssignment(assignmentId: string) {
  const { data } = await api.post<Envelope<StudentSubmission>>(
    `/student/assignments/${assignmentId}/submit`,
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

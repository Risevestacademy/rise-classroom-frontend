import { queryOptions } from "@tanstack/react-query";

import type { Cohort, Track } from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
import type { OnboardingStatus, UserStatus } from "@/lib/auth";

export type WeeklyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "OVERDUE";

export type PublishStatus = "DRAFT" | "PUBLISHED";
export type SubmissionType = "FILE_UPLOAD" | "LINK" | "TEXT";
export type ResourceType = "PDF" | "VIDEO" | "DOCUMENT" | "IMAGE" | "LINK";
export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "GRADED";

/** An instructor's assignment to one track within one cohort. */
export type InstructorTrack = {
  id: string;
  instructorId: string;
  trackId: string;
  cohortId: string;
  track: Track;
  cohort?: Cohort;
};

export type InstructorStudent = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    onboardingStatus: OnboardingStatus;
  };
};

export type WeeklyTask = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: WeeklyTaskStatus;
  submissionLink?: string | null;
  submittedAt?: string | null;
  isLate: boolean;
  reviewedAt?: string | null;
  feedback?: string | null;
  topic?: { id: string; title?: string } | null;
};

export type WeeklyTaskFilters = {
  cohortId?: string;
  trackId?: string;
  studentId?: string;
  status?: WeeklyTaskStatus;
  week?: string;
  page?: number;
  limit?: number;
};

export type CurriculumRecord = {
  id: string;
  title: string;
  description?: string | null;
  status: "ONGOING" | "COMPLETED";
  publishStatus: PublishStatus;
  progressMode: "SEQUENTIAL" | "FLEXIBLE";
  trackId: string;
  cohortId?: string | null;
  cohort?: { id: string; name: string } | null;
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
  assignedInstructors: { id: string; name: string; email: string }[];
};

export type TopicRecord = {
  id: string;
  title: string;
  description: string;
  position: number;
  curriculumId: string;
  publishStatus: PublishStatus;
  outcomes: string[];
  _count?: {
    lessons: number;
    prerequisites: number;
  };
};

export type LessonRecord = {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  position: number;
  topic?: { id: string; title: string };
};

export type ResourceRecord = {
  id: string;
  lessonId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string | null;
  url: string;
  type: ResourceType;
  fileName?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  publishStatus: PublishStatus;
  uploadedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RecordingRecord = {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  durationSec?: number | null;
};

export type AssignmentRecord = {
  id: string;
  lessonId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueAt?: string | null;
  submissionType: SubmissionType;
  publishStatus: PublishStatus;
  attachments: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AssignmentSubmissionRecord = {
  id: string;
  assignmentId: string;
  studentProfileId: string;
  enrollmentId: string;
  submissionType: SubmissionType;
  linkUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  textContent?: string | null;
  status: SubmissionStatus;
  submittedAt?: string | null;
  isLate: boolean;
  grade?: number | null;
  feedback?: string | null;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  changesRequestedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  assignment?: {
    id: string;
    title: string;
    dueAt?: string | null;
    submissionType: SubmissionType;
    instructions?: string | null;
  };
  studentProfile?: {
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; image?: string | null };
  };
  enrollment?: { id: string; cohortId: string; cohort?: { id: string; name: string } };
  reviewer?: { id: string; name: string; email: string; image?: string | null } | null;
};

export type SubmissionFilters = {
  assignmentId?: string;
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  cohortId?: string;
  studentId?: string;
  isLate?: boolean;
  search?: string;
};

export type ReviewSubmissionInput =
  | { status: "UNDER_REVIEW" }
  | { status: "CHANGES_REQUESTED"; changesRequestedReason: string }
  | { status: "GRADED"; grade: number; feedback?: string };

export type NoteRecord = {
  id: string;
  curriculumId: string;
  authorId: string;
  topicId?: string | null;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt?: string;
  updatedAt?: string;
  author?: { id: string; firstName: string; lastName: string; email: string } | null;
  topic?: { id: string; title: string } | null;
};

/** Where an item sits in the track. Module-level items have no lesson. */
export type TopicContext = {
  curriculum: { id: string; title: string };
  topic: { id: string; title: string };
};

export type LessonContext = TopicContext & {
  lesson: { id: string; title: string };
};

export type TrackContext = TopicContext & {
  lesson: { id: string; title: string } | null;
};

export type InTrack<T> = T & TrackContext;

export type TrackContent = {
  assignments: InTrack<AssignmentRecord>[];
  resources: InTrack<ResourceRecord>[];
  recordings: InTrack<RecordingRecord>[];
};

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

export function fileTypeFromUrl(url: string): string {
  let host = "";
  let path = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    path = parsed.pathname.toLowerCase();
  } catch {
    return "Link";
  }

  if (/(youtube\.com|youtu\.be|vimeo\.com|loom\.com)/.test(host)) return "Video";
  if (/figma\.com/.test(host)) return "Figma";

  const types: Record<string, string> = {
    pdf: "PDF",
    doc: "Doc",
    docx: "Doc",
    ppt: "Slides",
    pptx: "Slides",
    xls: "Sheet",
    xlsx: "Sheet",
    png: "Image",
    jpg: "Image",
    jpeg: "Image",
    gif: "Image",
    svg: "Image",
    mp4: "Video",
    mov: "Video",
    zip: "Archive",
  };

  return types[path.split(".").pop() ?? ""] ?? "Link";
}

/** Default resource type for a link, for forms that don't ask. */
export function resourceTypeFromUrl(url: string): ResourceType {
  const label = fileTypeFromUrl(url);
  if (label === "PDF") return "PDF";
  if (label === "Video") return "VIDEO";
  if (label === "Image") return "IMAGE";
  if (["Doc", "Slides", "Sheet"].includes(label)) return "DOCUMENT";
  return "LINK";
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Read requests                                                              */
/* -------------------------------------------------------------------------- */

async function listMyTracks() {
  const { data } = await api.get<Envelope<InstructorTrack[]>>(
    "/instructor/tracks"
  );

  return data;
}

async function listStudents(params: { cohortId?: string; trackId?: string }) {
  const { data } = await api.get<Envelope<InstructorStudent[]>>(
    "/instructor/students",
    { query: params }
  );

  return data;
}

async function listWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { data } = await api.get<Envelope<Paginated<WeeklyTask>>>(
    "/instructor/weekly-tasks",
    { query: filters }
  );

  return data;
}

/** Number of matching tasks, without pulling a full page of rows. */
async function countWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { total } = await listWeeklyTasks({ ...filters, page: 1, limit: 1 });
  return total;
}

async function listCurriculum(params: { trackId: string }) {
  const response = await api.get<Envelope<CurriculumRecord[]>>(
    `/instructor/tracks/${params.trackId}/curriculums`,
  );
  return response.data;
}

/** Curriculums across all of the instructor's tracks, with optional filters. */
async function listAllCurriculums(filters: {
  trackId?: string;
  cohortId?: string;
  publishStatus?: PublishStatus;
  status?: "ONGOING" | "COMPLETED";
}) {
  const response = await api.get<Envelope<CurriculumRecord[]>>(
    "/instructor/curriculums",
    { query: filters }
  );
  return response.data;
}

async function getACurriculum(params: { curriculumId: string}) {
  const response = await api.get<Envelope<CurriculumRecord>>(
    `/instructor/curriculums/${params.curriculumId}`,
  );
  return response.data;
}

export type CurriculumUpdateInput = {
  title: string;
  description: string;
  publishStatus: PublishStatus;
  progressMode: "SEQUENTIAL" | "FLEXIBLE";
};

export async function updateCurriculum(
  curriculumId: string,
  input: CurriculumUpdateInput
) {
  const response = await api.patch<Envelope<CurriculumRecord>>(
    `/instructor/curriculums/${curriculumId}`,
    input
  );
  return response.data;
}

async function listTopics(params: { curriculumId: string }) {
  const response = await api.get<Envelope<TopicRecord[]>>(
    `/instructor/curriculums/${params.curriculumId}/topics`,
  );
  return response.data;
}

async function listLessons(params: { topicId: string }) {
  const response = await api.get<Envelope<LessonRecord[]>>(
    `/instructor/topics/${params.topicId}/lessons`,
  );
  return response.data;
}

async function listResources(params: { lessonId: string }) {
  const response = await api.get<Envelope<ResourceRecord[]>>(
    `/instructor/lessons/${params.lessonId}/resources`,
  );
  return response.data;
}

async function listAssignments(params: { lessonId: string }) {
  const response = await api.get<Envelope<AssignmentRecord[]>>(
    `/instructor/lessons/${params.lessonId}/assignments`,
  );
  return response.data;
}

async function listRecordings(params: { lessonId: string }) {
  const response = await api.get<Envelope<RecordingRecord[]>>(
    `/instructor/lessons/${params.lessonId}/recordings`,
  );
  return response.data;
}

/** Resources attached to a module itself, not to one of its lessons. */
async function listTopicResources(params: { topicId: string }) {
  const response = await api.get<Envelope<ResourceRecord[]>>(
    `/instructor/topics/${params.topicId}/resources`,
  );
  return response.data;
}

/** Assignments attached to a module itself, not to one of its lessons. */
async function listTopicAssignments(params: { topicId: string }) {
  const response = await api.get<Envelope<AssignmentRecord[]>>(
    `/instructor/topics/${params.topicId}/assignments`,
  );
  return response.data;
}

async function listNotes(params: { curriculumId: string }) {
  const response = await api.get<Envelope<NoteRecord[]>>(
    `/instructor/curriculums/${params.curriculumId}/notes`,
  );
  return response.data;
}

async function listAssignmentSubmissions({
  assignmentId,
  ...query
}: SubmissionFilters & { assignmentId: string }) {
  const response = await api.get<
    Envelope<Paginated<AssignmentSubmissionRecord>>
  >(`/instructor/assignments/${assignmentId}/submissions`, { query });
  return response.data;
}

export async function getASubmission(submissionId: string) {
  const { data } = await api.get<Envelope<AssignmentSubmissionRecord>>(
    `/instructor/submissions/${submissionId}`
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/* Track tree                                                                 */
/* -------------------------------------------------------------------------- */

/** Walks curriculum → topic → lesson once, in position order. */
async function listTrackTree(params: { trackId: string }) {
  const curriculums = await listCurriculum(params);

  const nested = await Promise.all(
    curriculums.map(async (curriculum) => {
      const topics = [
        ...(await listTopics({ curriculumId: curriculum.id })),
      ].sort((a, b) => a.position - b.position);

      return Promise.all(
        topics.map(async (topic) => {
          const lessons = [...(await listLessons({ topicId: topic.id }))].sort(
            (a, b) => a.position - b.position
          );

          const topicContext: TopicContext = {
            curriculum: { id: curriculum.id, title: curriculum.title },
            topic: { id: topic.id, title: topic.title },
          };

          return {
            topicContext,
            lessons: lessons.map(
              (lesson): LessonContext => ({
                ...topicContext,
                lesson: { id: lesson.id, title: lesson.title },
              })
            ),
          };
        })
      );
    })
  );

  return nested.flat();
}

// async function listTrackLessons(params: {
//   trackId: string;
// }): Promise<LessonContext[]> {
//   const tree = await listTrackTree(params);
//   return tree.flatMap((node) => node.lessons);
// }

/**
 * Every assignment, resource and recording in a track. The API has no single
 * endpoint for this, so the tree is walked once. Lesson-level items come from
 * each lesson, and module-level items (no lesson) from each module.
 */
async function listTrackContent(params: {
  trackId: string;
}): Promise<TrackContent> {
  const tree = await listTrackTree(params);

  const attach = <T>(items: T[], context: TrackContext) =>
    items.map((item) => ({ ...item, ...context }));

  const perTopic = await Promise.all(
    tree.map(async ({ topicContext, lessons }) => {
      const topicId = topicContext.topic.id;

      const [topicAssignments, topicResources, perLesson] = await Promise.all([
        listTopicAssignments({ topicId }),
        listTopicResources({ topicId }),
        Promise.all(
          lessons.map(async (context) => {
            const lessonId = context.lesson.id;
            const [assignments, resources, recordings] = await Promise.all([
              listAssignments({ lessonId }),
              listResources({ lessonId }),
              listRecordings({ lessonId }),
            ]);

            return {
              assignments: attach(assignments, context),
              resources: attach(resources, context),
              recordings: attach(recordings, context),
            };
          })
        ),
      ]);

      // Only items with no lesson are module-level. Lesson-level ones were
      // already fetched above, so this avoids listing them twice.
      const moduleLevel: TrackContext = { ...topicContext, lesson: null };

      return {
        assignments: [
          ...attach(
            topicAssignments.filter((assignment) => !assignment.lessonId),
            moduleLevel
          ),
          ...perLesson.flatMap((l) => l.assignments),
        ],
        resources: [
          ...attach(
            topicResources.filter((resource) => !resource.lessonId),
            moduleLevel
          ),
          ...perLesson.flatMap((l) => l.resources),
        ],
        recordings: perLesson.flatMap((l) => l.recordings),
      };
    })
  );

  return {
    assignments: perTopic.flatMap((t) => t.assignments),
    resources: perTopic.flatMap((t) => t.resources),
    recordings: perTopic.flatMap((t) => t.recordings),
  };
}

/* -------------------------------------------------------------------------- */
/* Write requests                                                             */
/* -------------------------------------------------------------------------- */

type TopicInput = {
  title: string;
  description: string;
  position: number;
  publishStatus: PublishStatus;
  outcomes: string[];
};

export async function createTopic(curriculumId: string, input: TopicInput) {
  const { data } = await api.post<Envelope<TopicRecord>>(
    `/instructor/curriculums/${curriculumId}/topics`,
    input
  );
  return data;
}

export async function updateTopic(topicId: string, input: Partial<TopicInput>) {
  const { data } = await api.patch<Envelope<TopicRecord>>(
    `/instructor/topics/${topicId}`,
    input
  );
  return data;
}

export async function unlockTopic(topicId: string, input: { unlocked: boolean }) {
  const response = await api.post<{ unlocked: boolean }>(
    `/instructor/topics/${topicId}/unlock-all`,
    input
  );
  return response;
}

export async function createLesson(
  topicId: string,
  input: { title: string; description?: string; position?: number }
) {
  const { data } = await api.post<Envelope<LessonRecord>>(
    `/instructor/topics/${topicId}/lessons`,
    input
  );
  return data;
}

export async function updateLesson(
  lessonId: string,
  input: {
    title?: string;
    description?: string | null;
    position?: number | null;
  }
) {
  const { data } = await api.patch<Envelope<LessonRecord>>(
    `/instructor/lessons/${lessonId}`,
    input
  );
  return data;
}

export async function deleteLesson(lessonId: string) {
  await api.delete(`/instructor/lessons/${lessonId}`);
}

export type ResourceInput = {
  title: string;
  url: string;
  description?: string;
  type?: ResourceType;
  fileName?: string;
  sizeBytes?: number;
  mimeType?: string;
  publishStatus?: PublishStatus;
};

export async function createResource(lessonId: string, input: ResourceInput) {
  const { data } = await api.post<Envelope<ResourceRecord>>(
    `/instructor/lessons/${lessonId}/resources`,
    input
  );
  return data;
}

/** A resource on the module itself, not on a lesson. */
export async function createTopicResource(
  topicId: string,
  input: ResourceInput
) {
  const { data } = await api.post<Envelope<ResourceRecord>>(
    `/instructor/topics/${topicId}/resources`,
    input
  );
  return data;
}

export async function updateResource(
  resourceId: string,
  input: Partial<Omit<ResourceInput, "description" | "fileName" | "sizeBytes" | "mimeType">> & {
    description?: string | null;
    fileName?: string | null;
    sizeBytes?: number | null;
    mimeType?: string | null;
  }
) {
  const { data } = await api.patch<Envelope<ResourceRecord>>(
    `/instructor/resources/${resourceId}`,
    input
  );
  return data;
}

export async function deleteResource(resourceId: string) {
  await api.delete(`/instructor/resources/${resourceId}`);
}

export type AssignmentInput = {
  title: string;
  description?: string;
  instructions?: string;
  dueAt?: string;
  submissionType?: SubmissionType;
  publishStatus?: PublishStatus;
  attachments?: string[];
};

export async function createAssignment(
  lessonId: string,
  input: AssignmentInput
) {
  const { data } = await api.post<Envelope<AssignmentRecord>>(
    `/instructor/lessons/${lessonId}/assignments`,
    input
  );
  return data;
}

/** An assignment on the module itself, not on a lesson. */
export async function createTopicAssignment(
  topicId: string,
  input: AssignmentInput
) {
  const { data } = await api.post<Envelope<AssignmentRecord>>(
    `/instructor/topics/${topicId}/assignments`,
    input
  );
  return data;
}

export async function updateAssignment(
  assignmentId: string,
  input: Partial<
    Omit<AssignmentInput, "description" | "instructions" | "dueAt">
  > & {
    description?: string | null;
    instructions?: string | null;
    dueAt?: string | null;
    /** Moves the assignment to another lesson, or null for module level. */
    lessonId?: string | null;
  }
) {
  const { data } = await api.patch<Envelope<AssignmentRecord>>(
    `/instructor/assignments/${assignmentId}`,
    input
  );
  return data;
}

export async function deleteAssignment(assignmentId: string) {
  await api.delete(`/instructor/assignments/${assignmentId}`);
}

export async function createRecording(
  lessonId: string,
  input: { title: string; url: string; durationSec?: number }
) {
  const { data } = await api.post<Envelope<RecordingRecord>>(
    `/instructor/lessons/${lessonId}/recordings`,
    input
  );
  return data;
}

export async function updateRecording(
  recordingId: string,
  input: { title?: string; url?: string; durationSec?: number | null }
) {
  const { data } = await api.patch<Envelope<RecordingRecord>>(
    `/instructor/recordings/${recordingId}`,
    input
  );
  return data;
}

export async function deleteRecording(recordingId: string) {
  await api.delete(`/instructor/recordings/${recordingId}`);
}

export async function reviewSubmission(
  submissionId: string,
  input: ReviewSubmissionInput
) {
  const { data } = await api.post<Envelope<AssignmentSubmissionRecord>>(
    `/instructor/submissions/${submissionId}/review`,
    input
  );
  return data;
}

export async function createNote(
  curriculumId: string,
  input: { title: string; body: string; topicId?: string; isPinned?: boolean }
) {
  const { data } = await api.post<Envelope<NoteRecord>>(
    `/instructor/curriculums/${curriculumId}/notes`,
    input
  );
  return data;
}

export async function updateNote(
  curriculumId: string,
  noteId: string,
  input: {
    title?: string;
    body?: string;
    topicId?: string | null;
    isPinned?: boolean;
  }
) {
  const { data } = await api.patch<Envelope<NoteRecord>>(
    `/instructor/curriculums/${curriculumId}/notes/${noteId}`,
    input
  );
  return data;
}

export async function pinNote(
  curriculumId: string,
  noteId: string,
  isPinned: boolean
) {
  const { data } = await api.patch<Envelope<NoteRecord>>(
    `/instructor/curriculums/${curriculumId}/notes/${noteId}/pin`,
    { isPinned }
  );
  return data;
}

export async function deleteNote(
  curriculumId: string,
  noteId: string
) {
  await api.delete(`/instructor/curriculums/${curriculumId}/notes/${noteId}`);
}

/* -------------------------------------------------------------------------- */
/* Single-item reads                                                          */
/* -------------------------------------------------------------------------- */

export async function getALesson(lessonId: string) {
  const { data } = await api.get<Envelope<LessonRecord>>(
    `/instructor/lessons/${lessonId}`
  );
  return data;
}

export async function getAResource(resourceId: string) {
  const { data } = await api.get<Envelope<ResourceRecord>>(
    `/instructor/resources/${resourceId}`
  );
  return data;
}

export async function getAnAssignment(assignmentId: string) {
  const { data } = await api.get<Envelope<AssignmentRecord>>(
    `/instructor/assignments/${assignmentId}`
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export const instructorKeys = {
  myTracks: () => ["instructor", "tracks"] as const,
  students: (params: { cohortId?: string; trackId?: string }) =>
    ["instructor", "students", params] as const,
  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", filters] as const,
  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", "count", filters] as const,
  curriculums: (params: { trackId?: string; }) =>
    ["instructor", "curriculum", params] as const,
  allCurriculums: (filters: {
    trackId?: string;
    cohortId?: string;
    publishStatus?: PublishStatus;
    status?: "ONGOING" | "COMPLETED";
  }) => ["instructor", "all-curriculums", filters] as const,
  curriculumById: (params: { curriculumId?: string; }) =>
    ["instructor", "curriculum", params] as const,
  topics: (params: { curriculumId?: string; }) =>
    ["instructor", "topics", params] as const,
  lessons: (params: { topicId?: string; }) =>
    ["instructor", "lessons", params] as const,
  resources: (params: { lessonId?: string; }) =>
    ["instructor", "resources", params] as const,
  assignment: (params: { lessonId?: string; }) =>
    ["instructor", "assignment", params] as const,
  recordings: (params: { lessonId?: string }) =>
    ["instructor", "recordings", params] as const,
  topicResources: (params: { topicId?: string }) =>
    ["instructor", "topic-resources", params] as const,
  topicAssignments: (params: { topicId?: string }) =>
    ["instructor", "topic-assignments", params] as const,
  notes: (params: { curriculumId?: string }) =>
    ["instructor", "notes", params] as const,
  submissions: (params: SubmissionFilters) =>
    ["instructor", "submissions", params] as const,
  submission: (params: { submissionId?: string }) =>
    ["instructor", "submission", params] as const,
  // One key for assignments, resources and recordings. Invalidate
  // ["instructor", "track-content"] after creating any of them.
  trackContent: (params: { trackId?: string }) =>
    ["instructor", "track-content", params] as const,
  lessonById: (params: { lessonId?: string }) =>
    ["instructor", "lesson-item", params] as const,
  resourceById: (params: { resourceId?: string }) =>
    ["instructor", "resource-item", params] as const,
  assignmentById: (params: { assignmentId?: string }) =>
    ["instructor", "assignment-item", params] as const,
};

/* -------------------------------------------------------------------------- */
/* Query options                                                              */
/* -------------------------------------------------------------------------- */

const trackContentOptions = (params: { trackId?: string }) =>
  queryOptions({
    queryKey: instructorKeys.trackContent(params),
    queryFn: () => listTrackContent(params as { trackId: string }),
    enabled: Boolean(params.trackId),
    staleTime: 60_000,
  });

export const instructorQueries = {
  // Track assignments change rarely, so they can stay cached longer.
  myTracks: () =>
    queryOptions({
      queryKey: instructorKeys.myTracks(),
      queryFn: listMyTracks,
      staleTime: 5 * 60_000,
    }),

  students: (params: { cohortId?: string; trackId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.students(params),
      queryFn: () => listStudents(params),
      enabled: Boolean(params.trackId && params.cohortId),
    }),

  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTasks(filters),
      queryFn: () => listWeeklyTasks(filters),
    }),

  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTaskCount(filters),
      queryFn: () => countWeeklyTasks(filters),
    }),

  curriculums: (params: { trackId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.curriculums(params),
      queryFn: () => listCurriculum(params as { trackId: string }),
      enabled: Boolean(params.trackId),
    }),

  allCurriculums: (
    filters: {
      trackId?: string;
      cohortId?: string;
      publishStatus?: PublishStatus;
      status?: "ONGOING" | "COMPLETED";
    } = {}
  ) =>
    queryOptions({
      queryKey: instructorKeys.allCurriculums(filters),
      queryFn: () => listAllCurriculums(filters),
    }),

  curriculumById: (params: { curriculumId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.curriculumById(params),
      queryFn: () => {
        if (!params.curriculumId) throw new Error("Curriculum ID is required");
        return getACurriculum({ curriculumId: params.curriculumId });
      },
      enabled: Boolean(params.curriculumId),
    }),

  topics: (params: { curriculumId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.topics(params),
      queryFn: () => listTopics(params as { curriculumId: string }),
      enabled: Boolean(params.curriculumId),
    }),

  lessons: (params: { topicId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.lessons(params),
      queryFn: () => listLessons(params as { topicId: string }),
      enabled: Boolean(params.topicId),
    }),

  resources: (params: { lessonId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.resources(params),
      queryFn: () => listResources(params as { lessonId: string }),
      enabled: Boolean(params.lessonId),
    }),

  assignments: (params: { lessonId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.assignment(params),
      queryFn: () => listAssignments(params as { lessonId: string }),
      enabled: Boolean(params.lessonId),
    }),

  recordings: (params: { lessonId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.recordings(params),
      queryFn: () => listRecordings(params as { lessonId: string }),
      enabled: Boolean(params.lessonId),
    }),

  topicResources: (params: { topicId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.topicResources(params),
      queryFn: () => listTopicResources(params as { topicId: string }),
      enabled: Boolean(params.topicId),
    }),

  topicAssignments: (params: { topicId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.topicAssignments(params),
      queryFn: () => listTopicAssignments(params as { topicId: string }),
      enabled: Boolean(params.topicId),
    }),

  notes: (params: { curriculumId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.notes(params),
      queryFn: () => listNotes(params as { curriculumId: string }),
      enabled: Boolean(params.curriculumId),
    }),

  submissions: (params: SubmissionFilters) =>
    queryOptions({
      queryKey: instructorKeys.submissions(params),
      queryFn: () =>
        listAssignmentSubmissions(params as SubmissionFilters & { assignmentId: string }),
      enabled: Boolean(params.assignmentId),
    }),

  submission: (params: { submissionId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.submission(params),
      queryFn: () => getASubmission(params.submissionId as string),
      enabled: Boolean(params.submissionId),
    }),

  trackContent: trackContentOptions,

  trackAssignments: (params: { trackId?: string }) =>
    queryOptions({
      ...trackContentOptions(params),
      select: (content: TrackContent) => content.assignments,
    }),

  trackResources: (params: { trackId?: string }) =>
    queryOptions({
      ...trackContentOptions(params),
      select: (content: TrackContent) => content.resources,
    }),

  trackRecordings: (params: { trackId?: string }) =>
    queryOptions({
      ...trackContentOptions(params),
      select: (content: TrackContent) => content.recordings,
    }),

  lessonById: (params: { lessonId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.lessonById(params),
      queryFn: () => {
        if (!params.lessonId) throw new Error("Lesson ID is required");
        return getALesson(params.lessonId);
      },
      enabled: Boolean(params.lessonId),
    }),

  resourceById: (params: { resourceId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.resourceById(params),
      queryFn: () => {
        if (!params.resourceId) throw new Error("Resource ID is required");
        return getAResource(params.resourceId);
      },
      enabled: Boolean(params.resourceId),
    }),

  assignmentById: (params: { assignmentId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.assignmentById(params),
      queryFn: () => {
        if (!params.assignmentId) throw new Error("Assignment ID is required");
        return getAnAssignment(params.assignmentId);
      },
      enabled: Boolean(params.assignmentId),
    }),
};
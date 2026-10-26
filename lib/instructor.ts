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
  trackId: string;
  _count: {
    topics: number;
  };
};

export type TopicRecord = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  curriculumId: string;
  _count: {
    lessons: number;
    prerequisites: number;
  };
};

export type LessonRecord = {
  id: string;
  topicId: string;
  title: string;
  description: string;
  position: number;
};

export type ResourceRecord = {
  id: string;
  lessonId: string;
  title: string;
  description?: string | null;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  fileSize?: number | null;
  status?: "DRAFT" | "PUBLISHED";
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
  lessonId: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  type?: string | null;
  submissionType?: string | null;
  dueDate?: string | null;
  status?: "DRAFT" | "PUBLISHED";
  submissions?: { completed: number; total: number };
};

export type LessonContext = {
  curriculum: { id: string; title: string };
  topic: { id: string; title: string };
  lesson: { id: string; title: string };
};

export type InTrack<T> = T & LessonContext;

export type TrackContent = {
  assignments: InTrack<AssignmentRecord>[];
  resources: InTrack<ResourceRecord>[];
  recordings: InTrack<RecordingRecord>[];
};

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

/** Walks curriculum → topic → lesson once, in position order. */
async function listTrackLessons(params: {
  trackId: string;
}): Promise<LessonContext[]> {
  const curriculums = await listCurriculum(params);

  const nested = await Promise.all(
    curriculums.map(async (curriculum) => {
      const topics = [
        ...(await listTopics({ curriculumId: curriculum.id })),
      ].sort((a, b) => a.position - b.position);

      const perTopic = await Promise.all(
        topics.map(async (topic) => {
          const lessons = [...(await listLessons({ topicId: topic.id }))].sort(
            (a, b) => a.position - b.position
          );

          return lessons.map((lesson) => ({
            curriculum: { id: curriculum.id, title: curriculum.title },
            topic: { id: topic.id, title: topic.title },
            lesson: { id: lesson.id, title: lesson.title },
          }));
        })
      );

      return perTopic.flat();
    })
  );

  return nested.flat();
}

/**
 * Every assignment, resource and recording in a track. The API has no single
 * endpoint for this, so the tree is walked once and all three kinds are
 * fetched per lesson in the same pass.
 */
async function listTrackContent(params: {
  trackId: string;
}): Promise<TrackContent> {
  const lessons = await listTrackLessons(params);

  const perLesson = await Promise.all(
    lessons.map(async (context) => {
      const lessonId = context.lesson.id;
      const [assignments, resources, recordings] = await Promise.all([
        listAssignments({ lessonId }),
        listResources({ lessonId }),
        listRecordings({ lessonId }),
      ]);

      const attach = <T>(items: T[]) =>
        items.map((item) => ({ ...item, ...context }));

      return {
        assignments: attach(assignments),
        resources: attach(resources),
        recordings: attach(recordings),
      };
    })
  );

  return {
    assignments: perLesson.flatMap((l) => l.assignments),
    resources: perLesson.flatMap((l) => l.resources),
    recordings: perLesson.flatMap((l) => l.recordings),
  };
}


export async function createTopic(
  curriculumId: string,
  input: { title: string; description: string; position: number }
) {
  const { data } = await api.post<Envelope<TopicRecord>>(
    `/instructor/curriculums/${curriculumId}/topics`,
    input
  );
  return data;
}

export async function updateTopic(
  topicId: string,
  input: { title?: string; description?: string; position?: number }
) {
  const { data } = await api.patch<Envelope<TopicRecord>>(
    `/instructor/topics/${topicId}`,
    input
  );
  return data;
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

export async function createResource(
  lessonId: string,
  input: { title: string; url: string; description?: string }
) {
  const { data } = await api.post<Envelope<ResourceRecord>>(
    `/instructor/lessons/${lessonId}/resources`,
    input
  );
  return data;
}

export async function updateResource(
  resourceId: string,
  input: { title?: string; url?: string; description?: string | null }
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

export async function createAssignment(
  lessonId: string,
  input: { title: string; description?: string }
) {
  const { data } = await api.post<Envelope<AssignmentRecord>>(
    `/instructor/lessons/${lessonId}/assignments`,
    input
  );
  return data;
}

export async function updateAssignment(
  assignmentId: string,
  input: { title?: string; description?: string | null }
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

export async function getALesson(lessonId: string) {
  const { data } = await api.get<Envelope<LessonRecord>>(
    `/instructor/lessons/${params.id}`
  );
  return data;
}

export async function getAResource(resourceId: string) {
  const { data } = await api.get<Envelope<ResourceRecord>>(
    `/instructor/resources/${params.id}`
  );
  return data;
}

export async function getAnAssignment(assignmentId: string) {
  const { data } = await api.get<Envelope<AssignmentRecord>>(
    `/instructor/assignments/${params.id}`
  );
  return data;
}

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
  // One key for assignments, resources and recordings. Invalidate
  // ["instructor", "track-content"] after creating any of them.
  trackContent: (params: { trackId?: string }) =>
    ["instructor", "track-content", params] as const,
  lessonById: (params: { id?: string }) =>
    ["instructor", "lesson-item", params] as const,
  resourceById: (params: { id?: string }) =>
    ["instructor", "resource-item", params] as const,
  assignmentById: (params: { id?: string }) =>
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

  lessonById: (params: { id?: string }) =>
    queryOptions({
      queryKey: instructorKeys.lessonById(params),
      queryFn: () => getAlesson(params as { lessonId: string }),
      enabled: Boolean(params.id),
    }),

  resourceById: (params: { id?: string }) =>
    queryOptions({
      queryKey: instructorKeys.resourceById(params),
      queryFn: () => getAResource(params as { resourceId: string }),
      enabled: Boolean(params.id),
    }),

  assignmentById: (params: { id?: string }) =>
    queryOptions({
      queryKey: instructorKeys.assignmentById(params),
      queryFn: () => getAnAssignment(params as { assignmentId: string }),
      enabled: Boolean(params.id),
    }),
};
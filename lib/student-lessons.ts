import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { studentQueries } from "@/lib/student";
import type { ResourceRecord } from "@/features/curriculum/types";
import type { StudentAssignment } from "@/lib/student-assignments";

/** Base path of the learning pages. Change it here if the route is renamed. */
export const LESSONS_BASE = "/student/my-learning";

export function lessonHref(lessonId: string) {
  return `${LESSONS_BASE}/lesson/${lessonId}`;
}

export function moduleHref(topicId: string) {
  return `${LESSONS_BASE}/module/${topicId}`;
}

// ---------------------------------------------------------------------------
// Types — from GET /student/enrollments/{id}/content and .../lessons/{id}
// ---------------------------------------------------------------------------

export type LessonLock = {
  instructorUnlocked: boolean;
  unlocked: boolean;
  completed: boolean;
};

export type LessonResource = Pick<
  ResourceRecord,
  "id" | "title" | "description" | "url" | "type" | "fileName" | "sizeBytes"
>;

export type LessonAssignment = StudentAssignment;

export type LessonRecording = {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  durationSec?: number | null;
};

/* Locked items come with only their title, position and counts: no `lock`, no content. */
export type CurriculumLesson = {
  id: string;
  topicId?: string;
  title: string;
  description?: string | null;
  position?: number | null;
  lock?: LessonLock;
  counts?: { assignments?: number; resources?: number };
  resources?: LessonResource[];
  assignments?: LessonAssignment[];
  recordings?: LessonRecording[];
};

export type LessonDetail = CurriculumLesson;

export type CurriculumTopic = {
  id: string;
  curriculumId?: string;
  title: string;
  description?: string | null;
  position?: number | null;
  lock?: LessonLock;
  counts?: { lessons?: number; resources?: number; assignments?: number };
  lessons: CurriculumLesson[];
  /** "What you'll learn" — one line per outcome. */
  outcomes?: string[] | null;
  /** Module-level assignments and resources, not on any one lesson. */
  assignments?: LessonAssignment[];
  resources?: LessonResource[];
};

export type Curriculum = {
  id: string;
  trackId: string;
  title: string;
  description?: string | null;
  status: string;
  progressMode?: "SEQUENTIAL" | "FLEXIBLE";
  cohort?: { id: string; name: string; year?: string | null } | null;
  topics?: CurriculumTopic[];
};

type Envelope<T> = { success: boolean; data: T };

export function isUnlocked(item: { lock?: LessonLock }) {
  return item.lock?.unlocked === true;
}

export function isCompleted(item: { lock?: LessonLock }) {
  return item.lock?.completed === true;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const lessonQueries = {
  content: (enrollmentId: string) =>
    queryOptions({
      queryKey: ["student", "enrollments", enrollmentId, "content"],
      queryFn: async () => {
        const response = await api.get<Envelope<Curriculum[]>>(
          `/student/enrollments/${enrollmentId}/content`,
        );
        return response.data;
      },
    }),

  lesson: (enrollmentId: string, lessonId: string) =>
    queryOptions({
      queryKey: ["student", "enrollments", enrollmentId, "lessons", lessonId],
      queryFn: async () => {
        const response = await api.get<Envelope<LessonDetail>>(
          `/student/enrollments/${enrollmentId}/lessons/${lessonId}`,
        );
        return response.data;
      },
    }),
};

/* Marks one lesson done or not done. Lesson ids go through the module's progress endpoint. */
export async function setLessonCompleted(
  enrollmentId: string,
  topicId: string,
  lessonId: string,
  completed: boolean,
) {
  await api.patch(
    `/student/enrollments/${enrollmentId}/topics/${topicId}/progress`,
    { lessons: [{ id: lessonId, completed }] },
  );
}

/**
 * The student's current track and its curriculum, as every learning page
 * loads them. Picks the track still being worked through, like the dashboard.
 */
export function useStudentCurriculum() {
  const progress = useQuery(studentQueries.progress());
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];
  const enrollmentId = enrollment?.enrollmentId;

  const content = useQuery({
    ...lessonQueries.content(enrollmentId ?? ""),
    enabled: Boolean(enrollmentId),
  });

  const notEnrolled =
    (progress.error instanceof ApiError && progress.error.status === 404) ||
    (progress.isSuccess && !enrollment);

  return {
    enrollment,
    enrollmentId,
    curricula: content.data,
    topics: flattenTopics(content.data),
    isPending: progress.isPending || Boolean(enrollmentId && content.isPending),
    notEnrolled,
    error: notEnrolled ? null : (progress.error ?? content.error),
    refetch: () => (enrollmentId ? content.refetch() : progress.refetch()),
  };
}

// ---------------------------------------------------------------------------
// Curriculum helpers
// ---------------------------------------------------------------------------

function sortByPosition<T extends { position?: number | null }>(items: T[]) {
  return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/** All topics ("weeks") in order, each with its lessons in order. */
export function flattenTopics(
  curricula: Curriculum[] | undefined,
): CurriculumTopic[] {
  if (!curricula) return [];
  return curricula.flatMap((curriculum) =>
    sortByPosition(curriculum.topics ?? []).map((topic) => ({
      ...topic,
      lessons: sortByPosition(topic.lessons ?? []),
    })),
  );
}

/**
 * Finds a lesson and where it sits. `week` and `number` are 1-based positions
 * in the ordered list, so they don't depend on whether `position` starts at 0.
 */
export function findLesson(topics: CurriculumTopic[], lessonId: string) {
  for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
    const topic = topics[topicIndex];
    const lessonIndex = topic.lessons.findIndex((item) => item.id === lessonId);
    if (lessonIndex !== -1) {
      return {
        topic,
        week: topicIndex + 1,
        lesson: topic.lessons[lessonIndex],
        number: lessonIndex + 1,
      };
    }
  }
  return null;
}

/** "01", "02" … as the design numbers modules. */
export function moduleNumber(number: number) {
  return String(number).padStart(2, "0");
}

/** A module and its 1-based number in the ordered list. */
export function findTopic(topics: CurriculumTopic[], topicId: string) {
  const index = topics.findIndex((topic) => topic.id === topicId);
  return index === -1 ? null : { topic: topics[index], number: index + 1 };
}

/** Recordings across the module's unlocked lessons, in lesson order. */
export function topicRecordings(topic: CurriculumTopic) {
  return topic.lessons
    .filter(isUnlocked)
    .flatMap((lesson) =>
      (lesson.recordings ?? []).map((recording) => ({ recording, lesson })),
    );
}

/** Module and lesson resources together, for "What's included". */
export function countTopicResources(topic: CurriculumTopic) {
  return (
    (topic.resources?.length ?? topic.counts?.resources ?? 0) +
    topic.lessons.reduce(
      (sum, lesson) =>
        sum + (lesson.resources?.length ?? lesson.counts?.resources ?? 0),
      0,
    )
  );
}

export function countWatched(topic: CurriculumTopic) {
  return topic.lessons.filter(isCompleted).length;
}

/** Published assignments the student can open: the module's own, then each unlocked lesson's. */
export function topicAssignments(topic: CurriculumTopic) {
  if (!isUnlocked(topic)) return [];
  return [
    ...(topic.assignments ?? []).map((assignment) => ({ assignment, lesson: null })),
    ...topic.lessons.filter(isUnlocked).flatMap((lesson) =>
      (lesson.assignments ?? []).map((assignment) => ({ assignment, lesson })),
    ),
  ].filter(({ assignment }) => assignment.publishStatus !== "DRAFT");
}

// ---------------------------------------------------------------------------
// Formatting and URL helpers
// ---------------------------------------------------------------------------

export function formatDuration(totalSeconds: number | null | undefined) {
  const seconds = Math.max(0, Math.round(totalSeconds ?? 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

/** Only http(s) links are ever rendered as links. Anything else returns null. */
export function toHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

const FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "zip",
];

/** Uses the resource's `type` when the API sends one; otherwise guesses from the URL. */
export function describeResource(value: string, type?: LessonResource["type"]) {
  const href = toHttpUrl(value);
  if (!href) return { kind: "Link", host: "", isFile: false };

  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, "");
  const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";

  if (type === "VIDEO") return { kind: "Video", host, isFile: false };
  if (type === "LINK") return { kind: "Link", host, isFile: false };
  if (type === "PDF") return { kind: "PDF", host, isFile: true };
  if (type === "DOCUMENT" || type === "IMAGE") {
    const kind = FILE_EXTENSIONS.includes(extension)
      ? extension.toUpperCase()
      : type === "IMAGE"
        ? "Image"
        : "Document";
    return { kind, host, isFile: true };
  }

  if (FILE_EXTENSIONS.includes(extension)) {
    return { kind: extension.toUpperCase(), host, isFile: true };
  }
  const isVideo =
    /(youtube\.com|youtu\.be|vimeo\.com|loom\.com)$/.test(host) ||
    ["mp4", "mov", "webm"].includes(extension);
  return { kind: isVideo ? "Video" : "Link", host, isFile: false };
}

/** A still for the recording, when the host gives one (YouTube only). */
export function videoThumbnail(value: string): string | null {
  const source = getVideoSource(value);
  const id =
    source.type === "iframe" && source.src.includes("youtube.com/embed/")
      ? source.src.split("/embed/")[1]?.split(/[?#]/)[0]
      : null;
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export type VideoSource =
  | { type: "iframe"; src: string }
  | { type: "file"; src: string }
  | { type: "link"; src: string };

/** Picks how to play a recording URL: an embed, a plain video file, or a link out. */
export function getVideoSource(value: string): VideoSource {
  const href = toHttpUrl(value);
  if (!href) return { type: "link", src: value };

  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  if (host.endsWith("youtube.com")) {
    const id = url.searchParams.get("v");
    if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
    if (url.pathname.startsWith("/embed/")) return { type: "iframe", src: href };
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) {
      return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
  }
  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(url.pathname)) {
    return { type: "file", src: href };
  }
  return { type: "link", src: href };
}

import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Base path of the learning pages. Change it here if the route is renamed. */
export const LESSONS_BASE = "/student/my-learning";

export function lessonHref(lessonId: string) {
  return `${LESSONS_BASE}/lesson/${lessonId}`;
}

// ---------------------------------------------------------------------------
// Types — from GET /student/enrollments/{id}/content and .../lessons/{id}
// ---------------------------------------------------------------------------

export type LessonLock = {
  instructorUnlocked: boolean;
  unlocked: boolean;
  completed: boolean;
};

export type CurriculumLesson = {
  id: string;
  topicId: string;
  title: string;
  description?: string | null;
  position: number;
  completed: boolean;
  lock: LessonLock;
};

export type CurriculumTopic = {
  id: string;
  curriculumId: string;
  title: string;
  description?: string | null;
  position: number;
  completed: boolean;
  lock: LessonLock;
  lessons: CurriculumLesson[];
};

export type Curriculum = {
  id: string;
  trackId: string;
  title: string;
  description?: string | null;
  status: string;
  topics: CurriculumTopic[];
};

export type LessonResource = {
  id: string;
  lessonId: string;
  title: string;
  description?: string | null;
  url: string;
};

export type LessonAssignment = {
  id: string;
  lessonId: string;
  title: string;
  description?: string | null;
};

export type LessonRecording = {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  durationSec: number;
};

export type LessonDetail = {
  id: string;
  topicId: string;
  title: string;
  description?: string | null;
  position: number;
  lock: LessonLock;
  resources: LessonResource[];
  assignments: LessonAssignment[];
  recordings: LessonRecording[];
};

type Envelope<T> = { success: boolean; data: T };

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

// ---------------------------------------------------------------------------
// Curriculum helpers
// ---------------------------------------------------------------------------

function sortByPosition<T extends { position: number }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position);
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

export function countWatched(topic: CurriculumTopic) {
  return topic.lessons.filter((item) => item.completed).length;
}

// ---------------------------------------------------------------------------
// Formatting and URL helpers
// ---------------------------------------------------------------------------

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
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

/** The API gives a resource a title and a URL only, so the type comes from the URL. */
export function describeResource(value: string) {
  const href = toHttpUrl(value);
  if (!href) return { kind: "Link", host: "", isFile: false };

  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, "");
  const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";

  if (FILE_EXTENSIONS.includes(extension)) {
    return { kind: extension.toUpperCase(), host, isFile: true };
  }
  const isVideo =
    /(youtube\.com|youtu\.be|vimeo\.com|loom\.com)$/.test(host) ||
    ["mp4", "mov", "webm"].includes(extension);
  return { kind: isVideo ? "Video" : "Link", host, isFile: false };
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

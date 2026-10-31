import {
  BookOpen,
  Code,
  Database,
  PenTool,
  Smartphone,
} from "lucide-react";

import type { Track } from "@/lib/admin";
import {
  progressModes,
  resourceKinds,
  type AssignmentExtras,
  type AssignmentRecord,
  type AssignmentSubmission,
  type AssignmentSubmissionRecord,
  type Curriculum,
  type CurriculumAssignment,
  type CurriculumHistoryEntry,
  type CurriculumModule,
  type CurriculumNote,
  type CurriculumRecord,
  type CurriculumResource,
  type ModuleAssignment,
  type NoteRecord,
  type ResourceFile,
  type ResourceKind,
  type ResourceRecord,
  type SessionExtras,
  type Timestamps,
  type TopicTree,
  type TrackDetails,
  type UpdateCurriculumInput,
} from "@/features/curriculum/types";

// Pure functions: API records → view types, plus view helpers and formatting.
// Nothing here makes requests; fields the API doesn't have are passed in from
// the session store in `curriculum.api.ts`.

// ---- Tracks ----------------------------------------------------------------

// Matched against the track name, so "Product Design" gets the design icon.
const trackStyles: (Omit<TrackDetails, "label"> & { match: string })[] = [
  {
    match: "design",
    icon: PenTool,
    iconClassName: "bg-surface-brand text-brand-primary",
  },
  {
    match: "frontend",
    icon: Code,
    iconClassName: "bg-surface-info-badge text-text-info",
  },
  {
    match: "backend",
    icon: Database,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    match: "mobile",
    icon: Smartphone,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
];

/** Label, icon and colours for a track, picked from its name. */
export function trackDetails(trackName: string): TrackDetails {
  const name = trackName.toLowerCase().replace(/[^a-z]/g, "");
  const style = trackStyles.find((s) => name.includes(s.match)) ?? {
    icon: BookOpen,
    iconClassName: "bg-surface-brand text-brand-primary",
  };
  return { label: trackName, icon: style.icon, iconClassName: style.iconClassName };
}

// ---- New view records --------------------------------------------------------

/** Picks the kind from the file extension; links without one are "Link". */
export function resourceKind(fileName: string, url?: string): ResourceKind | "File" {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  const match = (Object.keys(resourceKinds) as ResourceKind[]).find((kind) =>
    (resourceKinds[kind].extensions as readonly string[]).includes(extension)
  );
  return match ?? (url ? "Link" : "File");
}

export function newResourceFile(
  file: { name: string; sizeBytes: number | null },
  overrides: Partial<ResourceFile> = {}
): ResourceFile {
  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.[^.]+$/, ""),
    description: "",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "You",
    status: "PUBLISHED",
    ...file,
    ...overrides,
  };
}

/** Builds a resource record for a file the admin just picked. */
export function resourceFromUpload(file: File) {
  return newResourceFile({ name: file.name, sizeBytes: file.size });
}

/* Builds a resource for a pasted link. It's sent to the API when the form is saved. */
export function resourceFromLink(url: string) {
  return newResourceFile({ name: fileNameFromUrl(url), sizeBytes: null }, { url });
}

/* True for a full https:// link, the only kind the API accepts. */
export function isHttpsLink(value: string) {
  if (!/^https:\/\/\S+$/.test(value)) return false;
  try {
    return Boolean(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function emptyAssignment(id: string = crypto.randomUUID()): ModuleAssignment {
  return {
    id,
    title: "",
    description: "",
    instructions: "",
    resources: [],
    type: "Project",
    mode: "Individual",
    submissionType: "FILE_UPLOAD",
    dueAt: null,
    afterLesson: null,
    status: "DRAFT",
  };
}

// ---- Record helpers ----------------------------------------------------------

/** Orders by `position`; items without one go last, oldest first. */
export function byPosition<T extends Timestamps & { position?: number | null }>(items: T[]) {
  const last = Number.MAX_SAFE_INTEGER;
  return [...items].sort(
    (a, b) =>
      (a.position ?? last) - (b.position ?? last) ||
      (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
  );
}

/** The last path segment of a link, e.g. "visual-hierarchy.pdf". */
function fileNameFromUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    const last = pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : hostname;
  } catch {
    return url;
  }
}

/** Links to send as attachments; picked files have no link and stay local. */
export function attachmentLinks(resources: ResourceFile[]) {
  return resources.flatMap((r) => (r.url ? [r.url] : []));
}

export function toIsoDate(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

/** Describes a settings change for the version history, e.g. "changed module access to Flexible". */
export function describeChange(input: UpdateCurriculumInput) {
  if (input.progressMode) return `changed module access to ${progressModes[input.progressMode]}`;
  if (input.publishStatus)
    return `changed curriculum status to ${input.publishStatus === "PUBLISHED" ? "Published" : "Draft"}`;
  return "updated the curriculum details";
}

// ---- Records → view types ----------------------------------------------------

export function toResourceFile(record: ResourceRecord): ResourceFile {
  return {
    id: record.id,
    name: record.fileName || fileNameFromUrl(record.url),
    sizeBytes: record.sizeBytes ?? null,
    title: record.title,
    description: record.description ?? "",
    uploadedAt: record.createdAt ?? record.updatedAt ?? new Date().toISOString(),
    // PENDING-BACKEND: the API only gives the uploader's id, not their name.
    uploadedBy: "--",
    status: record.publishStatus,
    url: record.url,
  };
}

/* A submission as the Submissions tab shows it. */
export function toSubmission(record: AssignmentSubmissionRecord): AssignmentSubmission {
  return {
    id: record.id,
    studentName: record.studentProfile?.user.name ?? "Unknown student",
    studentEmail: record.studentProfile?.user.email ?? "",
    submittedAt: record.submittedAt ?? null,
    status: record.status,
    isLate: record.isLate,
    grade: record.grade ?? null,
  };
}

/** An assignment attachment, which the API stores as a bare link. */
function attachmentFile(url: string): ResourceFile {
  return newResourceFile(
    { name: fileNameFromUrl(url), sizeBytes: null },
    { id: url, url, uploadedBy: "--" }
  );
}

function toAssignment(
  record: AssignmentRecord,
  lessonPosition: number | null,
  localExtras: AssignmentExtras = {}
): ModuleAssignment {
  const { files = [], ...extras } = localExtras;
  return {
    ...emptyAssignment(record.id),
    ...extras,
    title: record.title,
    description: record.description ?? "",
    instructions: record.instructions ?? "",
    resources: [...(record.attachments ?? []).map(attachmentFile), ...files],
    submissionType: record.submissionType,
    dueAt: record.dueAt ?? null,
    afterLesson: lessonPosition,
    status: record.publishStatus,
  };
}

export function toModule(
  topic: TopicTree,
  local: Omit<SessionExtras, "history">
): CurriculumModule {
  return {
    id: topic.id,
    curriculumId: topic.curriculumId,
    title: topic.title,
    description: topic.description,
    status: topic.publishStatus,
    outcomes: topic.outcomes ?? [],
    recordingLink: topic.lessons.flatMap((l) => l.recordings)[0]?.url ?? "",
    resources: [
      ...topic.resources.map(toResourceFile),
      ...(local.moduleFiles.get(topic.id) ?? []),
    ],
    lessons: topic.lessons.map((lesson) => {
      const lessonExtras = local.lessons.get(lesson.id);
      return {
        id: lesson.id,
        topic: lessonExtras?.topic ?? "",
        title: lesson.title,
        description: lesson.description ?? "",
        resources: [
          ...lesson.resources.map(toResourceFile),
          ...(lessonExtras?.files ?? []),
        ],
      };
    }),
    assignments: [
      ...topic.lessons.flatMap((lesson, index) =>
        lesson.assignments.map((a) =>
          toAssignment(a, index + 1, local.assignments.get(a.id))
        )
      ),
      ...topic.assignments.map((a) => toAssignment(a, null, local.assignments.get(a.id))),
    ],
    // PENDING-BACKEND: no cover images or recording thumbnails in the API.
    coverImage: null,
    liveClassRecordings: [],
  };
}

export function toCurriculum(
  record: CurriculumRecord,
  track: Track,
  studentCount: number,
  history: CurriculumHistoryEntry[]
): Curriculum {
  const instructor = record.assignedInstructors[0];

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    track: { id: track.id, name: track.name },
    cohort: record.cohort?.name ?? "No cohort",
    status: record.status === "COMPLETED" ? "Completed" : "Active",
    totalModules: record.totalModules,
    totalLessons: record.totalLessons,
    totalAssignments: record.totalAssignments,
    studentCount,
    instructor: instructor
      ? { name: instructor.name, email: instructor.email }
      : { name: "Not assigned", email: "" },
    // PENDING-BACKEND: no live classes in the API.
    liveClasses: [],
    publishStatus: record.publishStatus,
    progressMode: record.progressMode,
    history,
  };
}

export function toNote(record: NoteRecord): CurriculumNote {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    moduleId: record.topicId ?? null,
    author: record.author
      ? `${record.author.firstName} ${record.author.lastName}`.trim()
      : "--",
    createdAt: record.createdAt ?? new Date().toISOString(),
    pinned: record.isPinned ?? record.pinned ?? false,
  };
}

// ---- Module tree → tab lists -------------------------------------------------

export function toAssignments(modules: CurriculumModule[]) {
  return modules.flatMap((m, index) =>
    m.assignments.map(
      (assignment): CurriculumAssignment => ({
        assignment,
        module: m,
        modulePosition: index + 1,
      })
    )
  );
}

export function toResources(modules: CurriculumModule[]) {
  return modules.flatMap((m, index) => {
    const base = { module: m, modulePosition: index + 1 };
    return [
      ...m.resources.map(
        (resource): CurriculumResource => ({ ...base, resource, lessonPosition: null })
      ),
      ...m.lessons.flatMap((lesson, lessonIndex) =>
        lesson.resources.map(
          (resource): CurriculumResource => ({
            ...base,
            resource,
            lessonPosition: lessonIndex + 1,
          })
        )
      ),
    ];
  });
}

// ---- Formatting ----------------------------------------------------------------

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatModuleNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

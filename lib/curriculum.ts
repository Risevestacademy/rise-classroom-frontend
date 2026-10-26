import { queryOptions } from "@tanstack/react-query";
import {
  BookOpen,
  Code,
  Database,
  PenTool,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { AdminUser, Track } from "@/lib/admin";
import { getSession } from "@/lib/auth";

// The API models a curriculum as Curriculum → Topic → Lesson, with resources,
// assignments and recordings attached to each lesson. The UI calls a topic a
// "module". Anything the design shows that the API doesn't store yet lives in
// the in-memory `local` store below: it works for the session but resets on a
// full page reload. Search for "local." to find every such field.

// ---- Tracks ----------------------------------------------------------------

type TrackDetails = { label: string; icon: LucideIcon; iconClassName: string };

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

// ---- View types (what the screens render) -----------------------------------

export type ModuleStatus = "PUBLISHED" | "DRAFT";

export type ResourceFile = {
  id: string;
  /** The file's name, e.g. "visual-hierarchy.pdf". */
  name: string;
  /** `null` for resources saved as links — the API doesn't store a size. */
  sizeBytes: number | null;
  /** Display name shown in the Resources tab. */
  title: string;
  description: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ModuleStatus;
  /** Set for resources saved in the API; local uploads have no link. */
  url?: string;
};

export const resourceKinds = {
  PDF: { extensions: [".pdf"], formats: "PDF" },
  Video: { extensions: [".mp4"], formats: "MP4" },
  Document: { extensions: [".docx", ".pptx"], formats: "DOCX and PPTX" },
  Image: { extensions: [".jpeg", ".jpg", ".png"], formats: "JPEG and PNG" },
  /** An external page (Drive, Figma, YouTube…) rather than an uploaded file. */
  Link: { extensions: [], formats: "Link" },
} as const;

export type ResourceKind = keyof typeof resourceKinds;

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

/** A resource together with where it's attached in the curriculum. */
export type CurriculumResource = {
  resource: ResourceFile;
  module: CurriculumModule;
  modulePosition: number;
  lessonPosition: number | null;
};

export type CreateResourceInput = Pick<
  ResourceFile,
  "name" | "sizeBytes" | "title" | "description" | "url"
>;

export type ModuleLesson = {
  id: string;
  topic: string;
  title: string;
  description: string;
  resources: ResourceFile[];
};

export const submissionTypes = {
  FILE_UPLOAD: "File Upload",
  LINK: "Link",
  TEXT: "Text Entry",
} as const;

export type SubmissionType = keyof typeof submissionTypes;

export type AssignmentSubmission = {
  id: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string | null;
  grade: string | null;
};

export type ModuleAssignment = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  resources: ResourceFile[];
  type: "Project" | "Report";
  mode: "Individual" | "Group";
  submissionType: SubmissionType;
  dueAt: string | null;
  /** The lesson the assignment is attached to in the API (1-based). */
  afterLesson: number | null;
  status: ModuleStatus;
  submissions: AssignmentSubmission[];
};

export type CreateAssignmentInput = Pick<
  ModuleAssignment,
  | "title"
  | "description"
  | "instructions"
  | "resources"
  | "submissionType"
  | "dueAt"
  | "afterLesson"
>;

/** An assignment together with the module it belongs to. */
export type CurriculumAssignment = {
  assignment: ModuleAssignment;
  module: CurriculumModule;
  modulePosition: number;
};

export type CurriculumModule = {
  id: string;
  curriculumId: string;
  title: string;
  description: string;
  status: ModuleStatus;
  outcomes: string[];
  recordingLink: string;
  resources: ResourceFile[];
  lessons: ModuleLesson[];
  assignments: ModuleAssignment[];
  coverImage: string | null;
  liveClassRecordings: { title: string; thumbnail: string }[];
};

export type LiveClass = {
  id: string;
  title: string;
  scheduledFor: string | null;
};

export type Curriculum = {
  id: string;
  title: string;
  description: string;
  track: { id: string; name: string };
  /** Cohort names, e.g. "Cohort 2026"; empty when none is known. */
  cohort: string;
  status: "Active" | "Completed";
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
  studentCount: number;
  instructor: { name: string; email: string };
  liveClasses: LiveClass[];
  publishStatus: ModuleStatus;
  progressMode: ProgressMode;
  history: CurriculumHistoryEntry[];
};

export const progressModes = {
  SEQUENTIAL: "Sequential",
  FLEXIBLE: "Flexible",
} as const;

export type ProgressMode = keyof typeof progressModes;

export type CurriculumHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  at: string;
};

export type CurriculumNote = {
  id: string;
  title: string;
  body: string;
  moduleId: string | null;
  author: string;
  createdAt: string;
  pinned: boolean;
};

export type UpdateCurriculumInput = Partial<
  Pick<Curriculum, "title" | "description" | "publishStatus" | "progressMode">
>;

export type SaveNoteInput = Pick<CurriculumNote, "title" | "body" | "moduleId">;

export type CreateCurriculumInput = {
  title: string;
  description: string;
  trackId: string;
  /** Empty when no cohort is picked. */
  cohortId: string;
};

export type SaveModuleInput = Omit<
  CurriculumModule,
  "id" | "curriculumId" | "coverImage" | "liveClassRecordings"
>;

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
    submissions: [],
  };
}

// ---- API records -------------------------------------------------------------

type Timestamps = { createdAt?: string; updatedAt?: string };

type CurriculumRecord = Timestamps & {
  id: string;
  trackId: string;
  cohortId?: string | null;
  title: string;
  description?: string | null;
  status: "ONGOING" | "COMPLETED";
  publishStatus: ModuleStatus;
  progressMode: ProgressMode;
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
  cohort?: { id: string; name: string } | null;
  assignedInstructors: { id: string; name: string; email: string }[];
};

type TopicRecord = Timestamps & {
  id: string;
  curriculumId: string;
  title: string;
  description: string;
  position: number;
  publishStatus: ModuleStatus;
  outcomes: string[];
};

type LessonRecord = Timestamps & {
  id: string;
  topicId: string;
  title: string;
  description?: string | null;
  position?: number | null;
};

type ResourceRecord = Timestamps & {
  id: string;
  /** Set for lesson resources; `null` for ones on the whole module. */
  lessonId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string | null;
  url: string;
  type?: "PDF" | "VIDEO" | "DOCUMENT" | "IMAGE" | "LINK";
  fileName?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  publishStatus: ModuleStatus;
};

type AssignmentRecord = Timestamps & {
  id: string;
  /** Set for lesson assignments; `null` for ones on the whole module. */
  lessonId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueAt?: string | null;
  submissionType: SubmissionType;
  publishStatus: ModuleStatus;
  attachments: string[];
};

type NoteRecord = Timestamps & {
  id: string;
  topicId?: string | null;
  title: string;
  body: string;
  isPinned?: boolean;
  pinned?: boolean;
  author?: { firstName: string; lastName: string } | null;
};

type RecordingRecord = Timestamps & {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  durationSec?: number | null;
};

type LessonTree = LessonRecord & {
  resources: ResourceRecord[];
  assignments: AssignmentRecord[];
  recordings: RecordingRecord[];
};

type TopicTree = TopicRecord & {
  lessons: LessonTree[];
  /** Resources and assignments on the whole module rather than a lesson. */
  resources: ResourceRecord[];
  assignments: AssignmentRecord[];
};

// ---- Session-only store for fields the API doesn't have ------------------------

/**
 * PENDING-BACKEND: the API has no assignment type, group mode or submissions
 * list for admins, and no file upload, so picked files stay in the session.
 */
type AssignmentExtras = Partial<
  Pick<ModuleAssignment, "type" | "mode" | "submissions"> & { files: ResourceFile[] }
>;

const local = {
  /** PENDING-BACKEND: the API has no version history. */
  history: new Map<string, CurriculumHistoryEntry[]>(),
  /** Files uploaded to a whole module. */
  moduleFiles: new Map<string, ResourceFile[]>(),
  /** PENDING-BACKEND: lesson topic labels and lesson file uploads. */
  lessons: new Map<string, { topic?: string; files?: ResourceFile[] }>(),
  assignments: new Map<string, AssignmentExtras>(),
};

// ---- Helpers -----------------------------------------------------------------

async function getData<T>(path: string, query?: Record<string, string | number>) {
  const { data } = await api.get<Envelope<T>>(path, { query });
  return data;
}

async function postData<T>(path: string, body: unknown) {
  const { data } = await api.post<Envelope<T>>(path, body);
  return data;
}

/** Orders by `position`; items without one go last, oldest first. */
function byPosition<T extends Timestamps & { position?: number | null }>(items: T[]) {
  const last = Number.MAX_SAFE_INTEGER;
  return [...items].sort(
    (a, b) =>
      (a.position ?? last) - (b.position ?? last) ||
      (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
  );
}

/** Leaves optional text out of create payloads when it's blank. */
function optionalText(key: string, value: string) {
  return value ? { [key]: value } : {};
}

function assertHttpsLink(url: string, label: string) {
  if (!/^https:\/\/\S+$/.test(url)) {
    throw new Error(`${label} must be a full link starting with https://`);
  }
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

async function currentUserName() {
  const session = await getSession().catch(() => null);
  return session?.user.name ?? "Admin";
}

// ---- Loading + mapping ---------------------------------------------------------

async function loadLesson(lesson: LessonRecord): Promise<LessonTree> {
  const [resources, assignments, recordings] = await Promise.all([
    getData<ResourceRecord[]>(`/admin/lessons/${lesson.id}/resources`),
    getData<AssignmentRecord[]>(`/admin/lessons/${lesson.id}/assignments`),
    getData<RecordingRecord[]>(`/admin/lessons/${lesson.id}/recordings`),
  ]);
  return { ...lesson, resources, assignments, recordings };
}

async function loadTopic(topic: TopicRecord): Promise<TopicTree> {
  const [lessons, resources, assignments] = await Promise.all([
    getData<LessonRecord[]>(`/admin/topics/${topic.id}/lessons`),
    getData<ResourceRecord[]>(`/admin/topics/${topic.id}/resources`),
    getData<AssignmentRecord[]>(`/admin/topics/${topic.id}/assignments`),
  ]);
  return {
    ...topic,
    lessons: await Promise.all(byPosition(lessons).map(loadLesson)),
    // Lesson items are read per lesson, so keep only the module-wide ones.
    resources: resources.filter((r) => !r.lessonId),
    assignments: assignments.filter((a) => !a.lessonId),
  };
}

async function listTopics(curriculumId: string) {
  return byPosition(
    await getData<TopicRecord[]>(`/admin/curriculums/${curriculumId}/topics`)
  );
}

/** One request per topic and three per lesson — the API has no nested read. */
async function loadTree(curriculumId: string) {
  return Promise.all((await listTopics(curriculumId)).map(loadTopic));
}

function toResourceFile(record: ResourceRecord): ResourceFile {
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

/** An assignment attachment, which the API stores as a bare link. */
function attachmentFile(url: string): ResourceFile {
  return newResourceFile(
    { name: fileNameFromUrl(url), sizeBytes: null },
    { id: url, url, uploadedBy: "--" }
  );
}

function toAssignment(
  record: AssignmentRecord,
  lessonPosition: number | null
): ModuleAssignment {
  const { files = [], ...extras } = local.assignments.get(record.id) ?? {};
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

function toModule(topic: TopicTree): CurriculumModule {
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
        lesson.assignments.map((a) => toAssignment(a, index + 1))
      ),
      ...topic.assignments.map((a) => toAssignment(a, null)),
    ],
    // PENDING-BACKEND: no cover images or recording thumbnails in the API.
    coverImage: null,
    liveClassRecordings: [],
  };
}

async function toCurriculum(record: CurriculumRecord, knownTrack?: Track): Promise<Curriculum> {
  const [track, students] = await Promise.all([
    knownTrack ?? getData<Track>(`/admin/tracks/${record.trackId}`),
    getData<Paginated<AdminUser>>("/admin/users", {
      role: "STUDENT",
      trackId: record.trackId,
      ...(record.cohortId && { cohortId: record.cohortId }),
      limit: 1,
    }),
  ]);
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
    studentCount: students.total,
    instructor: instructor
      ? { name: instructor.name, email: instructor.email }
      : { name: "Not assigned", email: "" },
    // PENDING-BACKEND: no live classes in the API.
    liveClasses: [],
    publishStatus: record.publishStatus,
    progressMode: record.progressMode,
    history: local.history.get(record.id) ?? [],
  };
}

// ---- Curriculum ----------------------------------------------------------------

/** Filters for the curriculum list. An empty list means "all". */
export type CurriculumFilters = {
  statuses: ModuleStatus[];
  trackIds: string[];
};

export const noCurriculumFilters: CurriculumFilters = { statuses: [], trackIds: [] };

async function listCurricula(filters: CurriculumFilters, cohortId?: string) {
  const { statuses, trackIds } = filters;
  const [tracks, records] = await Promise.all([
    getData<Track[]>("/admin/tracks"),
    // The API takes a single track and status, so wider picks are filtered here.
    getData<CurriculumRecord[]>("/admin/curriculums", {
      ...(cohortId && { cohortId }),
      ...(trackIds.length === 1 && { trackId: trackIds[0] }),
      ...(statuses.length === 1 && { publishStatus: statuses[0] }),
    }),
  ]);
  const matches = records.filter(
    (record) =>
      (trackIds.length === 0 || trackIds.includes(record.trackId)) &&
      (statuses.length === 0 || statuses.includes(record.publishStatus))
  );
  return Promise.all(
    matches.map((record) =>
      toCurriculum(record, tracks.find((track) => track.id === record.trackId))
    )
  );
}

async function getCurriculum(id: string) {
  return toCurriculum(await getData<CurriculumRecord>(`/admin/curriculums/${id}`));
}

export async function createCurriculum(input: CreateCurriculumInput) {
  return postData<CurriculumRecord>(`/admin/tracks/${input.trackId}/curriculums`, {
    title: input.title,
    ...optionalText("description", input.description),
    ...optionalText("cohortId", input.cohortId),
    status: "ONGOING",
    publishStatus: "DRAFT",
  });
}

/** Describes a settings change for the version history, e.g. "changed module access to Flexible". */
function describeChange(input: UpdateCurriculumInput) {
  if (input.progressMode) return `changed module access to ${progressModes[input.progressMode]}`;
  if (input.publishStatus)
    return `changed curriculum status to ${input.publishStatus === "PUBLISHED" ? "Published" : "Draft"}`;
  return "updated the curriculum details";
}

export async function updateCurriculum(id: string, input: UpdateCurriculumInput) {
  const { title, description, publishStatus, progressMode } = input;
  await api.patch(`/admin/curriculums/${id}`, {
    title,
    description,
    publishStatus,
    progressMode,
  });

  local.history.set(id, [
    {
      id: crypto.randomUUID(),
      actor: await currentUserName(),
      action: describeChange(input),
      at: new Date().toISOString(),
    },
    ...(local.history.get(id) ?? []),
  ]);
}

export async function deleteCurriculum(id: string) {
  await api.delete(`/admin/curriculums/${id}`);
  local.history.delete(id);
}

// ---- Notes ---------------------------------------------------------------------

function toNote(record: NoteRecord): CurriculumNote {
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

async function listNotes(curriculumId: string) {
  const records = await getData<NoteRecord[]>(`/admin/curriculums/${curriculumId}/notes`);
  return records
    .map(toNote)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)
    );
}

export async function createNote(curriculumId: string, input: SaveNoteInput) {
  const record = await postData<NoteRecord>(`/admin/curriculums/${curriculumId}/notes`, {
    title: input.title,
    body: input.body,
    ...(input.moduleId && { topicId: input.moduleId }),
  });
  return toNote(record);
}

export async function updateNote(
  curriculumId: string,
  noteId: string,
  changes: Partial<CurriculumNote>
) {
  const path = `/admin/curriculums/${curriculumId}/notes/${noteId}`;
  const { title, body, moduleId, pinned } = changes;
  if (title !== undefined || body !== undefined || moduleId !== undefined) {
    await api.patch(path, { title, body, topicId: moduleId });
  }
  if (pinned !== undefined) await api.patch(`${path}/pin`, { isPinned: pinned });
}

export async function deleteNote(curriculumId: string, noteId: string) {
  await api.delete(`/admin/curriculums/${curriculumId}/notes/${noteId}`);
}

// ---- Modules -------------------------------------------------------------------

async function listModules(curriculumId: string) {
  return (await loadTree(curriculumId)).map(toModule);
}

async function getTopicTree(id: string) {
  return loadTopic(await getData<TopicRecord>(`/admin/topics/${id}`));
}

async function getModule(id: string) {
  return toModule(await getTopicTree(id));
}

/** Throws before anything is saved if the content can't be attached anywhere. */
function assertModuleContent(lessonCount: number, input: Partial<SaveModuleInput>) {
  if (input.recordingLink && lessonCount === 0) {
    throw new Error(
      "Add at least one lesson. The class recording is saved on this module's lessons."
    );
  }
  if (input.recordingLink) assertHttpsLink(input.recordingLink, "The class recording link");
}

export async function createModule(curriculumId: string, input: SaveModuleInput) {
  assertModuleContent(input.lessons.length, input);
  const topics = await listTopics(curriculumId);
  const topic = await postData<TopicRecord>(`/admin/curriculums/${curriculumId}/topics`, {
    title: input.title,
    description: input.description,
    position: topics.reduce((next, t) => Math.max(next, t.position + 1), 0),
    publishStatus: input.status,
    outcomes: input.outcomes,
  });
  await updateModule(topic.id, {
    ...input,
    title: undefined,
    description: undefined,
    status: undefined,
    outcomes: undefined,
  });
  return getModule(topic.id);
}

/**
 * Saves whichever parts of the module are given. Uploaded files and lesson
 * topic labels are session only; everything else is synced with the API.
 */
export async function updateModule(id: string, input: Partial<SaveModuleInput>) {
  const tree = await getTopicTree(id);
  assertModuleContent(input.lessons?.length ?? tree.lessons.length, input);

  const { title, description, status, outcomes } = input;
  if ([title, description, status, outcomes].some((value) => value !== undefined)) {
    await api.patch(`/admin/topics/${id}`, {
      title,
      description,
      publishStatus: status,
      outcomes,
    });
  }

  if (input.resources) {
    await deleteRemovedResources(tree.resources, input.resources);
    local.moduleFiles.set(
      id,
      input.resources.filter((r) => !r.url)
    );
  }

  const lessons = input.lessons
    ? await syncLessons(id, tree.lessons, input.lessons)
    : tree.lessons;
  if (input.recordingLink !== undefined) {
    await syncRecording(lessons, input.recordingLink);
  }
  if (input.assignments) {
    await syncAssignments(id, lessons, tree.assignments, input.assignments);
  }
}

/** Deletes saved resources that were removed in the form. */
async function deleteRemovedResources(saved: ResourceRecord[], kept: ResourceFile[]) {
  const keptIds = new Set(kept.map((r) => r.id));
  await Promise.all(
    saved
      .filter((r) => !keptIds.has(r.id))
      .map((r) => api.delete(`/admin/resources/${r.id}`))
  );
}

async function syncLessons(
  topicId: string,
  existing: LessonTree[],
  drafts: ModuleLesson[]
): Promise<LessonTree[]> {
  const draftIds = new Set(drafts.map((d) => d.id));
  await Promise.all(
    existing
      .filter((l) => !draftIds.has(l.id))
      .map((l) => api.delete(`/admin/lessons/${l.id}`))
  );

  const saved: LessonTree[] = [];
  for (const [position, draft] of drafts.entries()) {
    let lesson = existing.find((l) => l.id === draft.id);
    if (!lesson) {
      const created = await postData<LessonRecord>(`/admin/topics/${topicId}/lessons`, {
        title: draft.title,
        ...optionalText("description", draft.description),
        position,
      });
      lesson = { ...created, resources: [], assignments: [], recordings: [] };
    } else {
      const changed =
        lesson.title !== draft.title ||
        (lesson.description ?? "") !== draft.description ||
        lesson.position !== position;
      if (changed) {
        await api.patch(`/admin/lessons/${lesson.id}`, {
          title: draft.title,
          description: draft.description || null,
          position,
        });
      }
      await deleteRemovedResources(lesson.resources, draft.resources);
    }

    // PENDING-BACKEND: topic labels and uploaded files have no API field.
    local.lessons.set(lesson.id, {
      topic: draft.topic,
      files: draft.resources.filter((r) => !r.url),
    });
    saved.push(lesson);
  }
  return saved;
}

async function syncRecording(lessons: LessonTree[], link: string) {
  const recording = lessons.flatMap((l) => l.recordings)[0];
  if (recording && !link) {
    await api.delete(`/admin/recordings/${recording.id}`);
  } else if (recording && recording.url !== link) {
    await api.patch(`/admin/recordings/${recording.id}`, { url: link });
  } else if (!recording && link) {
    // The API only has lesson recordings, so the module's goes on lesson 1.
    await postData(`/admin/lessons/${lessons[0].id}/recordings`, {
      title: "Class recording",
      url: link,
    });
  }
}

async function syncAssignments(
  topicId: string,
  lessons: LessonTree[],
  moduleAssignments: AssignmentRecord[],
  drafts: ModuleAssignment[]
) {
  const existing = [...lessons.flatMap((l) => l.assignments), ...moduleAssignments];
  const draftIds = new Set(drafts.map((d) => d.id));
  await Promise.all(
    existing
      .filter((a) => !draftIds.has(a.id))
      .map((a) => deleteAssignment(a.id))
  );

  for (const draft of drafts) {
    if (existing.some((a) => a.id === draft.id)) {
      await updateAssignment(draft.id, draft);
    } else {
      const lesson = draft.afterLesson ? lessons[draft.afterLesson - 1] : undefined;
      await postAssignment(topicId, lesson?.id, draft);
    }
  }
}

export async function deleteModule(id: string) {
  await api.delete(`/admin/topics/${id}`);
  local.moduleFiles.delete(id);
}

/** Saves a new module order as each topic's `position`. */
export async function reorderModules(curriculumId: string, orderedIds: string[]) {
  const topics = await listTopics(curriculumId);
  const moved = orderedIds
    .map((id, index) => ({ topic: topics.find((t) => t.id === id), index }))
    .filter(
      (item): item is { topic: TopicRecord; index: number } =>
        item.topic !== undefined && item.topic.position !== item.index
    );

  // Park moved topics past the end first so no two ever share a position.
  const parking = topics.reduce((max, t) => Math.max(max, t.position), 0) + 1;
  for (const { topic, index } of moved) {
    await api.patch(`/admin/topics/${topic.id}`, { position: parking + index });
  }
  for (const { topic, index } of moved) {
    await api.patch(`/admin/topics/${topic.id}`, { position: index });
  }
}

// ---- Assignments ---------------------------------------------------------------

function toAssignments(modules: CurriculumModule[]) {
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

/** Links to send as attachments; picked files have no link and stay local. */
function attachmentLinks(resources: ResourceFile[]) {
  return resources.flatMap((r) => (r.url ? [r.url] : []));
}

function toIsoDate(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

/** Saves the fields the API doesn't have. */
function saveAssignmentExtras(id: string, changes: Partial<ModuleAssignment>) {
  const { type, mode, submissions, resources } = changes;
  local.assignments.set(id, {
    ...local.assignments.get(id),
    ...(type && { type }),
    ...(mode && { mode }),
    ...(submissions && { submissions }),
    ...(resources && { files: resources.filter((r) => !r.url) }),
  });
}

/** Creates an assignment on a lesson, or on the whole module without one. */
async function postAssignment(
  topicId: string,
  lessonId: string | undefined,
  assignment: ModuleAssignment
) {
  const record = await postData<AssignmentRecord>(`/admin/topics/${topicId}/assignments`, {
    title: assignment.title,
    ...optionalText("description", assignment.description),
    ...optionalText("instructions", assignment.instructions),
    ...(assignment.dueAt && { dueAt: toIsoDate(assignment.dueAt) }),
    submissionType: assignment.submissionType,
    publishStatus: assignment.status,
    attachments: attachmentLinks(assignment.resources),
    ...(lessonId && { lessonId }),
  });
  saveAssignmentExtras(record.id, assignment);
  return record;
}

export async function createAssignment(moduleId: string, input: CreateAssignmentInput) {
  const lessons = byPosition(
    await getData<LessonRecord[]>(`/admin/topics/${moduleId}/lessons`)
  );
  // "Due relative to lesson" picks the lesson; otherwise it's on the whole module.
  const lesson = input.afterLesson ? lessons[input.afterLesson - 1] : undefined;
  const draft: ModuleAssignment = {
    ...emptyAssignment(),
    ...input,
    afterLesson: lesson ? input.afterLesson : null,
  };
  const record = await postAssignment(moduleId, lesson?.id, draft);
  return { ...draft, id: record.id };
}

export async function updateAssignment(
  assignmentId: string,
  changes: Partial<ModuleAssignment>
) {
  const { title, description, instructions, submissionType, dueAt, status, resources } =
    changes;
  await api.patch(`/admin/assignments/${assignmentId}`, {
    title,
    description,
    instructions,
    submissionType,
    ...(dueAt !== undefined && { dueAt: toIsoDate(dueAt) }),
    publishStatus: status,
    ...(resources && { attachments: attachmentLinks(resources) }),
  });
  saveAssignmentExtras(assignmentId, changes);
}

export async function deleteAssignment(assignmentId: string) {
  await api.delete(`/admin/assignments/${assignmentId}`);
  local.assignments.delete(assignmentId);
}

// ---- Resources -----------------------------------------------------------------

function toResources(modules: CurriculumModule[]) {
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

/**
 * Links are saved to the API. PENDING-BACKEND: it has no upload endpoint, so a
 * picked file can't be saved there and is kept for the session only.
 */
export async function createResource(
  moduleId: string,
  lessonId: string | null,
  input: CreateResourceInput
) {
  if (input.url) {
    assertHttpsLink(input.url, "The link");
    const record = await postData<ResourceRecord>(
      lessonId
        ? `/admin/lessons/${lessonId}/resources`
        : `/admin/topics/${moduleId}/resources`,
      {
        title: input.title,
        ...optionalText("description", input.description),
        url: input.url,
        type: "LINK",
        publishStatus: "PUBLISHED",
      }
    );
    return toResourceFile(record);
  }

  const created = newResourceFile(input);
  if (lessonId) {
    const extras = local.lessons.get(lessonId) ?? {};
    local.lessons.set(lessonId, { ...extras, files: [...(extras.files ?? []), created] });
  } else {
    local.moduleFiles.set(moduleId, [...(local.moduleFiles.get(moduleId) ?? []), created]);
  }
  return created;
}

/** Applies `change` to the session-only list holding the resource, if any. */
function editLocalResources(
  resourceId: string,
  change: (resources: ResourceFile[]) => ResourceFile[]
) {
  const holds = (list?: ResourceFile[]) => !!list?.some((r) => r.id === resourceId);

  for (const [id, files] of local.moduleFiles) {
    if (holds(files)) {
      local.moduleFiles.set(id, change(files));
      return true;
    }
  }
  for (const [id, extras] of local.lessons) {
    if (holds(extras.files)) {
      local.lessons.set(id, { ...extras, files: change(extras.files!) });
      return true;
    }
  }
  return false;
}

export async function updateResource(resourceId: string, changes: Partial<ResourceFile>) {
  const isLocal = editLocalResources(resourceId, (resources) =>
    resources.map((r) => (r.id === resourceId ? { ...r, ...changes } : r))
  );
  if (isLocal) return;

  const { title, description, status } = changes;
  await api.patch(`/admin/resources/${resourceId}`, {
    title,
    description,
    publishStatus: status,
  });
}

export async function deleteResource(resourceId: string) {
  const isLocal = editLocalResources(resourceId, (resources) =>
    resources.filter((r) => r.id !== resourceId)
  );
  if (!isLocal) await api.delete(`/admin/resources/${resourceId}`);
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

// ---- Query keys + options ------------------------------------------------------

export const curriculumKeys = {
  all: () => ["curriculum"] as const,
  list: () => ["curriculum", "list"] as const,
  /** Sits under `list()`, so invalidating that refreshes every filtered list. */
  listBy: ({ statuses, trackIds }: CurriculumFilters, cohortId?: string) =>
    [
      "curriculum",
      "list",
      {
        statuses: [...statuses].sort(),
        trackIds: [...trackIds].sort(),
        cohortId,
      },
    ] as const,
  detail: (id: string) => ["curriculum", "detail", id] as const,
  // Assignments and resources are read from this same tree, so invalidating
  // it refreshes every tab.
  modules: (curriculumId: string) =>
    ["curriculum", "modules", curriculumId] as const,
  module: (id: string) => ["curriculum", "module", id] as const,
  notes: (curriculumId: string) => ["curriculum", "notes", curriculumId] as const,
};

const modulesQuery = (curriculumId: string) => ({
  queryKey: curriculumKeys.modules(curriculumId),
  queryFn: () => listModules(curriculumId),
});

export const curriculumQueries = {
  list: (filters: CurriculumFilters = noCurriculumFilters, cohortId?: string) =>
    queryOptions({
      queryKey: curriculumKeys.listBy(filters, cohortId),
      queryFn: () => listCurricula(filters, cohortId),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: curriculumKeys.detail(id),
      queryFn: () => getCurriculum(id),
    }),

  modules: (curriculumId: string) => queryOptions(modulesQuery(curriculumId)),

  module: (id: string) =>
    queryOptions({
      queryKey: curriculumKeys.module(id),
      queryFn: () => getModule(id),
    }),

  assignments: (curriculumId: string) =>
    queryOptions({ ...modulesQuery(curriculumId), select: toAssignments }),

  assignment: (curriculumId: string, assignmentId: string) =>
    queryOptions({
      ...modulesQuery(curriculumId),
      select: (modules: CurriculumModule[]) =>
        toAssignments(modules).find((item) => item.assignment.id === assignmentId),
    }),

  notes: (curriculumId: string) =>
    queryOptions({
      queryKey: curriculumKeys.notes(curriculumId),
      queryFn: () => listNotes(curriculumId),
    }),

  resources: (curriculumId: string) =>
    queryOptions({ ...modulesQuery(curriculumId), select: toResources }),

  resource: (curriculumId: string, resourceId: string) =>
    queryOptions({
      ...modulesQuery(curriculumId),
      select: (modules: CurriculumModule[]) =>
        toResources(modules).find((item) => item.resource.id === resourceId),
    }),
};

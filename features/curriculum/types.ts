import type { LucideIcon } from "lucide-react";

// The API models a curriculum as Curriculum → Topic → Lesson, with resources,
// assignments and recordings attached to each lesson. The UI calls a topic a
// "module". View types are what the screens render; API records are what the
// backend returns, and `mappers.ts` turns one into the other.

/** Who is managing the curriculum; it picks the API prefix and the routes. */
export type CurriculumRole = "admin" | "instructor";

// ---- View types (what the screens render) -----------------------------------

export type TrackDetails = { label: string; icon: LucideIcon; iconClassName: string };

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

/** Filters for the curriculum list. An empty list means "all". */
export type CurriculumFilters = {
  statuses: ModuleStatus[];
  trackIds: string[];
};

export const noCurriculumFilters: CurriculumFilters = { statuses: [], trackIds: [] };

// ---- API records -------------------------------------------------------------

export type Timestamps = { createdAt?: string; updatedAt?: string };

export type CurriculumRecord = Timestamps & {
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

export type TopicRecord = Timestamps & {
  id: string;
  curriculumId: string;
  title: string;
  description: string;
  position: number;
  publishStatus: ModuleStatus;
  outcomes: string[];
};

export type LessonRecord = Timestamps & {
  id: string;
  topicId: string;
  title: string;
  description?: string | null;
  position?: number | null;
};

export type ResourceRecord = Timestamps & {
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

export type AssignmentRecord = Timestamps & {
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

export type NoteRecord = Timestamps & {
  id: string;
  topicId?: string | null;
  title: string;
  body: string;
  isPinned?: boolean;
  pinned?: boolean;
  author?: { firstName: string; lastName: string } | null;
};

export type RecordingRecord = Timestamps & {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  durationSec?: number | null;
};

export type LessonTree = LessonRecord & {
  resources: ResourceRecord[];
  assignments: AssignmentRecord[];
  recordings: RecordingRecord[];
};

export type TopicTree = TopicRecord & {
  lessons: LessonTree[];
  /** Resources and assignments on the whole module rather than a lesson. */
  resources: ResourceRecord[];
  assignments: AssignmentRecord[];
};

// ---- Session-only fields the API doesn't have ----------------------------------

/**
 * PENDING-BACKEND: the API has no assignment type, group mode or submissions
 * list for admins, and no file upload, so picked files stay in the session.
 */
export type AssignmentExtras = Partial<
  Pick<ModuleAssignment, "type" | "mode" | "submissions"> & { files: ResourceFile[] }
>;

/** The in-memory store in `api.ts`; it resets on a full page reload. */
export type SessionExtras = {
  /** PENDING-BACKEND: the API has no version history. */
  history: Map<string, CurriculumHistoryEntry[]>;
  /** Files uploaded to a whole module. */
  moduleFiles: Map<string, ResourceFile[]>;
  /** PENDING-BACKEND: lesson topic labels and lesson file uploads. */
  lessons: Map<string, { topic?: string; files?: ResourceFile[] }>;
  assignments: Map<string, AssignmentExtras>;
};

import { queryOptions } from "@tanstack/react-query";
import {
  Code,
  Database,
  PenTool,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import { ApiError } from "@/lib/api";

// Placeholder data only — no backend yet. The async functions below stand in
// for API calls, so swapping in real endpoints only means replacing their
// bodies. Data lives in memory and resets on a full page reload.

export const TRACKS = {
  design: {
    label: "Design",
    icon: PenTool,
    iconClassName: "bg-surface-brand text-brand-primary",
  },
  frontend: {
    label: "Frontend",
    icon: Code,
    iconClassName: "bg-surface-info-badge text-text-info",
  },
  backend: {
    label: "Backend",
    icon: Database,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  mobile: {
    label: "Mobile",
    icon: Smartphone,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
} satisfies Record<
  string,
  { label: string; icon: LucideIcon; iconClassName: string }
>;

export type TrackKey = keyof typeof TRACKS;

export const COHORTS = ["Cohort 2026", "Cohort 2025"] as const;
export type Cohort = (typeof COHORTS)[number];

export type ModuleStatus = "PUBLISHED" | "DRAFT";

export type ResourceFile = {
  id: string;
  /** The uploaded file's name, e.g. "visual-hierarchy.pdf". */
  name: string;
  sizeBytes: number;
  /** Display name shown in the Resources tab. */
  title: string;
  description: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ModuleStatus;
};

export const RESOURCE_KINDS = {
  PDF: { extensions: [".pdf"], formats: "PDF" },
  Video: { extensions: [".mp4"], formats: "MP4" },
  Document: { extensions: [".docx", ".pptx"], formats: "DOCX and PPTX" },
  Image: { extensions: [".jpeg", ".jpg", ".png"], formats: "JPEG and PNG" },
} as const;

export type ResourceKind = keyof typeof RESOURCE_KINDS;

export function resourceKind(fileName: string): ResourceKind | "File" {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  const match = (Object.keys(RESOURCE_KINDS) as ResourceKind[]).find((kind) =>
    (RESOURCE_KINDS[kind].extensions as readonly string[]).includes(extension)
  );
  return match ?? "File";
}

export function newResourceFile(
  file: { name: string; sizeBytes: number },
  overrides: Partial<ResourceFile> = {}
): ResourceFile {
  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.[^.]+$/, ""),
    description: "",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Aishat Lawal",
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
  "name" | "sizeBytes" | "title" | "description"
>;

export type ModuleLesson = {
  id: string;
  topic: string;
  title: string;
  description: string;
  resources: ResourceFile[];
};

export const SUBMISSION_TYPES = {
  FILE_UPLOAD: "File Upload",
  LINK: "Link",
  TEXT: "Text Entry",
} as const;

export type SubmissionType = keyof typeof SUBMISSION_TYPES;

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
  track: TrackKey;
  cohort: Cohort;
  status: "Active";
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
  studentCount: number;
  instructor: { name: string; email: string };
  liveClasses: LiveClass[];
  publishStatus: ModuleStatus;
  progressMode: ProgressMode;
  history: CurriculumHistoryEntry[];
  notes: CurriculumNote[];
};

export const PROGRESS_MODES = {
  SEQUENTIAL: "Sequential",
  FLEXIBLE: "Flexible",
} as const;

export type ProgressMode = keyof typeof PROGRESS_MODES;

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

export type CreateCurriculumInput = Pick<
  Curriculum,
  "title" | "description" | "track" | "cohort"
>;

export type SaveModuleInput = Omit<
  CurriculumModule,
  "id" | "curriculumId" | "coverImage" | "liveClassRecordings"
>;

// ---- Placeholder store ---------------------------------------------------

const DESIGN_DESCRIPTION =
  "This curriculum is designed to help students build a strong foundation in product and ux design. It covers the full design process from research and ideation to prototyping and design systems.";

const MODULE_DESCRIPTION =
  "Discover how product design turns user needs into useful, intuitive and meaningful experiences. Explore the core principles of colour, typography and layout, and learn how designers move from understanding a problem to developing a solution. Through real-world examples, see how thoughtful design improves everyday products and helps people achieve their goals.";

const PLACEHOLDER_INSTRUCTOR = {
  name: "Aishat Lawal",
  email: "aishatlawal21@gmail.com",
};

const PLACEHOLDER_NOTE_BODY =
  "Added the new Design Systems module for Cohort 2026. The old component lesson has been moved to Module 6.";

const PLACEHOLDER_NOTES: CurriculumNote[] = [
  {
    id: "n-1",
    title: "Curriculum update",
    body: PLACEHOLDER_NOTE_BODY,
    moduleId: "user-journey-mapping",
    author: "Aishat Lawal",
    createdAt: "2026-09-28T10:00:00",
    pinned: true,
  },
  {
    id: "n-2",
    title: "Curriculum update",
    body: PLACEHOLDER_NOTE_BODY,
    moduleId: "user-journey-mapping",
    author: "Aishat Lawal",
    createdAt: "2026-09-28T09:00:00",
    pinned: false,
  },
  {
    id: "n-3",
    title: "Instructor handoff",
    body: "Review the Figma resources before publishing Module 4...",
    moduleId: null,
    author: "Aishat Lawal",
    createdAt: "2026-09-28T08:00:00",
    pinned: false,
  },
];

const PLACEHOLDER_LIVE_CLASSES: LiveClass[] = [
  { id: "lc-1", title: "Foundations · Week 1", scheduledFor: "2026-10-10" },
  { id: "lc-2", title: "Color · Week 1", scheduledFor: null },
  { id: "lc-3", title: "layout · Week 1", scheduledFor: null },
];

function placeholderCurriculum(
  id: string,
  title: string,
  track: TrackKey,
  totals: [number, number, number]
): Curriculum {
  return {
    id,
    title,
    description: DESIGN_DESCRIPTION,
    track,
    cohort: "Cohort 2026",
    status: "Active",
    totalModules: totals[0],
    totalLessons: totals[1],
    totalAssignments: totals[2],
    studentCount: 16,
    instructor: PLACEHOLDER_INSTRUCTOR,
    liveClasses: PLACEHOLDER_LIVE_CLASSES,
    publishStatus: "PUBLISHED",
    progressMode: "SEQUENTIAL",
    history: [
      {
        id: "h-1",
        actor: "Aishat Lawal",
        action: "changed module access to Sequential",
        at: "2026-10-08T10:00:00",
      },
    ],
    notes: id === "design-track-curriculum" ? PLACEHOLDER_NOTES : [],
  };
}

let curricula: Curriculum[] = [
  placeholderCurriculum("design-track-curriculum", "Design Track Curriculum", "design", [12, 40, 29]),
  placeholderCurriculum("frontend-track-curriculum", "Frontend Track Curriculum", "frontend", [23, 70, 70]),
  placeholderCurriculum("backend-track-curriculum", "Backend Track Curriculum", "backend", [23, 70, 70]),
  placeholderCurriculum("mobile-track-curriculum", "Mobile Track Curriculum", "mobile", [23, 70, 70]),
];

function placeholderFile(
  id: string,
  name: string,
  sizeBytes: number,
  overrides: Partial<ResourceFile> = {}
) {
  return newResourceFile(
    { name, sizeBytes },
    { id, uploadedAt: "2026-10-01T09:00:00", ...overrides }
  );
}

const PLACEHOLDER_STUDENT = {
  studentName: "Aishat Lawal",
  studentEmail: "aishatlawal21@gmail.com",
};

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

function draftModule(id: string, curriculumId: string, title: string): CurriculumModule {
  return {
    id,
    curriculumId,
    title,
    description: MODULE_DESCRIPTION,
    status: "DRAFT",
    outcomes: [],
    recordingLink: "",
    resources: [],
    lessons: [],
    assignments: [],
    coverImage: null,
    liveClassRecordings: [],
  };
}

let modules: CurriculumModule[] = [
  {
    id: "introduction-to-design",
    curriculumId: "design-track-curriculum",
    title: "Introduction to Design",
    description: MODULE_DESCRIPTION,
    status: "PUBLISHED",
    outcomes: [
      "Understand the basics of visual hierarchy, contrast, and composition",
      "Apply color, typography, and spacing to communicate a message",
      "Create a simple composition that guides the viewer’s attention",
    ],
    recordingLink: "https://risecampus.com/academy/introduction-to-design",
    resources: [
      placeholderFile("r-1", "Introduction to Design workbook.pdf", 2.4e6),
    ],
    lessons: [
      {
        id: "l-1",
        topic: "Foundations",
        title: "Introduction to visual design",
        description:
          "Cover the basics of design thinking, visual principles, and how to communicate ideas clearly.",
        resources: [
          placeholderFile("r-2", "lesson-1-live-class.mp4", 1.2e9, {
            title: "Lesson 1 Live class recording",
          }),
        ],
      },
      {
        id: "l-2",
        topic: "Color & typography",
        title: "Color and typography basics",
        description:
          "Learn how to choose colors, pair typefaces, and create readable layouts.",
        resources: [
          placeholderFile("r-3", "visual-hierarchy.pdf", 1.2e6, {
            title: "Visual Hierarchy",
          }),
          placeholderFile("r-6", "lesson-2-live-class.mp4", 1.2e9, {
            title: "Lesson 2 Live class recording",
            uploadedAt: "2026-10-05T09:00:00",
            status: "DRAFT",
          }),
          placeholderFile("r-7", "lesson-2-live-class-notes.docx", 880e3, {
            title: "Lesson 2 Live class recording",
            uploadedAt: "2026-10-05T09:00:00",
            status: "DRAFT",
          }),
        ],
      },
      {
        id: "l-3",
        topic: "Composition & layout",
        title: "Composition and layout",
        description:
          "Practice arranging elements to guide attention, balance content, and create flow.",
        resources: [placeholderFile("r-4", "Layout exercises.pdf", 1.1e6)],
      },
    ],
    assignments: [
      {
        ...emptyAssignment("a-1"),
        title: "Visual Hierarchy",
        description: "Redesign a simple landing page using hierarchy and contrast",
        instructions:
          "Use typography, spacing, and color to guide the viewer through the page.",
        resources: [placeholderFile("r-5", "Design.pdf", 2.4e6)],
        dueAt: "2026-10-12T23:59:00",
        afterLesson: 3,
        status: "PUBLISHED",
        submissions: [
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `s-${i + 1}`,
            ...PLACEHOLDER_STUDENT,
            submittedAt: "2026-10-12T16:00:00",
            grade: null,
          })),
          { id: "s-6", ...PLACEHOLDER_STUDENT, submittedAt: null, grade: null },
        ],
      },
      {
        ...emptyAssignment("a-2"),
        title: "Visual Hierarchy",
        description: "Redesign a simple landing page using hierarchy and contrast",
        dueAt: "2026-10-12T23:59:00",
        afterLesson: 3,
      },
      {
        ...emptyAssignment("a-3"),
        title: "Visual Hierarchy",
        description: "Redesign a simple landing page using hierarchy and contrast",
        dueAt: "2026-10-12T23:59:00",
        afterLesson: 3,
      },
    ],
    coverImage: "/module-cover.jpg",
    liveClassRecordings: [
      { title: "Live Class 2", thumbnail: "/live-class-2.jpg" },
      { title: "Live Class 3", thumbnail: "/live-class-3.jpg" },
    ],
  },
  {
    ...draftModule("user-research-and-analysis", "design-track-curriculum", "User Research and Analysis"),
    assignments: [
      {
        ...emptyAssignment("a-4"),
        title: "User Reasearch Report",
        description: "Summarise findings from three user interviews.",
        type: "Report",
        dueAt: "2026-10-21T23:59:00",
        afterLesson: 4,
      },
    ],
  },
  draftModule("design-layout", "design-track-curriculum", "Design Layout"),
  draftModule("figma-fundamentals", "design-track-curriculum", "Figma Fundamentals"),
  draftModule("grid-in-design", "design-track-curriculum", "Grid in Design"),
  draftModule("user-journey-mapping", "design-track-curriculum", "User journey Mapping"),
];

function slugId(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
}

function notFoundError(entity: string) {
  return new ApiError(404, `${entity} not found`, null);
}

// ---- Curriculum ----------------------------------------------------------

async function listCurricula() {
  return curricula;
}

async function getCurriculum(id: string) {
  const curriculum = curricula.find((c) => c.id === id);
  if (!curriculum) throw notFoundError("Curriculum");
  return curriculum;
}

export async function createCurriculum(input: CreateCurriculumInput) {
  const curriculum: Curriculum = {
    ...input,
    id: slugId(input.title),
    status: "Active",
    totalModules: 0,
    totalLessons: 0,
    totalAssignments: 0,
    studentCount: 0,
    instructor: PLACEHOLDER_INSTRUCTOR,
    liveClasses: [],
    publishStatus: "DRAFT",
    progressMode: "SEQUENTIAL",
    history: [],
    notes: [],
  };
  curricula = [curriculum, ...curricula];
  return curriculum;
}

/** Describes a settings change for the version history, e.g. "changed module access to Flexible". */
function describeChange(input: UpdateCurriculumInput) {
  if (input.progressMode) return `changed module access to ${PROGRESS_MODES[input.progressMode]}`;
  if (input.publishStatus)
    return `changed curriculum status to ${input.publishStatus === "PUBLISHED" ? "Published" : "Draft"}`;
  return "updated the curriculum details";
}

export async function updateCurriculum(id: string, input: UpdateCurriculumInput) {
  const existing = await getCurriculum(id);
  const updated: Curriculum = {
    ...existing,
    ...input,
    history: [
      {
        id: crypto.randomUUID(),
        actor: "Aishat Lawal",
        action: describeChange(input),
        at: new Date().toISOString(),
      },
      ...existing.history,
    ],
  };
  curricula = curricula.map((c) => (c.id === id ? updated : c));
  return updated;
}

// ---- Notes (stored on the curriculum) --------------------------------------

async function listNotes(curriculumId: string) {
  const { notes } = await getCurriculum(curriculumId);
  return [...notes].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

async function saveNotes(
  curriculumId: string,
  change: (notes: CurriculumNote[]) => CurriculumNote[]
) {
  const existing = await getCurriculum(curriculumId);
  curricula = curricula.map((c) =>
    c.id === curriculumId ? { ...existing, notes: change(existing.notes) } : c
  );
}

export async function createNote(curriculumId: string, input: SaveNoteInput) {
  const note: CurriculumNote = {
    ...input,
    id: crypto.randomUUID(),
    author: "Aishat Lawal",
    createdAt: new Date().toISOString(),
    pinned: false,
  };
  await saveNotes(curriculumId, (notes) => [note, ...notes]);
  return note;
}

export async function updateNote(
  curriculumId: string,
  noteId: string,
  changes: Partial<CurriculumNote>
) {
  await saveNotes(curriculumId, (notes) =>
    notes.map((n) => (n.id === noteId ? { ...n, ...changes } : n))
  );
}

export async function deleteNote(curriculumId: string, noteId: string) {
  await saveNotes(curriculumId, (notes) => notes.filter((n) => n.id !== noteId));
}

export async function deleteCurriculum(id: string) {
  curricula = curricula.filter((c) => c.id !== id);
  modules = modules.filter((m) => m.curriculumId !== id);
}

// ---- Modules -------------------------------------------------------------

async function listModules(curriculumId: string) {
  return modules.filter((m) => m.curriculumId === curriculumId);
}

async function getModule(id: string) {
  const found = modules.find((m) => m.id === id);
  if (!found) throw notFoundError("Module");
  return found;
}

export async function createModule(curriculumId: string, input: SaveModuleInput) {
  const created: CurriculumModule = {
    ...input,
    id: slugId(input.title),
    curriculumId,
    coverImage: null,
    liveClassRecordings: [],
  };
  modules = [...modules, created];
  return created;
}

export async function updateModule(id: string, input: Partial<SaveModuleInput>) {
  const existing = await getModule(id);
  const updated = { ...existing, ...input };
  modules = modules.map((m) => (m.id === id ? updated : m));
  return updated;
}

export async function deleteModule(id: string) {
  modules = modules.filter((m) => m.id !== id);
}

export async function reorderModules(curriculumId: string, orderedIds: string[]) {
  const others = modules.filter((m) => m.curriculumId !== curriculumId);
  const ordered = orderedIds
    .map((id) => modules.find((m) => m.id === id))
    .filter((m): m is CurriculumModule => m !== undefined);
  modules = [...others, ...ordered];
}

// ---- Assignments (stored on their module) ----------------------------------

async function listAssignments(curriculumId: string) {
  const curriculumModules = await listModules(curriculumId);
  return curriculumModules.flatMap((m, index) =>
    m.assignments.map(
      (assignment): CurriculumAssignment => ({
        assignment,
        module: m,
        modulePosition: index + 1,
      })
    )
  );
}

async function getAssignment(curriculumId: string, assignmentId: string) {
  const found = (await listAssignments(curriculumId)).find(
    (item) => item.assignment.id === assignmentId
  );
  if (!found) throw notFoundError("Assignment");
  return found;
}

function findAssignmentModule(assignmentId: string) {
  const owner = modules.find((m) =>
    m.assignments.some((a) => a.id === assignmentId)
  );
  if (!owner) throw notFoundError("Assignment");
  return owner;
}

export async function createAssignment(
  moduleId: string,
  input: CreateAssignmentInput
) {
  const owner = await getModule(moduleId);
  const created: ModuleAssignment = { ...emptyAssignment(), ...input };
  await updateModule(moduleId, {
    assignments: [...owner.assignments, created],
  });
  return created;
}

export async function updateAssignment(
  assignmentId: string,
  changes: Partial<ModuleAssignment>
) {
  const owner = findAssignmentModule(assignmentId);
  await updateModule(owner.id, {
    assignments: owner.assignments.map((a) =>
      a.id === assignmentId ? { ...a, ...changes } : a
    ),
  });
}

export async function deleteAssignment(assignmentId: string) {
  const owner = findAssignmentModule(assignmentId);
  await updateModule(owner.id, {
    assignments: owner.assignments.filter((a) => a.id !== assignmentId),
  });
}

// ---- Resources (stored on their module or lesson) --------------------------

async function listResources(curriculumId: string) {
  const curriculumModules = await listModules(curriculumId);
  return curriculumModules.flatMap((m, index) => {
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

async function getResource(curriculumId: string, resourceId: string) {
  const found = (await listResources(curriculumId)).find(
    (item) => item.resource.id === resourceId
  );
  if (!found) throw notFoundError("Resource");
  return found;
}

/** Applies `change` to whichever resource list (module or lesson) holds the resource. */
async function editResourceList(
  resourceId: string,
  change: (resources: ResourceFile[]) => ResourceFile[]
) {
  const owner = modules.find(
    (m) =>
      m.resources.some((r) => r.id === resourceId) ||
      m.lessons.some((l) => l.resources.some((r) => r.id === resourceId))
  );
  if (!owner) throw notFoundError("Resource");

  const holds = (resources: ResourceFile[]) =>
    resources.some((r) => r.id === resourceId);

  await updateModule(owner.id, {
    resources: holds(owner.resources) ? change(owner.resources) : owner.resources,
    lessons: owner.lessons.map((lesson) =>
      holds(lesson.resources)
        ? { ...lesson, resources: change(lesson.resources) }
        : lesson
    ),
  });
}

export async function createResource(
  moduleId: string,
  lessonId: string | null,
  input: CreateResourceInput
) {
  const owner = await getModule(moduleId);
  const created = newResourceFile(input);

  await updateModule(
    moduleId,
    lessonId
      ? {
          lessons: owner.lessons.map((lesson) =>
            lesson.id === lessonId
              ? { ...lesson, resources: [...lesson.resources, created] }
              : lesson
          ),
        }
      : { resources: [...owner.resources, created] }
  );
  return created;
}

export async function updateResource(
  resourceId: string,
  changes: Partial<ResourceFile>
) {
  await editResourceList(resourceId, (resources) =>
    resources.map((r) => (r.id === resourceId ? { ...r, ...changes } : r))
  );
}

export async function deleteResource(resourceId: string) {
  await editResourceList(resourceId, (resources) =>
    resources.filter((r) => r.id !== resourceId)
  );
}

// ---- Formatting ------------------------------------------------------------

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

// ---- Query keys + options ------------------------------------------------

export const curriculumKeys = {
  all: () => ["curriculum"] as const,
  list: () => ["curriculum", "list"] as const,
  detail: (id: string) => ["curriculum", "detail", id] as const,
  modules: (curriculumId: string) =>
    ["curriculum", "modules", curriculumId] as const,
  module: (id: string) => ["curriculum", "module", id] as const,
  notes: (curriculumId: string) => ["curriculum", "notes", curriculumId] as const,
  // Nested under `modules` so any module change also refreshes these.
  assignments: (curriculumId: string) =>
    ["curriculum", "modules", curriculumId, "assignments"] as const,
  assignment: (curriculumId: string, assignmentId: string) =>
    ["curriculum", "modules", curriculumId, "assignment", assignmentId] as const,
  resources: (curriculumId: string) =>
    ["curriculum", "modules", curriculumId, "resources"] as const,
  resource: (curriculumId: string, resourceId: string) =>
    ["curriculum", "modules", curriculumId, "resource", resourceId] as const,
};

export const curriculumQueries = {
  list: () =>
    queryOptions({
      queryKey: curriculumKeys.list(),
      queryFn: listCurricula,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: curriculumKeys.detail(id),
      queryFn: () => getCurriculum(id),
    }),

  modules: (curriculumId: string) =>
    queryOptions({
      queryKey: curriculumKeys.modules(curriculumId),
      queryFn: () => listModules(curriculumId),
    }),

  module: (id: string) =>
    queryOptions({
      queryKey: curriculumKeys.module(id),
      queryFn: () => getModule(id),
    }),

  assignments: (curriculumId: string) =>
    queryOptions({
      queryKey: curriculumKeys.assignments(curriculumId),
      queryFn: () => listAssignments(curriculumId),
    }),

  assignment: (curriculumId: string, assignmentId: string) =>
    queryOptions({
      queryKey: curriculumKeys.assignment(curriculumId, assignmentId),
      queryFn: () => getAssignment(curriculumId, assignmentId),
    }),

  notes: (curriculumId: string) =>
    queryOptions({
      queryKey: curriculumKeys.notes(curriculumId),
      queryFn: () => listNotes(curriculumId),
    }),

  resources: (curriculumId: string) =>
    queryOptions({
      queryKey: curriculumKeys.resources(curriculumId),
      queryFn: () => listResources(curriculumId),
    }),

  resource: (curriculumId: string, resourceId: string) =>
    queryOptions({
      queryKey: curriculumKeys.resource(curriculumId, resourceId),
      queryFn: () => getResource(curriculumId, resourceId),
    }),
};

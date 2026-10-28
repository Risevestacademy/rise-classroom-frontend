import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { AdminUser, Track } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import {
  attachmentLinks,
  byPosition,
  describeChange,
  emptyAssignment,
  newResourceFile,
  toAssignments,
  toCurriculum,
  toIsoDate,
  toModule,
  toNote,
  toResourceFile,
  toResources,
} from "@/lib/curriculum.mappers";
import {
  noCurriculumFilters,
  type AssignmentRecord,
  type CreateAssignmentInput,
  type CreateCurriculumInput,
  type CreateResourceInput,
  type CurriculumFilters,
  type CurriculumModule,
  type CurriculumNote,
  type CurriculumRecord,
  type LessonRecord,
  type LessonTree,
  type ModuleAssignment,
  type ModuleLesson,
  type NoteRecord,
  type RecordingRecord,
  type ResourceFile,
  type ResourceRecord,
  type SaveModuleInput,
  type SaveNoteInput,
  type SessionExtras,
  type TopicRecord,
  type TopicTree,
  type UpdateCurriculumInput,
} from "@/lib/curriculum.types";

// Requests, the session store and React Query options for the curriculum
// screens. Anything the design shows that the API doesn't store yet lives in
// the in-memory `local` store below: it works for the session but resets on a
// full page reload. Search for "local." to find every such field.

// ---- Session-only store for fields the API doesn't have ------------------------

const local: SessionExtras = {
  history: new Map(),
  moduleFiles: new Map(),
  lessons: new Map(),
  assignments: new Map(),
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

/** Leaves optional text out of create payloads when it's blank. */
function optionalText(key: string, value: string) {
  return value ? { [key]: value } : {};
}

function assertHttpsLink(url: string, label: string) {
  if (!/^https:\/\/\S+$/.test(url)) {
    throw new Error(`${label} must be a full link starting with https://`);
  }
}

async function currentUserName() {
  const session = await getSession().catch(() => null);
  return session?.user.name ?? "Admin";
}

// ---- Loading -------------------------------------------------------------------

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

/** Fetches the track (unless known) and student count a curriculum card shows. */
async function loadCurriculum(record: CurriculumRecord, knownTrack?: Track) {
  const [track, students] = await Promise.all([
    knownTrack ?? getData<Track>(`/admin/tracks/${record.trackId}`),
    getData<Paginated<AdminUser>>("/admin/users", {
      role: "STUDENT",
      trackId: record.trackId,
      ...(record.cohortId && { cohortId: record.cohortId }),
      limit: 1,
    }),
  ]);
  return toCurriculum(record, track, students.total, local.history.get(record.id) ?? []);
}

// ---- Curriculum ----------------------------------------------------------------

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
      loadCurriculum(record, tracks.find((track) => track.id === record.trackId))
    )
  );
}

async function getCurriculum(id: string) {
  return loadCurriculum(await getData<CurriculumRecord>(`/admin/curriculums/${id}`));
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
  return (await loadTree(curriculumId)).map((topic) => toModule(topic, local));
}

async function getTopicTree(id: string) {
  return loadTopic(await getData<TopicRecord>(`/admin/topics/${id}`));
}

async function getModule(id: string) {
  return toModule(await getTopicTree(id), local);
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

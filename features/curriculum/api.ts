import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { AdminUser, Track } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import type { InstructorStudent, InstructorTrack } from "@/lib/instructor";
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
  toSubmission,
} from "@/features/curriculum/mappers";
import {
  noCurriculumFilters,
  type AssignmentRecord,
  type AssignmentSubmissionRecord,
  type SubmissionDetail,
  type SubmissionReview,
  type CreateAssignmentInput,
  type CreateCurriculumInput,
  type CreateResourceInput,
  type CurriculumFilters,
  type CurriculumModule,
  type CurriculumNote,
  type CurriculumRecord,
  type CurriculumRole,
  type LessonRecord,
  type LessonTree,
  type ModuleAccess,
  type ModuleAccessRecord,
  type ModuleAssignment,
  type ModuleLesson,
  type NoteRecord,
  type RecordingRecord,
  type ResourceFile,
  type ResourceKind,
  type ResourceRecord,
  type SaveModuleInput,
  type SaveNoteInput,
  type SessionExtras,
  type TopicRecord,
  type TopicTree,
  type UpdateCurriculumInput,
} from "@/features/curriculum/types";

// Requests, the session store and React Query options for the curriculum
// screens. The backend serves the same curriculum endpoints under `/admin` and
// `/instructor`, so one implementation covers both roles: `curriculumApis.admin`
// and `curriculumApis.instructor` differ only in the path prefix, the few
// lookups that have no shared endpoint (tracks, student counts), and their
// query keys, which never mix.
//
// Anything the design shows that the API doesn't store yet lives in the
// in-memory `local` store below: it works for the session but resets on a full
// page reload. Search for "local." to find every such field.

// ---- Session-only store for fields the API doesn't have ------------------------

const local: SessionExtras = {
  history: new Map(),
  moduleFiles: new Map(),
  lessons: new Map(),
  assignments: new Map(),
};

// ---- Helpers -----------------------------------------------------------------

async function getData<T>(
  path: string,
  query?: Record<string, string | number>,
) {
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

/* The API's name for each resource type. */
const apiResourceTypes: Record<ResourceKind, string> = {
  PDF: "PDF",
  Video: "VIDEO",
  Document: "DOCUMENT",
  Image: "IMAGE",
  Link: "LINK",
};

/* Runs the tasks a few at a time, so a large class doesn't flood the API proxy with requests. */
async function runInBatches(tasks: (() => Promise<unknown>)[], size = 6) {
  for (let start = 0; start < tasks.length; start += size) {
    await Promise.all(tasks.slice(start, start + size).map((task) => task()));
  }
}

function assertHttpsLink(url: string, label: string) {
  if (!/^https:\/\/\S+$/.test(url)) {
    throw new Error(`${label} must be a full link starting with https://`);
  }
}

// ---- Lookups with no shared endpoint ---------------------------------------------

/** Tracks the signed-in user can see: every track for admins, their own for instructors. */
async function listTracks(role: CurriculumRole) {
  if (role === "admin") return getData<Track[]>("/admin/tracks");
  // An instructor is assigned per track and cohort, so a track can repeat.
  const assignments = await getData<InstructorTrack[]>("/instructor/tracks");
  return [...new Map(assignments.map((a) => [a.track.id, a.track])).values()];
}

async function getTrack(role: CurriculumRole, trackId: string) {
  if (role === "admin") return getData<Track>(`/admin/tracks/${trackId}`);
  const track = (await listTracks(role)).find((t) => t.id === trackId);
  if (!track) throw new Error("This track isn't assigned to you.");
  return track;
}

async function countStudents(role: CurriculumRole, record: CurriculumRecord) {
  const scope = {
    trackId: record.trackId,
    ...(record.cohortId && { cohortId: record.cohortId }),
  };
  if (role === "instructor") {
    return (await getData<InstructorStudent[]>("/instructor/students", scope))
      .length;
  }
  const students = await getData<Paginated<AdminUser>>("/admin/users", {
    role: "STUDENT",
    ...scope,
    limit: 1,
  });
  return students.total;
}

// ---- The API for one role --------------------------------------------------------

function createCurriculumApi(role: CurriculumRole) {
  const base = `/${role}`;

  async function currentUserName() {
    const session = await getSession().catch(() => null);
    return session?.user.name ?? (role === "admin" ? "Admin" : "Instructor");
  }

  // ---- Loading -----------------------------------------------------------------

  async function loadLesson(lesson: LessonRecord): Promise<LessonTree> {
    const [resources, assignments, recordings] = await Promise.all([
      getData<ResourceRecord[]>(`${base}/lessons/${lesson.id}/resources`),
      getData<AssignmentRecord[]>(`${base}/lessons/${lesson.id}/assignments`),
      getData<RecordingRecord[]>(`${base}/lessons/${lesson.id}/recordings`),
    ]);
    return { ...lesson, resources, assignments, recordings };
  }

  async function loadTopic(topic: TopicRecord): Promise<TopicTree> {
    const [lessons, resources, assignments] = await Promise.all([
      getData<LessonRecord[]>(`${base}/topics/${topic.id}/lessons`),
      getData<ResourceRecord[]>(`${base}/topics/${topic.id}/resources`),
      getData<AssignmentRecord[]>(`${base}/topics/${topic.id}/assignments`),
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
      await getData<TopicRecord[]>(
        `${base}/curriculums/${curriculumId}/topics`,
      ),
    );
  }

  /** One request per topic and three per lesson — the API has no nested read. */
  async function loadTree(curriculumId: string) {
    return Promise.all((await listTopics(curriculumId)).map(loadTopic));
  }

  /** Fetches the track (unless known) and student count a curriculum card shows. */
  async function loadCurriculum(record: CurriculumRecord, knownTrack?: Track) {
    const [track, studentCount] = await Promise.all([
      knownTrack ?? getTrack(role, record.trackId),
      countStudents(role, record),
    ]);
    return toCurriculum(
      record,
      track,
      studentCount,
      local.history.get(record.id) ?? [],
    );
  }

  // ---- Curriculum --------------------------------------------------------------

  async function listCurricula(filters: CurriculumFilters, cohortId?: string) {
    const { statuses, trackIds } = filters;
    const [tracks, records] = await Promise.all([
      listTracks(role),
      // The API takes a single track and status, so wider picks are filtered here.
      getData<CurriculumRecord[]>(`${base}/curriculums`, {
        ...(cohortId && { cohortId }),
        ...(trackIds.length === 1 && { trackId: trackIds[0] }),
        ...(statuses.length === 1 && { publishStatus: statuses[0] }),
      }),
    ]);
    const matches = records.filter(
      (record) =>
        (trackIds.length === 0 || trackIds.includes(record.trackId)) &&
        (statuses.length === 0 || statuses.includes(record.publishStatus)),
    );
    return Promise.all(
      matches.map((record) =>
        loadCurriculum(
          record,
          tracks.find((track) => track.id === record.trackId),
        ),
      ),
    );
  }

  async function getCurriculum(id: string) {
    return loadCurriculum(
      await getData<CurriculumRecord>(`${base}/curriculums/${id}`),
    );
  }

  async function createCurriculum(input: CreateCurriculumInput) {
    return postData<CurriculumRecord>(
      `${base}/tracks/${input.trackId}/curriculums`,
      {
        title: input.title,
        ...optionalText("description", input.description),
        ...optionalText("cohortId", input.cohortId),
        status: "ONGOING",
        publishStatus: "DRAFT",
      },
    );
  }

  async function updateCurriculum(id: string, input: UpdateCurriculumInput) {
    const { title, description, publishStatus, progressMode } = input;
    await api.patch(`${base}/curriculums/${id}`, {
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

  async function deleteCurriculum(id: string) {
    await api.delete(`${base}/curriculums/${id}`);
    local.history.delete(id);
  }

  // ---- Notes -------------------------------------------------------------------

  async function listNotes(curriculumId: string) {
    const records = await getData<NoteRecord[]>(
      `${base}/curriculums/${curriculumId}/notes`,
    );
    return records
      .map(toNote)
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }

  async function createNote(curriculumId: string, input: SaveNoteInput) {
    const record = await postData<NoteRecord>(
      `${base}/curriculums/${curriculumId}/notes`,
      {
        title: input.title,
        body: input.body,
        ...(input.moduleId && { topicId: input.moduleId }),
      },
    );
    return toNote(record);
  }

  async function updateNote(
    curriculumId: string,
    noteId: string,
    changes: Partial<CurriculumNote>,
  ) {
    const path = `${base}/curriculums/${curriculumId}/notes/${noteId}`;
    const { title, body, moduleId, pinned } = changes;
    if (title !== undefined || body !== undefined || moduleId !== undefined) {
      await api.patch(path, { title, body, topicId: moduleId });
    }
    if (pinned !== undefined)
      await api.patch(`${path}/pin`, { isPinned: pinned });
  }

  async function deleteNote(curriculumId: string, noteId: string) {
    await api.delete(`${base}/curriculums/${curriculumId}/notes/${noteId}`);
  }

  // ---- Modules -----------------------------------------------------------------

  async function listModules(curriculumId: string) {
    return (await loadTree(curriculumId)).map((topic) =>
      toModule(topic, local),
    );
  }

  async function getTopicTree(id: string) {
    return loadTopic(await getData<TopicRecord>(`${base}/topics/${id}`));
  }

  async function getModule(id: string) {
    return toModule(await getTopicTree(id), local);
  }

  /** Throws before anything is saved if the content can't be attached anywhere. */
  function assertModuleContent(
    lessonCount: number,
    input: Partial<SaveModuleInput>,
  ) {
    if (input.recordingLink && lessonCount === 0) {
      throw new Error(
        "Add at least one lesson. The class recording is saved on this module's lessons.",
      );
    }
    if (input.recordingLink)
      assertHttpsLink(input.recordingLink, "The class recording link");
  }

  async function createModule(curriculumId: string, input: SaveModuleInput) {
    assertModuleContent(input.lessons.length, input);
    const topics = await listTopics(curriculumId);
    const topic = await postData<TopicRecord>(
      `${base}/curriculums/${curriculumId}/topics`,
      {
        title: input.title,
        description: input.description,
        position: topics.reduce((next, t) => Math.max(next, t.position + 1), 0),
        publishStatus: input.status,
        outcomes: input.outcomes,
      },
    );
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
  async function updateModule(id: string, input: Partial<SaveModuleInput>) {
    const tree = await getTopicTree(id);
    assertModuleContent(input.lessons?.length ?? tree.lessons.length, input);

    const { title, description, status, outcomes } = input;
    if (
      [title, description, status, outcomes].some(
        (value) => value !== undefined,
      )
    ) {
      await api.patch(`${base}/topics/${id}`, {
        title,
        description,
        publishStatus: status,
        outcomes,
      });
    }

    if (input.resources) {
      await deleteRemovedResources(tree.resources, input.resources);
      await createNewLinks(
        `${base}/topics/${id}/resources`,
        tree.resources,
        input.resources,
      );
      local.moduleFiles.set(
        id,
        input.resources.filter((r) => !r.url),
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
  async function deleteRemovedResources(
    saved: ResourceRecord[],
    kept: ResourceFile[],
  ) {
    const keptIds = new Set(kept.map((r) => r.id));
    await Promise.all(
      saved
        .filter((r) => !keptIds.has(r.id))
        .map((r) => api.delete(`${base}/resources/${r.id}`)),
    );
  }

  /* Saves links added in the form that the API doesn't have yet. */
  async function createNewLinks(
    path: string,
    saved: ResourceRecord[],
    resources: ResourceFile[],
  ) {
    const savedIds = new Set(saved.map((r) => r.id));
    for (const resource of resources) {
      if (!resource.url || savedIds.has(resource.id)) continue;
      assertHttpsLink(resource.url, "Each resource link");
      await postData(path, {
        title: resource.title || resource.name,
        url: resource.url,
        type: "LINK",
        publishStatus: "PUBLISHED",
      });
    }
  }

  async function syncLessons(
    topicId: string,
    existing: LessonTree[],
    drafts: ModuleLesson[],
  ): Promise<LessonTree[]> {
    const draftIds = new Set(drafts.map((d) => d.id));
    await Promise.all(
      existing
        .filter((l) => !draftIds.has(l.id))
        .map((l) => api.delete(`${base}/lessons/${l.id}`)),
    );

    const saved: LessonTree[] = [];
    for (const [position, draft] of drafts.entries()) {
      let lesson = existing.find((l) => l.id === draft.id);
      if (!lesson) {
        const created = await postData<LessonRecord>(
          `${base}/topics/${topicId}/lessons`,
          {
            title: draft.title,
            ...optionalText("description", draft.description),
            position,
          },
        );
        lesson = { ...created, resources: [], assignments: [], recordings: [] };
      } else {
        const changed =
          lesson.title !== draft.title ||
          (lesson.description ?? "") !== draft.description ||
          lesson.position !== position;
        if (changed) {
          await api.patch(`${base}/lessons/${lesson.id}`, {
            title: draft.title,
            description: draft.description || null,
            position,
          });
        }
        await deleteRemovedResources(lesson.resources, draft.resources);
      }
      await createNewLinks(
        `${base}/lessons/${lesson.id}/resources`,
        lesson.resources,
        draft.resources,
      );

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
      await api.delete(`${base}/recordings/${recording.id}`);
    } else if (recording && recording.url !== link) {
      await api.patch(`${base}/recordings/${recording.id}`, { url: link });
    } else if (!recording && link) {
      // The API only has lesson recordings, so the module's goes on lesson 1.
      await postData(`${base}/lessons/${lessons[0].id}/recordings`, {
        title: "Class recording",
        url: link,
      });
    }
  }

  async function syncAssignments(
    topicId: string,
    lessons: LessonTree[],
    moduleAssignments: AssignmentRecord[],
    drafts: ModuleAssignment[],
  ) {
    const existing = [
      ...lessons.flatMap((l) => l.assignments),
      ...moduleAssignments,
    ];
    const draftIds = new Set(drafts.map((d) => d.id));
    await Promise.all(
      existing
        .filter((a) => !draftIds.has(a.id))
        .map((a) => deleteAssignment(a.id)),
    );

    for (const draft of drafts) {
      if (existing.some((a) => a.id === draft.id)) {
        await updateAssignment(draft.id, draft);
      } else {
        const lesson = draft.afterLesson
          ? lessons[draft.afterLesson - 1]
          : undefined;
        await postAssignment(topicId, lesson?.id, draft);
      }
    }
  }

  async function deleteModule(id: string) {
    await api.delete(`${base}/topics/${id}`);
    local.moduleFiles.delete(id);
  }

  /** Saves a new module order as each topic's `position`. */
  async function reorderModules(curriculumId: string, orderedIds: string[]) {
    const topics = await listTopics(curriculumId);
    const moved = orderedIds
      .map((id, index) => ({ topic: topics.find((t) => t.id === id), index }))
      .filter(
        (item): item is { topic: TopicRecord; index: number } =>
          item.topic !== undefined && item.topic.position !== item.index,
      );

    // Park moved topics past the end first so no two ever share a position.
    const parking = topics.reduce((max, t) => Math.max(max, t.position), 0) + 1;
    for (const { topic, index } of moved) {
      await api.patch(`${base}/topics/${topic.id}`, {
        position: parking + index,
      });
    }
    for (const { topic, index } of moved) {
      await api.patch(`${base}/topics/${topic.id}`, { position: index });
    }
  }

  // ---- Assignments -------------------------------------------------------------

  /** Saves the fields the API doesn't have. */
  function saveAssignmentExtras(
    id: string,
    changes: Partial<ModuleAssignment>,
  ) {
    const { type, mode, resources } = changes;
    local.assignments.set(id, {
      ...local.assignments.get(id),
      ...(type && { type }),
      ...(mode && { mode }),
      ...(resources && { files: resources.filter((r) => !r.url) }),
    });
  }

  /** Creates an assignment on a lesson, or on the whole module without one. */
  async function postAssignment(
    topicId: string,
    lessonId: string | undefined,
    assignment: ModuleAssignment,
  ) {
    const record = await postData<AssignmentRecord>(
      `${base}/topics/${topicId}/assignments`,
      {
        title: assignment.title,
        ...optionalText("description", assignment.description),
        ...optionalText("instructions", assignment.instructions),
        ...(assignment.dueAt && { dueAt: toIsoDate(assignment.dueAt) }),
        submissionType: assignment.submissionType,
        publishStatus: assignment.status,
        attachments: attachmentLinks(assignment.resources),
        ...(lessonId && { lessonId }),
      },
    );
    saveAssignmentExtras(record.id, assignment);
    return record;
  }

  async function createAssignment(
    moduleId: string,
    input: CreateAssignmentInput,
  ) {
    const lessons = byPosition(
      await getData<LessonRecord[]>(`${base}/topics/${moduleId}/lessons`),
    );
    // "Due relative to lesson" picks the lesson; otherwise it's on the whole module.
    const lesson = input.afterLesson
      ? lessons[input.afterLesson - 1]
      : undefined;
    const draft: ModuleAssignment = {
      ...emptyAssignment(),
      ...input,
      afterLesson: lesson ? input.afterLesson : null,
    };
    const record = await postAssignment(moduleId, lesson?.id, draft);
    return { ...draft, id: record.id };
  }

  /* `lessonId` moves the assignment to another lesson in its module, or off any lesson with null. */
  async function updateAssignment(
    assignmentId: string,
    changes: Partial<ModuleAssignment> & { lessonId?: string | null },
  ) {
    const {
      title,
      description,
      instructions,
      submissionType,
      dueAt,
      status,
      resources,
      lessonId,
    } = changes;
    await api.patch(`${base}/assignments/${assignmentId}`, {
      title,
      description,
      instructions,
      submissionType,
      ...(dueAt !== undefined && { dueAt: toIsoDate(dueAt) }),
      ...(lessonId !== undefined && { lessonId }),
      publishStatus: status,
      ...(resources && { attachments: attachmentLinks(resources) }),
    });
    saveAssignmentExtras(assignmentId, changes);
  }

  async function deleteAssignment(assignmentId: string) {
    await api.delete(`${base}/assignments/${assignmentId}`);
    local.assignments.delete(assignmentId);
  }

  // ---- Resources ---------------------------------------------------------------

  /**
   * Links are saved to the API. PENDING-BACKEND: it has no upload endpoint, so a
   * picked file can't be saved there and is kept for the session only.
   */
  async function createResource(
    moduleId: string,
    lessonId: string | null,
    input: CreateResourceInput,
  ) {
    if (input.url) {
      assertHttpsLink(input.url, "The link");
      const record = await postData<ResourceRecord>(
        lessonId
          ? `${base}/lessons/${lessonId}/resources`
          : `${base}/topics/${moduleId}/resources`,
        {
          title: input.title,
          ...optionalText("description", input.description),
          url: input.url,
          type: apiResourceTypes[input.kind ?? "Link"],
          publishStatus: "PUBLISHED",
        },
      );
      return toResourceFile(record);
    }

    const created = newResourceFile(input);
    if (lessonId) {
      const extras = local.lessons.get(lessonId) ?? {};
      local.lessons.set(lessonId, {
        ...extras,
        files: [...(extras.files ?? []), created],
      });
    } else {
      local.moduleFiles.set(moduleId, [
        ...(local.moduleFiles.get(moduleId) ?? []),
        created,
      ]);
    }
    return created;
  }

  async function updateResource(
    resourceId: string,
    changes: Partial<ResourceFile>,
  ) {
    const isLocal = editLocalResources(resourceId, (resources) =>
      resources.map((r) => (r.id === resourceId ? { ...r, ...changes } : r)),
    );
    if (isLocal) return;

    const { title, description, status } = changes;
    await api.patch(`${base}/resources/${resourceId}`, {
      title,
      description,
      publishStatus: status,
    });
  }

  async function deleteResource(resourceId: string) {
    const isLocal = editLocalResources(resourceId, (resources) =>
      resources.filter((r) => r.id !== resourceId),
    );
    if (!isLocal) await api.delete(`${base}/resources/${resourceId}`);
  }

  // ---- Submissions -------------------------------------------------------------

  /* Students' submissions for one assignment. The API only has this for instructors. */
  async function listSubmissions(assignmentId: string) {
    const page = await getData<Paginated<AssignmentSubmissionRecord>>(
      `${base}/assignments/${assignmentId}/submissions`,
      { limit: 100 },
    );
    return page.items.map(toSubmission);
  }

  /* One submission with the student's work. The API only has this for instructors. */
  function getSubmission(submissionId: string) {
    return getData<SubmissionDetail>(`${base}/submissions/${submissionId}`);
  }

  /* Starts a review, returns the work for changes, or grades it (0-100). Grading also
     updates the student's performance score when a standard is set for the assignment. */
  function reviewSubmission(submissionId: string, review: SubmissionReview) {
    return postData<SubmissionDetail>(
      `${base}/submissions/${submissionId}/review`,
      review,
    );
  }

  // ---- Student access ----------------------------------------------------------

  /*
   * Unlocks or locks a module for every student on its track. The API only has this for instructors.
   * A student can open a lesson only once the module and that lesson are both unlocked for them,
   * and lessons can only be unlocked one student at a time. The module reply lists every student's
   * enrollment, so unlocking goes on to open each lesson for each of them. Locking the module alone
   * is enough to close its lessons.
   */
  async function setModuleAccess(
    moduleId: string,
    unlocked: boolean,
  ): Promise<ModuleAccess> {
    const record = await postData<ModuleAccessRecord>(
      `${base}/topics/${moduleId}/unlock-all`,
      { unlocked },
    );
    if (unlocked) {
      const lessons = await getData<LessonRecord[]>(
        `${base}/topics/${moduleId}/lessons`,
      );
      await runInBatches(
        record.statuses.flatMap((status) =>
          lessons.map(
            (lesson) => () =>
              api.patch(
                `${base}/enrollments/${status.enrollmentId}/lessons/${lesson.id}/unlock`,
                { unlocked: true },
              ),
          ),
        ),
      );
    }
    return {
      unlocked,
      studentCount: record.enrollmentCount,
      openCount: record.statuses.filter((status) => status.unlocked).length,
    };
  }

  // ---- Query keys + options ----------------------------------------------------

  // Every key starts with the role, so admin and instructor caches never mix.
  const keys = {
    all: () => ["curriculum", role] as const,
    list: () => ["curriculum", role, "list"] as const,
    /** Sits under `list()`, so invalidating that refreshes every filtered list. */
    listBy: ({ statuses, trackIds }: CurriculumFilters, cohortId?: string) =>
      [
        "curriculum",
        role,
        "list",
        {
          statuses: [...statuses].sort(),
          trackIds: [...trackIds].sort(),
          cohortId,
        },
      ] as const,
    detail: (id: string) => ["curriculum", role, "detail", id] as const,
    // Assignments and resources are read from this same tree, so invalidating
    // it refreshes every tab.
    modules: (curriculumId: string) =>
      ["curriculum", role, "modules", curriculumId] as const,
    module: (id: string) => ["curriculum", role, "module", id] as const,
    notes: (curriculumId: string) =>
      ["curriculum", role, "notes", curriculumId] as const,
    submissions: (assignmentId: string) =>
      ["curriculum", role, "submissions", assignmentId] as const,
    submission: (submissionId: string) =>
      ["curriculum", role, "submission", submissionId] as const,
    /* Filled from the last unlock or lock, since the API can't be asked for it. */
    moduleAccess: (moduleId: string) =>
      ["curriculum", role, "module-access", moduleId] as const,
  };

  const modulesQuery = (curriculumId: string) => ({
    queryKey: keys.modules(curriculumId),
    queryFn: () => listModules(curriculumId),
  });

  const queries = {
    list: (
      filters: CurriculumFilters = noCurriculumFilters,
      cohortId?: string,
    ) =>
      queryOptions({
        queryKey: keys.listBy(filters, cohortId),
        queryFn: () => listCurricula(filters, cohortId),
      }),

    detail: (id: string) =>
      queryOptions({
        queryKey: keys.detail(id),
        queryFn: () => getCurriculum(id),
      }),

    modules: (curriculumId: string) => queryOptions(modulesQuery(curriculumId)),

    submissions: (assignmentId: string) =>
      queryOptions({
        queryKey: keys.submissions(assignmentId),
        queryFn: () => listSubmissions(assignmentId),
      }),

    submission: (submissionId: string) =>
      queryOptions({
        queryKey: keys.submission(submissionId),
        queryFn: () => getSubmission(submissionId),
      }),

    module: (id: string) =>
      queryOptions({
        queryKey: keys.module(id),
        queryFn: () => getModule(id),
      }),

    assignments: (curriculumId: string) =>
      queryOptions({ ...modulesQuery(curriculumId), select: toAssignments }),

    assignment: (curriculumId: string, assignmentId: string) =>
      queryOptions({
        ...modulesQuery(curriculumId),
        select: (modules: CurriculumModule[]) =>
          toAssignments(modules).find(
            (item) => item.assignment.id === assignmentId,
          ),
      }),

    notes: (curriculumId: string) =>
      queryOptions({
        queryKey: keys.notes(curriculumId),
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

  return {
    keys,
    queries,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    createNote,
    updateNote,
    deleteNote,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    createResource,
    updateResource,
    deleteResource,
    setModuleAccess,
    reviewSubmission,
  };
}

/** Applies `change` to the session-only list holding the resource, if any. */
function editLocalResources(
  resourceId: string,
  change: (resources: ResourceFile[]) => ResourceFile[],
) {
  const holds = (list?: ResourceFile[]) =>
    !!list?.some((r) => r.id === resourceId);

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

export type CurriculumApi = ReturnType<typeof createCurriculumApi>;

/** One instance per role, so query options and keys stay stable between renders. */
export const curriculumApis: Record<CurriculumRole, CurriculumApi> = {
  admin: createCurriculumApi("admin"),
  instructor: createCurriculumApi("instructor"),
};

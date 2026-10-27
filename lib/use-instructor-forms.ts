"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAssignment,
  createLesson,
  createRecording,
  createResource,
  createTopic,
  deleteAssignment,
  deleteLesson,
  deleteRecording,
  deleteResource,
  instructorQueries,
  updateAssignment,
  updateLesson,
  updateRecording,
  updateResource,
  updateTopic,
} from "@/lib/instructor";

import type {
  AssignmentPageValues,
  ModuleFormValues,
  ResourcePageValues,
} from "./instructor-schema";

const text = (value?: string | null) => (value ?? "").trim();

export function useModuleInitialValues(curriculumId: string, moduleId: string) {
  const topics = useQuery(instructorQueries.topics({ curriculumId }));
  const topic = topics.data?.find((t) => t.id === moduleId);

  const lessons = useQuery(instructorQueries.lessons({ topicId: moduleId }));
  const lessonsData = [...(lessons.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  const resourceQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.resources({ lessonId: lesson.id })
    ),
  });
  const assignmentQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.assignments({ lessonId: lesson.id })
    ),
  });
  const recordingQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.recordings({ lessonId: lesson.id })
    ),
  });

  const isReady =
    Boolean(topic) &&
    lessons.isSuccess &&
    resourceQueries.every((q) => q.isSuccess) &&
    assignmentQueries.every((q) => q.isSuccess) &&
    recordingQueries.every((q) => q.isSuccess);

  if (!isReady || !topic) {
    return { initialValues: undefined, isReady: false };
  }

  let recording: { id: string; url: string; lessonId: string } | undefined;
  for (const [i, lesson] of lessonsData.entries()) {
    const first = recordingQueries[i]?.data?.[0];
    if (first) {
      recording = { id: first.id, url: first.url, lessonId: lesson.id };
      break;
    }
  }

  const initialValues: ModuleFormValues = {
    title: topic.title,
    description: topic.description ?? "",
    objectives: [{ value: "" }],
    recordingId: recording?.id,
    recordingLessonId: recording?.lessonId,
    recordingUrl: recording?.url ?? "",
    lessons: lessonsData.map((lesson, i) => ({
      serverId: lesson.id,
      key: lesson.id,
      title: lesson.title,
      description: lesson.description ?? "",
      resources: (resourceQueries[i]?.data ?? []).map((resource) => ({
        serverId: resource.id,
        title: resource.title,
        url: resource.url,
      })),
    })),
    assignments: lessonsData.flatMap((lesson, i) =>
      (assignmentQueries[i]?.data ?? []).map((assignment) => ({
        serverId: assignment.id,
        title: assignment.title,
        description: assignment.description ?? "",
        lessonKey: lesson.id,
      }))
    ),
  };

  return { initialValues, isReady: true };
}

type SaveArgs = {
  mode: "create" | "edit";
  curriculumId: string;
  moduleId?: string;
  values: ModuleFormValues;
  baseline?: ModuleFormValues;
  nextPosition: number;
};

async function saveModule({
  mode,
  curriculumId,
  moduleId,
  values,
  baseline,
  nextPosition,
}: SaveArgs): Promise<string> {
  const title = text(values.title);
  const description = text(values.description);

  let topicId = moduleId ?? "";
  if (mode === "create") {
    const created = await createTopic(curriculumId, {
      title,
      description,
      position: nextPosition,
    });
    topicId = created.id;
  } else if (
    !baseline ||
    baseline.title !== title ||
    text(baseline.description) !== description
  ) {
    await updateTopic(topicId, { title, description });
  }

  const baseLessons = baseline?.lessons ?? [];
  const baseAssignments = baseline?.assignments ?? [];

  const keptLessonIds = new Set(
    values.lessons.map((l) => l.serverId).filter(Boolean) as string[]
  );
  const keptAssignmentIds = new Set(
    values.assignments.map((a) => a.serverId).filter(Boolean) as string[]
  );
  const keptResourceIds = new Set(
    values.lessons
      .flatMap((l) => l.resources.map((r) => r.serverId))
      .filter(Boolean) as string[]
  );

  const recordingUrl = text(values.recordingUrl);
  const recordingLessonRemoved = Boolean(
    baseline?.recordingLessonId &&
    !keptLessonIds.has(baseline.recordingLessonId)
  );

  if (baseline?.recordingId && (!recordingUrl || recordingLessonRemoved)) {
    await deleteRecording(baseline.recordingId);
  }
  for (const old of baseAssignments) {
    if (old.serverId && !keptAssignmentIds.has(old.serverId)) {
      await deleteAssignment(old.serverId);
    }
  }
  for (const lesson of baseLessons) {
    for (const resource of lesson.resources) {
      if (resource.serverId && !keptResourceIds.has(resource.serverId)) {
        await deleteResource(resource.serverId);
      }
    }
  }
  for (const lesson of baseLessons) {
    if (lesson.serverId && !keptLessonIds.has(lesson.serverId)) {
      await deleteLesson(lesson.serverId);
    }
  }

  const lessonIdByKey = new Map<string, string>();

  for (const [index, lesson] of values.lessons.entries()) {
    const lessonTitle = text(lesson.title);
    const lessonDescription = text(lesson.description);
    const old = lesson.serverId
      ? baseLessons.find((l) => l.serverId === lesson.serverId)
      : undefined;

    let lessonId: string;
    if (lesson.serverId) {
      lessonId = lesson.serverId;
      const changed =
        !old ||
        old.title !== lessonTitle ||
        text(old.description) !== lessonDescription ||
        baseLessons.indexOf(old) !== index;

      if (changed) {
        await updateLesson(lessonId, {
          title: lessonTitle,
          description: lessonDescription || null,
          position: index,
        });
      }
    } else {
      const created = await createLesson(topicId, {
        title: lessonTitle,
        description: lessonDescription || undefined,
        position: index,
      });
      lessonId = created.id;
    }
    lessonIdByKey.set(lesson.key, lessonId);

    const oldResources = old?.resources ?? [];
    for (const resource of lesson.resources) {
      const resourceTitle = text(resource.title);
      const resourceUrl = text(resource.url);

      if (resource.serverId) {
        const oldResource = oldResources.find(
          (r) => r.serverId === resource.serverId
        );
        if (
          !oldResource ||
          oldResource.title !== resourceTitle ||
          oldResource.url !== resourceUrl
        ) {
          await updateResource(resource.serverId, {
            title: resourceTitle,
            url: resourceUrl,
          });
        }
      } else {
        await createResource(lessonId, {
          title: resourceTitle,
          url: resourceUrl,
        });
      }
    }
  }

  for (const assignment of values.assignments) {
    const assignmentTitle = text(assignment.title);
    const assignmentDescription = text(assignment.description);

    if (assignment.serverId) {
      const old = baseAssignments.find(
        (a) => a.serverId === assignment.serverId
      );
      if (
        !old ||
        old.title !== assignmentTitle ||
        text(old.description) !== assignmentDescription
      ) {
        await updateAssignment(assignment.serverId, {
          title: assignmentTitle,
          description: assignmentDescription || null,
        });
      }
    } else {
      const lessonId = lessonIdByKey.get(assignment.lessonKey);
      if (lessonId) {
        await createAssignment(lessonId, {
          title: assignmentTitle,
          description: assignmentDescription || undefined,
        });
      }
    }
  }

  if (recordingUrl) {
    if (baseline?.recordingId && !recordingLessonRemoved) {
      if (recordingUrl !== baseline.recordingUrl) {
        await updateRecording(baseline.recordingId, { url: recordingUrl });
      }
    } else {
      const firstLessonId = lessonIdByKey.get(values.lessons[0].key);
      if (firstLessonId) {
        await createRecording(firstLessonId, {
          title: "Class recording",
          url: recordingUrl,
        });
      }
    }
  }

  return topicId;
}

export function useSaveModule(args: {
  mode: "create" | "edit";
  curriculumId: string;
  moduleId?: string;
  baseline?: ModuleFormValues;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      let nextPosition = 0;
      if (args.mode === "create") {
        const existing = await queryClient.fetchQuery(
          instructorQueries.topics({ curriculumId: args.curriculumId })
        );
        nextPosition =
          Math.max(-1, ...existing.map((topic) => topic.position)) + 1;
      }
      return saveModule({ ...args, values, nextPosition });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructor"] }),
  });
}

const refreshInstructorData = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ["instructor"] });

export function useSaveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: AssignmentPageValues) => {
      const title = text(values.title);
      const description = text(values.description);

      return createAssignment(values.lessonId, {
        title,
        description: description || undefined,
      });
    },
    onSuccess: () => refreshInstructorData(queryClient),
  });
}

export function useSaveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ResourcePageValues) => {
      const title = text(values.title);
      const url = text(values.url);
      const description = text(values.description);

      return createResource(values.lessonId, {
        title,
        url,
        description: description || undefined,
      });
    },
    onSuccess: () => refreshInstructorData(queryClient),
  });
}

const deleters = {
  lesson: deleteLesson,
  resource: deleteResource,
  assignment: deleteAssignment,
  recording: deleteRecording,
} as const;

export function useDeleteItem(kind: keyof typeof deleters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleters[kind](id),
    onSuccess: () => refreshInstructorData(queryClient),
  });
}
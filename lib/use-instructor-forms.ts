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
  createTopicAssignment,
  createTopicResource,
  deleteAssignment,
  deleteLesson,
  deleteRecording,
  deleteResource,
  instructorQueries,
  resourceTypeFromUrl,
  updateAssignment,
  updateLesson,
  updateRecording,
  updateResource,
  updateTopic,
  type AssignmentInput,
  type ResourceInput,
} from "@/lib/instructor";

import type {
  AssignmentPageValues,
  ModuleFormValues,
  ResourcePageValues,
} from "./instructor-schema";

const text = (value?: string | null) => (value ?? "").trim();

const outcomesOf = (values: ModuleFormValues) =>
  values.objectives.map((o) => text(o.value)).filter(Boolean);

export function useModuleInitialValues(curriculumId: string, moduleId: string) {
  const topics = useQuery(instructorQueries.topics({ curriculumId }));
  const topic = topics.data?.find((t) => t.id === moduleId);

  const lessons = useQuery(instructorQueries.lessons({ topicId: moduleId }));
  const lessonsData = [...(lessons.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  // Assignments attached to the module itself rather than to a lesson.
  const topicAssignments = useQuery(
    instructorQueries.topicAssignments({ topicId: moduleId })
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
    topicAssignments.isSuccess &&
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
    objectives: topic.outcomes?.length
      ? topic.outcomes.map((value) => ({ value }))
      : [{ value: "" }],
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
    assignments: [
      // Module-level first, then each lesson's.
      ...(topicAssignments.data ?? [])
        .filter((assignment) => !assignment.lessonId)
        .map((assignment) => ({
          serverId: assignment.id,
          title: assignment.title,
          description: assignment.description ?? "",
          lessonKey: "",
        })),
      ...lessonsData.flatMap((lesson, i) =>
        (assignmentQueries[i]?.data ?? []).map((assignment) => ({
          serverId: assignment.id,
          title: assignment.title,
          description: assignment.description ?? "",
          lessonKey: lesson.id,
        }))
      ),
    ],
    publishStatus: topic.publishStatus ?? "PUBLISHED",
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
  const outcomes = outcomesOf(values);

  let topicId = moduleId ?? "";
  if (mode === "create") {
   const created = await createTopic(curriculumId, {
  title,
  description,
  position: nextPosition,
  outcomes,
  publishStatus: values.publishStatus,
});
    topicId = created.id;
 } else if (
  !baseline ||
  baseline.title !== title ||
  text(baseline.description) !== description ||
  JSON.stringify(outcomesOf(baseline)) !== JSON.stringify(outcomes) ||
  baseline.publishStatus !== values.publishStatus
) {
  await updateTopic(topicId, {
    title,
    description,
    outcomes,
    publishStatus: values.publishStatus,
  });
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
        const urlChanged = oldResource?.url !== resourceUrl;

        if (!oldResource || oldResource.title !== resourceTitle || urlChanged) {
          await updateResource(resource.serverId, {
            title: resourceTitle,
            url: resourceUrl,
            // Keep the type in step with the link, but only when it changed.
            ...(urlChanged ? { type: resourceTypeFromUrl(resourceUrl) } : {}),
          });
        }
      } else {
        await createResource(lessonId, {
          title: resourceTitle,
          url: resourceUrl,
          type: resourceTypeFromUrl(resourceUrl),
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
      const input: AssignmentInput = {
        title: assignmentTitle,
        description: assignmentDescription || undefined,
      };

      if (assignment.lessonKey) {
        const lessonId = lessonIdByKey.get(assignment.lessonKey);
        if (lessonId) await createAssignment(lessonId, input);
      } else {
        // No lesson chosen: the assignment belongs to the module.
        await createTopicAssignment(topicId, input);
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

/** The date picker gives yyyy-mm-dd. Due dates are always 11:59 PM local. */
const toDueAt = (date?: string) =>
  date ? new Date(`${date}T23:59:00`).toISOString() : undefined;

export function useSaveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: AssignmentPageValues) => {
      const input: AssignmentInput = {
        title: text(values.title),
        description: text(values.description) || undefined,
        instructions: text(values.instruction) || undefined,
        dueAt: toDueAt(values.dueDate),
        submissionType: values.type,
      };

      return values.lessonId
        ? createAssignment(values.lessonId, input)
        : createTopicAssignment(values.moduleId, input);
    },
    onSuccess: () => refreshInstructorData(queryClient),
  });
}

export function useSaveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ResourcePageValues) => {
      const input: ResourceInput = {
        title: text(values.title),
        url: text(values.url),
        description: text(values.description) || undefined,
        type: values.type,
      };

      return values.lessonId
        ? createResource(values.lessonId, input)
        : createTopicResource(values.moduleId, input);
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
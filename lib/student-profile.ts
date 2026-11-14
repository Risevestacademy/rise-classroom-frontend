import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";

import { curriculumApis } from "@/features/curriculum/api";
import type {
  CurriculumModule,
  CurriculumRecord,
} from "@/features/curriculum/types";
import type { AdminUser } from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
import { mentorQueries } from "@/lib/mentors";

/**
 * The student profile id the per-student endpoints are keyed on.
 * PENDING-BACKEND: the admin user doesn't include it, so it's found in their
 * mentor's students, and students without a mentor have none.
 */
export function useStudentProfileId(student: AdminUser) {
  const mentorId = student.mentor?.id ?? "";
  const mentees = useQuery({
    ...mentorQueries.mentees(mentorId),
    enabled: mentorId.length > 0,
  });
  const profileId =
    mentees.data?.find((mentee) => mentee.user.id === student.id)
      ?.studentProfileId ?? "";

  return {
    profileId,
    isPending: mentorId.length > 0 && mentees.isPending,
    error: mentees.error,
  };
}

type LessonProgress = { lessonId: string; completed: boolean };

async function listCompletedLessons(studentProfileId: string) {
  const ids = new Set<string>();
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const { data } = await api.get<Envelope<Paginated<LessonProgress>>>(
      "/admin/progress",
      { query: { studentProfileId, completed: true, page, limit: 100 } },
    );
    for (const item of data.items) if (item.completed) ids.add(item.lessonId);
    totalPages = data.totalPages;
  }
  return ids;
}

/** The cohort's curriculum for the track, preferring a published one. */
async function findCurriculumId(cohortId: string, trackId: string) {
  const { data } = await api.get<Envelope<CurriculumRecord[]>>(
    "/admin/curriculums",
    { query: { cohortId, trackId } },
  );
  const record =
    data.find((item) => item.publishStatus === "PUBLISHED") ?? data[0];
  return record?.id ?? null;
}

export const studentProfileQueries = {
  completedLessons: (studentProfileId: string) =>
    queryOptions({
      queryKey: ["admin", "progress", studentProfileId] as const,
      queryFn: () => listCompletedLessons(studentProfileId),
      enabled: studentProfileId.length > 0,
    }),

  curriculumId: (cohortId: string, trackId: string) =>
    queryOptions({
      queryKey: ["admin", "student-curriculum", cohortId, trackId] as const,
      queryFn: () => findCurriculumId(cohortId, trackId),
      enabled: cohortId.length > 0 && trackId.length > 0,
      staleTime: 5 * 60_000,
    }),
};

export type ModuleProgress = {
  id: string;
  label: string;
  name: string;
  description: string;
  completed: number;
  total: number;
  /** Null when the student's progress can't be read, or there are no lessons. */
  progress: number | null;
};

export type StudentProgress = {
  overall: number | null;
  modules: ModuleProgress[];
};

const percent = (completed: number, total: number) =>
  total === 0 ? null : Math.round((completed / total) * 100);

/**
 * Lessons completed out of each published module's lessons. Without
 * `completedLessons` the modules are listed with no progress.
 */
export function studentProgress(
  modules: CurriculumModule[],
  completedLessons?: Set<string>,
): StudentProgress {
  const published = modules.filter((module) => module.status === "PUBLISHED");
  const rows = published.map((module, index) => {
    const total = module.lessons.length;
    const completed = module.lessons.filter((lesson) =>
      completedLessons?.has(lesson.id),
    ).length;
    return {
      id: module.id,
      label: `Module ${index + 1}`,
      name: module.title,
      description: module.description,
      completed,
      total,
      progress: completedLessons ? percent(completed, total) : null,
    };
  });
  const sum = (key: "completed" | "total") =>
    rows.reduce((count, row) => count + row[key], 0);

  return {
    overall: completedLessons ? percent(sum("completed"), sum("total")) : null,
    modules: rows,
  };
}

/** The student's progress through their first track's curriculum. */
export function useStudentProgress(student: AdminUser) {
  const membership = student.studentProfile?.[0];
  const cohortId = membership?.cohort?.id ?? "";
  const trackId = membership?.enrollment?.[0]?.track?.id ?? "";

  const profile = useStudentProfileId(student);
  const curriculum = useQuery(
    studentProfileQueries.curriculumId(cohortId, trackId),
  );
  const curriculumId = curriculum.data ?? "";
  const modules = useQuery({
    ...curriculumApis.admin.queries.modules(curriculumId),
    enabled: curriculumId.length > 0,
  });
  const completed = useQuery(
    studentProfileQueries.completedLessons(profile.profileId),
  );

  const isPending =
    profile.isPending ||
    (cohortId.length > 0 && trackId.length > 0 && curriculum.isPending) ||
    (curriculumId.length > 0 && modules.isPending) ||
    (profile.profileId.length > 0 && completed.isPending);

  return {
    isPending,
    error: profile.error ?? curriculum.error ?? modules.error ?? completed.error,
    progress: isPending
      ? undefined
      : studentProgress(modules.data ?? [], completed.data),
  };
}

export type ProgressTarget = {
  profileId: string;
  cohortId: string;
  trackId: string;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

/**
 * Overall progress for several students, by profile id. A student is missing
 * from the map until everything their figure needs has loaded.
 */
export function useOverallProgress(targets: ProgressTarget[]) {
  const scopes = unique(targets.map((t) => `${t.cohortId}:${t.trackId}`));
  const curricula = useQueries({
    queries: scopes.map((scope) => {
      const [cohortId, trackId] = scope.split(":");
      return studentProfileQueries.curriculumId(cohortId, trackId);
    }),
  });
  const curriculumFor = new Map(
    scopes.map((scope, index) => [scope, curricula[index].data]),
  );

  const curriculumIds = unique(
    [...curriculumFor.values()].map((id) => id ?? ""),
  );
  const moduleLists = useQueries({
    queries: curriculumIds.map((id) => curriculumApis.admin.queries.modules(id)),
  });
  const modulesFor = new Map(
    curriculumIds.map((id, index) => [id, moduleLists[index].data]),
  );

  const profileIds = unique(targets.map((t) => t.profileId));
  const completed = useQueries({
    queries: profileIds.map((id) => studentProfileQueries.completedLessons(id)),
  });
  const completedFor = new Map(
    profileIds.map((id, index) => [id, completed[index].data]),
  );

  const progress = new Map<string, number | null>();
  for (const target of targets) {
    const curriculumId = curriculumFor.get(`${target.cohortId}:${target.trackId}`);
    const lessons = completedFor.get(target.profileId);
    if (curriculumId === undefined || !lessons) continue;
    const modules = curriculumId ? modulesFor.get(curriculumId) : [];
    if (!modules) continue;
    progress.set(target.profileId, studentProgress(modules, lessons).overall);
  }
  return progress;
}

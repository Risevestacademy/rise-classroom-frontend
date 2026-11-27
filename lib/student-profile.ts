import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";

import { curriculumApis } from "@/features/curriculum/api";
import type {
  CurriculumModule,
  CurriculumRecord,
} from "@/features/curriculum/types";
import type { AdminUser } from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
import {
  isMentorshipWith,
  liveSessionQueries,
  stillAhead,
  toUpcomingSession,
} from "@/lib/live-sessions";
import { mentorQueries } from "@/lib/mentors";
import { useCurrentMinute } from "@/lib/use-current-minute";

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

/**
 * The student's progress through their first track's curriculum. The overall
 * figure is the API's for that enrollment. PENDING-BACKEND: admins can't read
 * which lessons a student has completed (`/admin/progress` stays empty), so the
 * modules are listed without progress.
 */
export function useStudentProgress(student: AdminUser) {
  const membership = student.studentProfile?.[0];
  const enrollment = membership?.enrollment?.[0];
  const cohortId = membership?.cohort?.id ?? "";
  const trackId = enrollment?.track?.id ?? "";

  const curriculum = useQuery(
    studentProfileQueries.curriculumId(cohortId, trackId),
  );
  const curriculumId = curriculum.data ?? "";
  const modules = useQuery({
    ...curriculumApis.admin.queries.modules(curriculumId),
    enabled: curriculumId.length > 0,
  });

  const isPending =
    (cohortId.length > 0 && trackId.length > 0 && curriculum.isPending) ||
    (curriculumId.length > 0 && modules.isPending);
  const overall =
    enrollment?.progress?.percentage ??
    student.learningProgress?.percentage ??
    null;

  return {
    isPending,
    error: curriculum.error ?? modules.error,
    progress: isPending
      ? undefined
      : { ...studentProgress(modules.data ?? []), overall },
  };
}

export type TrackDeadline = {
  id: string;
  title: string;
  dueAt: string;
  /** Whole days from today, counted in the viewer's time zone. */
  daysLeft: number;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * The next published assignments due on the student's track, soonest first.
 * PENDING-BACKEND: admins can't read a student's submissions (the instructor
 * submissions endpoint answers 403), so ones already handed in still show.
 */
export function upcomingTrackDeadlines(
  modules: CurriculumModule[],
  { now = new Date(), limit = 3 } = {},
): TrackDeadline[] {
  // The API tree lists lesson assignments under the module too; keep each once.
  const byId = new Map<string, TrackDeadline>();
  for (const trackModule of modules) {
    if (trackModule.status !== "PUBLISHED") continue;
    for (const { id, title, dueAt, status } of trackModule.assignments) {
      if (status !== "PUBLISHED" || !dueAt || byId.has(id)) continue;
      if (new Date(dueAt).getTime() < now.getTime()) continue;
      const daysLeft = Math.round(
        (startOfDay(new Date(dueAt)) - startOfDay(now)) / 86_400_000,
      );
      byId.set(id, { id, title, dueAt, daysLeft });
    }
  }
  return [...byId.values()]
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, limit);
}

/** The student's next deadlines, from the same curriculum as their progress. */
export function useStudentDeadlines(student: AdminUser) {
  const membership = student.studentProfile?.[0];
  const cohortId = membership?.cohort?.id ?? "";
  const trackId = membership?.enrollment?.[0]?.track?.id ?? "";

  const curriculum = useQuery(
    studentProfileQueries.curriculumId(cohortId, trackId),
  );
  const curriculumId = curriculum.data ?? "";
  const modules = useQuery({
    ...curriculumApis.admin.queries.modules(curriculumId),
    enabled: curriculumId.length > 0,
  });

  const isPending =
    (cohortId.length > 0 && trackId.length > 0 && curriculum.isPending) ||
    (curriculumId.length > 0 && modules.isPending);

  return {
    isPending,
    error: curriculum.error ?? modules.error,
    deadlines: upcomingTrackDeadlines(modules.data ?? []),
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

/**
 * A student's sessions with their mentor. PENDING-BACKEND: who attended isn't
 * recorded, so only the sessions held so far are counted.
 */
export function useMentorshipSessions(mentor: AdminUser["mentor"]) {
  const now = useCurrentMinute();
  const list = useQuery({
    ...liveSessionQueries.list({ mentorId: mentor?.id }),
    enabled: Boolean(mentor),
  });
  const sessions =
    mentor && list.data
      ? list.data.filter((session) => isMentorshipWith(session, mentor))
      : [];
  return {
    loading: list.isPending || now === null,
    failed: list.isError,
    held: sessions.filter((session) => session.status === "completed").length,
    upcoming:
      now === null
        ? []
        : stillAhead(sessions, now).map((session) =>
            toUpcomingSession(session, now),
          ),
  };
}

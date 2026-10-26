import { queryOptions } from "@tanstack/react-query";

import {
  adminKeys,
  createCohort,
  updateCohort,
  type AdminUser,
  type Cohort,
  type CohortStatus as ApiCohortStatus,
} from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
import type { OnboardingStatus, UserStatus } from "@/lib/auth";
import type {
  CohortStatus,
  CohortSummary,
  Person,
  StudentStatus,
  TrackKey,
} from "@/app/admin/cohorts/cohort-data";

const DAY_MS = 24 * 60 * 60 * 1000;

type InstructorTrack = {
  id: string;
  instructorId: string;
  trackId: string;
  cohortId: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  track?: { id: string; name: string; status?: "ACTIVE" | "SUSPENDED" };
};

export type CohortTrack = {
  id: string;
  track: TrackKey;
  name: string;
  active: boolean;
  students: number;
  // PENDING-BACKEND: no per-student health or progress yet, so these stay 0.
  onTrack: number;
  atRisk: number;
  needsAttention: number;
  progress: number;
};

export type CohortStudent = Person & {
  id: string;
  track: string;
  trackIds: string[];
  accountStatus: UserStatus;
  onboardingStatus: OnboardingStatus;
  // PENDING-BACKEND: no student health or activity data yet.
  status: StudentStatus | null;
  lastActive: string;
};

export type CohortStaff = Person & {
  id: string;
  track: string;
  trackId: string;
  /** `null` when the user record couldn't be loaded. */
  accountStatus: UserStatus | null;
  students: number;
  // PENDING-BACKEND: no activity data yet.
  lastActive: string;
};

export type CohortDetail = CohortSummary & {
  trackNames: string[];
  instructorsAndMentors: number;
  trackList: CohortTrack[];
  studentList: CohortStudent[];
  instructorList: CohortStaff[];
  // PENDING-BACKEND: the API has no mentor role or mentor-cohort link.
  mentorList: CohortStaff[];
};

/** The API has no "upcoming" status; an ongoing cohort that hasn't started yet is shown as upcoming. */
function uiStatus(cohort: Cohort, now = new Date()): CohortStatus {
  if (cohort.status === "TERMINATED") return "terminated";
  if (cohort.status === "COMPLETED") return "completed";
  return new Date(cohort.startDate) > now ? "upcoming" : "active";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function daysUntil(date: string, now = new Date()) {
  const ms = new Date(date).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

/**
 * PENDING-BACKEND: the API has no completion data, so progress is the share of
 * the cohort's time that has passed.
 */
function timeProgress(cohort: Cohort, now = new Date()) {
  if (cohort.status === "COMPLETED") return 100;
  // A terminated cohort stops where it was when it was terminated.
  if (cohort.status === "TERMINATED") now = new Date(cohort.updatedAt);
  const start = new Date(cohort.startDate).getTime();
  const end = new Date(cohort.endDate).getTime();
  if (end <= start) return 0;
  const share = (now.getTime() - start) / (end - start);
  return Math.round(Math.min(1, Math.max(0, share)) * 100);
}

const trackKeys: { key: TrackKey; pattern: RegExp }[] = [
  { key: "design", pattern: /design|ui|ux/i },
  { key: "frontend", pattern: /front/i },
  { key: "backend", pattern: /back/i },
  { key: "mobile", pattern: /mobile|android|ios/i },
];

/** Picks the design colour set for a track by its name, cycling for unknown names. */
export function trackKeyFor(name: string, index = 0): TrackKey {
  return (
    trackKeys.find(({ pattern }) => pattern.test(name))?.key ??
    trackKeys[index % trackKeys.length].key
  );
}

const tones = ["info", "warning", "success", "accent", "error"] as const;

function personFor(id: string, name: string, email: string): Person {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { name, email, initials, tone: tones[hash % tones.length] };
}

function studentTracks(user: AdminUser, cohortId: string) {
  return (user.studentProfile ?? [])
    .filter((membership) => membership.cohort?.id === cohortId)
    .flatMap((membership) => membership.enrollment ?? [])
    .flatMap((enrollment) => (enrollment.track ? [enrollment.track] : []));
}

async function listInstructorTracks(cohortId?: string) {
  const { data } = await api.get<Envelope<InstructorTrack[]>>(
    "/admin/instructor-tracks",
    { query: { cohortId } },
  );
  return data;
}

async function listUsersPage(
  query: { role: AdminUser["role"]; cohortId?: string },
  page: number,
) {
  const { data } = await api.get<Envelope<Paginated<AdminUser>>>(
    "/admin/users",
    { query: { ...query, page, limit: 100 } },
  );
  return data;
}

function listStudentsPage(cohortId: string, page: number) {
  return listUsersPage({ role: "STUDENT", cohortId }, page);
}

/** Instructor-track records only carry a name and email, not account status. */
async function listAllInstructors() {
  const first = await listUsersPage({ role: "INSTRUCTOR" }, 1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      listUsersPage({ role: "INSTRUCTOR" }, i + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

async function listAllStudents(cohortId: string) {
  const first = await listStudentsPage(cohortId, 1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      listStudentsPage(cohortId, i + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

/** Tracks a cohort runs: any track with an instructor or an enrolled student. */
function cohortTrackNames(
  cohortId: string,
  assignments: InstructorTrack[],
  students: AdminUser[],
) {
  const tracks = new Map<string, { name: string; active: boolean }>();
  for (const assignment of assignments) {
    if (assignment.cohortId !== cohortId || !assignment.track) continue;
    tracks.set(assignment.track.id, {
      name: assignment.track.name,
      active: assignment.track.status !== "SUSPENDED",
    });
  }
  for (const student of students) {
    for (const track of studentTracks(student, cohortId)) {
      if (!tracks.has(track.id)) {
        tracks.set(track.id, { name: track.name, active: true });
      }
    }
  }
  return tracks;
}

function toSummary(
  cohort: Cohort,
  students: number,
  tracks: number,
): CohortSummary {
  return {
    id: cohort.id,
    name: cohort.name,
    status: uiStatus(cohort),
    startDate: formatDate(cohort.startDate),
    endDate: formatDate(cohort.endDate),
    students,
    tracks,
    progress: timeProgress(cohort),
    daysLeft: daysUntil(cohort.endDate),
    daysToStart: daysUntil(cohort.startDate),
  };
}

async function listCohortSummaries() {
  const [{ data: cohorts }, assignments] = await Promise.all([
    api.get<Envelope<Cohort[]>>("/admin/cohorts"),
    listInstructorTracks(),
  ]);

  return Promise.all(
    cohorts.map(async (cohort) => {
      // The first page is enough for the card: total gives the count and the
      // enrolments fill in tracks that have no instructor yet.
      const page = await listStudentsPage(cohort.id, 1);
      const tracks = cohortTrackNames(cohort.id, assignments, page.items);
      return toSummary(cohort, page.total, tracks.size);
    }),
  );
}

/** Ids of the tracks a cohort runs. */
async function listCohortTrackIds(cohortId: string) {
  const [assignments, students] = await Promise.all([
    listInstructorTracks(cohortId),
    listAllStudents(cohortId),
  ]);
  return Array.from(cohortTrackNames(cohortId, assignments, students).keys());
}

async function getCohortDetail(id: string): Promise<CohortDetail> {
  const [{ data: cohort }, assignments, students, instructors] =
    await Promise.all([
      api.get<Envelope<Cohort>>(`/admin/cohorts/${id}`),
      listInstructorTracks(id),
      listAllStudents(id),
      // Only needed for the status filter, so a failure shouldn't hide the page.
      listAllInstructors().catch(() => [] as AdminUser[]),
    ]);
  const instructorStatus = new Map(
    instructors.map((user) => [user.id, user.status]),
  );

  const tracks = cohortTrackNames(id, assignments, students);
  const studentsPerTrack = new Map<string, number>();
  for (const student of students) {
    for (const track of studentTracks(student, id)) {
      studentsPerTrack.set(track.id, (studentsPerTrack.get(track.id) ?? 0) + 1);
    }
  }

  const trackList = Array.from(tracks, ([trackId, track], index) => ({
    id: trackId,
    track: trackKeyFor(track.name, index),
    name: track.name,
    active: track.active,
    students: studentsPerTrack.get(trackId) ?? 0,
    onTrack: 0,
    atRisk: 0,
    needsAttention: 0,
    progress: 0,
  }));

  const studentList = students.map((student) => ({
    ...personFor(student.id, student.name, student.email),
    id: student.id,
    track:
      studentTracks(student, id)
        .map((track) => track.name)
        .join(", ") || "--",
    trackIds: studentTracks(student, id).map((track) => track.id),
    accountStatus: student.status,
    onboardingStatus: student.onboardingStatus,
    status: null,
    lastActive: "--",
  }));

  const instructorList = assignments
    .filter((assignment) => assignment.cohortId === id)
    .map((assignment) => {
      const instructor = assignment.instructor;
      const name = instructor
        ? `${instructor.firstName} ${instructor.lastName}`.trim()
        : "Unknown instructor";
      return {
        ...personFor(assignment.id, name, instructor?.email ?? ""),
        id: assignment.id,
        track: assignment.track?.name ?? "--",
        trackId: assignment.trackId,
        accountStatus: instructorStatus.get(assignment.instructorId) ?? null,
        students: studentsPerTrack.get(assignment.trackId) ?? 0,
        lastActive: "--",
      };
    });

  return {
    ...toSummary(cohort, students.length, tracks.size),
    trackNames: trackList.map((track) => track.name),
    instructorsAndMentors: new Set(
      instructorList.map((row) => row.email || row.id),
    ).size,
    trackList,
    studentList,
    instructorList,
    mentorList: [],
  };
}

export type CreateCohortFormInput = {
  name: string;
  /** PENDING-BACKEND: the API has no description field, so it isn't sent. */
  description: string;
  startDate: Date;
  endDate: Date;
  status: CohortStatus;
};

/** YYYY-MM-DD from a local date, as the API expects. */
function isoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The API creates every cohort as ONGOING; "upcoming" and "active" come from
 * the start date, so only "completed" needs a follow-up update.
 */
export async function createCohortFromForm(input: CreateCohortFormInput) {
  const { data } = await createCohort({
    name: input.name,
    year: String(input.startDate.getFullYear()),
    startDate: isoDate(input.startDate),
    endDate: isoDate(input.endDate),
  });

  if (input.status === "completed") {
    await updateCohort(data.id, { status: apiStatus(input.status) });
  }

  return data;
}

/** Maps a screen status to the API's; upcoming and active are both ONGOING. */
function apiStatus(status: CohortStatus): ApiCohortStatus {
  if (status === "completed") return "COMPLETED";
  if (status === "terminated") return "TERMINATED";
  return "ONGOING";
}

/** DD/MM/YYYY from an API date, for the edit form. */
function formDate(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function cohortFormValues(cohort: Cohort) {
  return {
    name: cohort.name,
    // PENDING-BACKEND: the API has no description field.
    description: "",
    startDate: formDate(cohort.startDate),
    endDate: formDate(cohort.endDate),
    status: uiStatus(cohort),
  };
}

/**
 * Upcoming and active both save as ONGOING; the start date decides which one
 * the cohort shows as.
 */
export function updateCohortFromForm(id: string, input: CreateCohortFormInput) {
  return updateCohort(id, {
    name: input.name,
    year: String(input.startDate.getFullYear()),
    startDate: isoDate(input.startDate),
    endDate: isoDate(input.endDate),
    status: apiStatus(input.status),
  });
}

/** Completes, terminates or reactivates a cohort. */
export function setCohortStatus(id: string, status: CohortStatus) {
  return updateCohort(id, { status: apiStatus(status) });
}

export const cohortKeys = {
  all: adminKeys.allCohorts,
  summaries: () => [...adminKeys.allCohorts(), "summaries"] as const,
  detail: (id: string) => [...adminKeys.allCohorts(), "overview", id] as const,
  trackIds: (id: string) =>
    [...adminKeys.allCohorts(), "track-ids", id] as const,
};

export const cohortQueries = {
  summaries: () =>
    queryOptions({
      queryKey: cohortKeys.summaries(),
      queryFn: listCohortSummaries,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: cohortKeys.detail(id),
      queryFn: () => getCohortDetail(id),
    }),

  trackIds: (id: string) =>
    queryOptions({
      queryKey: cohortKeys.trackIds(id),
      queryFn: () => listCohortTrackIds(id),
    }),
};

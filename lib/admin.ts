import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope, type Paginated } from "@/lib/api";
import type { OnboardingStatus, Role, UserStatus } from "@/lib/auth";

export type TrackStatus = "ACTIVE" | "SUSPENDED";
export type CohortStatus = "ONGOING" | "COMPLETED" | "TERMINATED";

/** A named reference the API embeds inside assignment records. */
type NamedRef = { id: string; name: string };

/** An instructor's cohort + track assignment. */
export type InstructorAssignment = {
  cohort?: NamedRef & { year?: string };
  track?: NamedRef;
};

/** A student's cohort membership and the tracks they're enrolled on. */
export type StudentMembership = {
  cohort?: NamedRef & { year?: string };
  enrollment?: { status: string; track?: NamedRef }[];
};

export type AdminUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  onboardedAt?: string | null;
  createdAt: string;
  instructorTrack?: InstructorAssignment[];
  studentProfile?: StudentMembership[];
};

/** Payload for `POST /admin/users` — every field is required by the API. */
export type InviteUserInput = {
  cohortId: string;
  trackId: string;
  role: "STUDENT" | "INSTRUCTOR";
  firstName: string;
  lastName: string;
  email: string;
};

export type Track = {
  id: string;
  name: string;
  description: string;
  status: TrackStatus;
  createdAt: string;
  updatedAt: string;
};

export type Cohort = {
  id: string;
  name: string;
  year: string;
  status: CohortStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type UserFilters = {
  role?: Role;
  status?: UserStatus;
  onboardingStatus?: OnboardingStatus;
  cohortId?: string;
  trackId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

async function listUsers(filters: UserFilters = {}) {
  const { data } = await api.get<Envelope<Paginated<AdminUser>>>(
    "/admin/users",
    { query: filters },
  );

  return data;
}

/**
 * Just the number of matching users. Asks for a single row and reads the
 * `total` off the pagination envelope, so a headline figure doesn't pull down
 * a full page of records.
 */
async function countUsers(filters: UserFilters = {}) {
  const { total } = await listUsers({ ...filters, limit: 1 });
  return total;
}

async function listTracks(status?: TrackStatus) {
  const { data } = await api.get<Envelope<Track[]>>("/admin/tracks", {
    query: { status },
  });

  return data;
}

async function listCohorts(status?: CohortStatus) {
  const { data } = await api.get<Envelope<Cohort[]>>("/admin/cohorts", {
    query: { status },
  });

  return data;
}

/** Payload for `POST /admin/tracks` — the API requires `description` as a
 * string even when empty, so callers can't omit it. */
export type CreateTrackInput = {
  name: string;
  description: string;
};

export function createTrack(input: CreateTrackInput) {
  return api.post<Envelope<Track>>("/admin/tracks", input);
}

export function inviteUser(input: InviteUserInput) {
  return api.post<Envelope<AdminUser>>("/admin/users", input);
}

export function inviteUsersBulk(users: InviteUserInput[]) {
  return api.post<Envelope<unknown>>("/admin/users/bulk", { users });
}

export function resendInvite(userId: string) {
  return api.post<Envelope<unknown>>(`/admin/users/${userId}/resend-invite`);
}

/** The cohort and track names shown against a user, whatever their role. */
export function assignmentsFor(user: AdminUser) {
  const tracks = new Set<string>();
  const cohorts = new Set<string>();

  for (const assignment of user.instructorTrack ?? []) {
    if (assignment.track?.name) tracks.add(assignment.track.name);
    if (assignment.cohort?.name) cohorts.add(assignment.cohort.name);
  }

  for (const membership of user.studentProfile ?? []) {
    if (membership.cohort?.name) cohorts.add(membership.cohort.name);
    for (const enrollment of membership.enrollment ?? []) {
      if (enrollment.track?.name) tracks.add(enrollment.track.name);
    }
  }

  return {
    tracks: Array.from(tracks),
    cohorts: Array.from(cohorts),
  };
}

export const adminKeys = {
  users: (filters: UserFilters = {}) => ["admin", "users", filters] as const,
  userCount: (filters: UserFilters = {}) =>
    ["admin", "users", "count", filters] as const,
  tracks: (status?: TrackStatus) => ["admin", "tracks", status] as const,
  cohorts: (status?: CohortStatus) => ["admin", "cohorts", status] as const,
};

export const adminQueries = {
  users: (filters: UserFilters = {}) =>
    queryOptions({
      queryKey: adminKeys.users(filters),
      queryFn: () => listUsers(filters),
    }),

  userCount: (filters: UserFilters = {}) =>
    queryOptions({
      queryKey: adminKeys.userCount(filters),
      queryFn: () => countUsers(filters),
    }),

  // Tracks and cohorts are program structure — they change far less often than
  // headcounts, so they can sit in cache much longer.
  tracks: (status?: TrackStatus) =>
    queryOptions({
      queryKey: adminKeys.tracks(status),
      queryFn: () => listTracks(status),
      staleTime: 5 * 60_000,
    }),

  cohorts: (status?: CohortStatus) =>
    queryOptions({
      queryKey: adminKeys.cohorts(status),
      queryFn: () => listCohorts(status),
      staleTime: 5 * 60_000,
    }),
};

import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope, type Paginated } from "@/lib/api";
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
  emailVerified?: boolean;
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

export type InviteUserResult = {
  outcome: "invited";
  emailSent: boolean;
  user: AdminUser;
};

export type BulkInviteResult = {
  summary: {
    total: number;
    invited: number;
    failed: number;
    emailsNotSent: number;
  };
  results: {
    index: number;
    email: string | null;
    outcome: "invited" | "failed";
    userId?: string;
    emailSent?: boolean;
    error?: string;
  }[];
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

async function getUser(id: string) {
  const { data } = await api.get<Envelope<AdminUser>>(`/admin/users/${id}`);
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

async function getCohort(id: string) {
  const { data } = await api.get<Envelope<Cohort>>(`/admin/cohorts/${id}`);
  return data;
}

export type CreateCohortInput = {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
};

export type UpdateCohortInput = Partial<
  CreateCohortInput & { status: CohortStatus }
>;

export function createCohort(input: CreateCohortInput) {
  return api.post<Envelope<Cohort>>("/admin/cohorts", input);
}

export function updateCohort(id: string, input: UpdateCohortInput) {
  return api.patch<Envelope<Cohort>>(`/admin/cohorts/${id}`, input);
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
  return api.post<Envelope<InviteUserResult>>("/admin/users", input);
}

export function inviteUsersBulk(users: InviteUserInput[]) {
  return api.post<Envelope<BulkInviteResult>>("/admin/users/bulk", { users });
}

export function resendInvite(userId: string) {
  return api.post<Envelope<unknown>>(`/admin/users/${userId}/resend-invite`);
}

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: UserStatus;
};

export type UpdateUserResult = {
  user: AdminUser;
  emailSent?: boolean;
};

export function updateUser(id: string, input: UpdateUserInput) {
  return api.patch<Envelope<UpdateUserResult>>(`/admin/users/${id}`, input);
}

export type UserDraft = Pick<
  AdminUser,
  "firstName" | "lastName" | "email" | "status"
>;

export function userChanges(user: AdminUser, draft: UserDraft) {
  const changes: UpdateUserInput = {};
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const email = draft.email.trim();

  if (firstName !== user.firstName) changes.firstName = firstName;
  if (lastName !== user.lastName) changes.lastName = lastName;
  if (email !== user.email) changes.email = email;
  if (draft.status !== user.status) changes.status = draft.status;

  return changes;
}

function getAdminAccessErrorMessage(error: ApiError) {
  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.status === 403) {
    return "Only super admins can do this. Check that your account is active.";
  }

  return null;
}

export function getProgramOptionsErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return (
    getAdminAccessErrorMessage(error) ??
    "We couldn't load cohorts and tracks. Please try again."
  );
}

export function getInviteErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;

  if (error.status === 404) {
    return "That cohort or track no longer exists. Go back and pick another one.";
  }

  if (error.status === 409) {
    return "Someone with this email already has an account. If they were invited earlier, resend their invite instead.";
  }

  if (error.status >= 500) {
    return "We couldn't send the invitation. Please try again.";
  }

  return error.message || "We couldn't send the invitation. Please try again.";
}

export function getCohortErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;

  if (error.status === 404) {
    return "This cohort no longer exists. Refresh the page to see the latest list.";
  }

  if (error.status === 409) {
    return "A cohort with this name already exists. Choose a different name.";
  }

  if (error.status >= 500) {
    return "We couldn't save the cohort. Please try again.";
  }

  return error.message || "We couldn't save the cohort. Please try again.";
}

export function getUpdateUserErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;

  if (error.status === 404) {
    return "This user no longer exists. Refresh the page to see the latest list.";
  }

  if (error.status === 409) {
    return "Another account already uses this email address.";
  }

  if (error.status >= 500) {
    return "We couldn't save these changes. Please try again.";
  }

  return error.message || "We couldn't save these changes. Please try again.";
}

export function getResendInviteErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;

  if (error.status === 404) {
    return "This user no longer exists. Refresh the page to see the latest list.";
  }

  if (error.status === 502) {
    return "We couldn't send the email. Please try again.";
  }

  return error.message || "We couldn't resend the invite. Please try again.";
}

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
  user: (id: string) => ["admin", "users", "detail", id] as const,
  userCount: (filters: UserFilters = {}) =>
    ["admin", "users", "count", filters] as const,
  tracks: (status?: TrackStatus) => ["admin", "tracks", status] as const,
  cohorts: (status?: CohortStatus) => ["admin", "cohorts", status] as const,
  cohort: (id: string) => ["admin", "cohorts", "detail", id] as const,
  allCohorts: () => ["admin", "cohorts"] as const,
};

export const adminQueries = {
  users: (filters: UserFilters = {}) =>
    queryOptions({
      queryKey: adminKeys.users(filters),
      queryFn: () => listUsers(filters),
    }),

  user: (id: string) =>
    queryOptions({
      queryKey: adminKeys.user(id),
      queryFn: () => getUser(id),
    }),

  userCount: (filters: UserFilters = {}) =>
    queryOptions({
      queryKey: adminKeys.userCount(filters),
      queryFn: () => countUsers(filters),
    }),

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

  cohort: (id: string) =>
    queryOptions({
      queryKey: adminKeys.cohort(id),
      queryFn: () => getCohort(id),
    }),
};

import { queryOptions } from "@tanstack/react-query";

import {
  assignmentsFor,
  getAdminAccessErrorMessage,
  type AdminUser,
} from "@/lib/admin";
import { api, ApiError, type Envelope, type Paginated } from "@/lib/api";
import { formatJoined } from "@/app/admin/students/student-display";

export type MentorStatus = "active" | "pending" | "inactive";

export type Mentor = {
  id: string;
  name: string;
  email: string;
  track: string;
  /**
   * PENDING-BACKEND: admins can't list mentorships yet, so this is always
   * null until there's an endpoint for a mentor's students.
   */
  studentsAssigned: number | null;
  status: MentorStatus;
  joined: string;
  user: AdminUser;
};

function mentorStatus(user: AdminUser): MentorStatus {
  if (user.status === "SUSPENDED") return "inactive";
  if (user.onboardingStatus === "INVITED") return "pending";
  return "active";
}

export function toMentor(user: AdminUser): Mentor {
  return {
    id: user.id,
    name: user.displayName ?? user.name,
    email: user.email,
    track: assignmentsFor(user).tracks.join(", ") || "--",
    studentsAssigned: null,
    status: mentorStatus(user),
    joined: formatJoined(user),
    user,
  };
}

function listMentorsPage(cohortId: string | undefined, page: number) {
  return api
    .get<Envelope<Paginated<AdminUser>>>("/admin/users", {
      query: { role: "MENTOR", cohortId, page, limit: 100 },
    })
    .then(({ data }) => data);
}

/** Every mentor, so the page can search, filter and count them all. */
async function listMentors(cohortId?: string) {
  const first = await listMentorsPage(cohortId, 1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      listMentorsPage(cohortId, i + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items).map(toMentor);
}

export const mentorKeys = {
  // Under the users key, so inviting or editing a user refreshes it.
  list: (cohortId?: string) =>
    ["admin", "users", "mentors", cohortId] as const,
};

export const mentorQueries = {
  list: (cohortId?: string) =>
    queryOptions({
      queryKey: mentorKeys.list(cohortId),
      queryFn: () => listMentors(cohortId),
    }),
};

export type MentorshipRecord = {
  id: string;
  mentorId: string;
  studentId: string;
  active: boolean;
  assignedAt: string;
  endedAt?: string | null;
};

/**
 * Gives a student this mentor, replacing any mentor they had, so it both
 * assigns and reassigns. A mentor can have at most 4 active mentees.
 */
export function assignMentor(input: { mentorId: string; studentUserId: string }) {
  return api.post<Envelope<MentorshipRecord>>("/mentors/assign", input);
}

export function getAssignMentorErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;
  // The API explains capacity and cohort/track mismatches in its message.
  if (error.status === 400 && error.message) return error.message;
  if (error.status === 404) {
    return "We couldn't find this student. Refresh the page and try again.";
  }
  return "We couldn't assign the mentor. Please try again.";
}

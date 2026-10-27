import { queryOptions } from "@tanstack/react-query";

import { assignmentsFor, type AdminUser } from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
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

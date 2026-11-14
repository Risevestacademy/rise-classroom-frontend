import { queryOptions } from "@tanstack/react-query";

import type { AdminUser } from "@/lib/admin";
import { api, type Envelope } from "@/lib/api";
import type { AssignedStudent } from "@/app/admin/mentors/[id]/profile-data";

/** One enrolment on a cohort and track the instructor teaches. */
export type InstructorStudent = {
  studentProfileId: string;
  cohort: { id: string; name: string; year?: string };
  track: { id: string; name: string };
  enrollmentStatus: string;
  enrolledAt: string;
  user: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    displayName?: string | null;
    email: string;
    phoneNumber?: string | null;
    image?: string | null;
    status: AdminUser["status"];
  };
};

async function listInstructorStudents(instructorId: string) {
  const { data } = await api.get<Envelope<InstructorStudent[]>>(
    `/admin/users/${instructorId}/students`,
  );
  return data;
}

/** Everyone enrolled on the cohort tracks an instructor teaches. */
export function instructorStudentsQuery(instructorId: string) {
  return queryOptions({
    // Under the users key, so inviting or editing a user refreshes it.
    queryKey: ["admin", "users", "students-of", instructorId] as const,
    queryFn: () => listInstructorStudents(instructorId),
  });
}

/**
 * The instructor's students, listed once each though the API sends one entry
 * per enrolment. There's no progress yet.
 */
export function toTaughtStudents(enrolments: InstructorStudent[]) {
  const byId = new Map<string, AssignedStudent>();
  for (const { user } of enrolments) {
    byId.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status === "SUSPENDED" ? "inactive" : "active",
      progress: null,
    });
  }
  return [...byId.values()];
}

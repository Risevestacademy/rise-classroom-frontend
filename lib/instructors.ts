import { adminQueries, staffAssignments, type AdminUser } from "@/lib/admin";
import { mentorStatus } from "@/lib/mentors";
import type { AssignedStudent } from "@/app/admin/mentors/[id]/profile-data";

/**
 * An instructor's students are the ones enrolled on a track they teach, so
 * this is a students query for each of their cohort tracks.
 * PENDING-BACKEND: there's no instructor students endpoint, so each query
 * only loads the first 100 students.
 */
export function instructorStudentQueries(instructor: AdminUser) {
  return staffAssignments(instructor).flatMap(({ cohort, track }) =>
    cohort && track
      ? [
          adminQueries.users({
            role: "STUDENT",
            cohortId: cohort.id,
            trackId: track.id,
            limit: 100,
          }),
        ]
      : [],
  );
}

/** A student as the instructor profile lists them; there's no progress yet. */
export function toTaughtStudent(user: AdminUser): AssignedStudent {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: mentorStatus(user),
    progress: null,
  };
}

import type { QueryClient } from "@tanstack/react-query";

import { controlTowerQueries } from "@/lib/control-tower";
import { profileQueries } from "@/lib/profile";
import { studentQueries } from "@/lib/student";
import { studentAssignmentQueries } from "@/lib/student-assignments";
import { lessonQueries } from "@/lib/student-lessons";
import { studentNotificationQueries } from "@/lib/student-notifications";

type Prefetcher = (queryClient: QueryClient) => Promise<unknown>;

/* Most pages hang off the student's enrollments, so those load first. */
async function forEachEnrollment(
  queryClient: QueryClient,
  load: (enrollmentId: string) => Promise<unknown>,
) {
  const tracks = await queryClient.ensureQueryData(studentQueries.progress());
  await Promise.all(tracks.map((track) => load(track.enrollmentId)));
}

/** What each sidebar page shows first, matching the queries the page itself runs. */
const prefetchers: Record<string, Prefetcher> = {
  "/student/my-learning": (queryClient) =>
    queryClient
      .ensureQueryData(studentQueries.progress())
      .then((tracks) => {
        const enrollment = tracks.find((t) => !t.trackComplete) ?? tracks[0];
        return enrollment
          ? queryClient.prefetchQuery(lessonQueries.content(enrollment.enrollmentId))
          : undefined;
      }),

  "/student/assignments": (queryClient) =>
    Promise.all([
      ...(["PENDING", "IN_PROGRESS"] as const).map((status) =>
        queryClient.prefetchQuery(studentQueries.weeklyTasks({ status, limit: 100 })),
      ),
      queryClient.prefetchQuery(studentQueries.weeklyTasks({ limit: 1 })),
      forEachEnrollment(queryClient, (id) =>
        Promise.all([
          queryClient.prefetchQuery(studentAssignmentQueries.enrollmentSubmissions(id)),
          queryClient.prefetchQuery(lessonQueries.content(id)),
        ]),
      ),
    ]),

  "/student/control-tower": (queryClient) =>
    queryClient
      .ensureQueryData(controlTowerQueries.student())
      .then((tower) =>
        queryClient.prefetchQuery(controlTowerQueries.weeklyMetrics(tower.student.id)),
      ),

  "/student/notifications": (queryClient) =>
    queryClient.prefetchQuery(studentNotificationQueries.announcements()),

  "/student/profile": (queryClient) =>
    Promise.all([
      queryClient.prefetchQuery(profileQueries.me()),
      queryClient.prefetchQuery(profileQueries.mentor()),
    ]),
};

/* Prefetching is extra traffic, so it's skipped where the network can't spare it. */
function canSpareTheNetwork() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return true;
  return !connection.saveData && !/(^|-)2g$/.test(connection.effectiveType ?? "");
}

/**
 * Starts loading a page's data when the student shows they're heading there.
 * Anything already fresh in the cache isn't requested again.
 */
export function prefetchStudentPage(queryClient: QueryClient, href: string) {
  const prefetch = prefetchers[href];
  if (!prefetch || !canSpareTheNetwork()) return;
  // A failed prefetch is retried by the page itself when it opens.
  prefetch(queryClient).catch(() => {});
}

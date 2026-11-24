import type { WeeklyTask } from "@/lib/instructor";
import type { TrackProgress } from "@/lib/student";
import { assignmentHref, type StudentSubmission } from "@/lib/student-assignments";
import {
  findLesson,
  findTopic,
  moduleHref,
  topicAssignments,
  videoThumbnail,
  type CurriculumLesson,
  type CurriculumTopic,
} from "@/lib/student-lessons";

/** What the "Continue Learning" card shows, pointing into the learning pages. */
export type ContinueLearning = {
  moduleNumber: number;
  /** null when the student is between lessons or the track is done. */
  lessonNumber: number | null;
  moduleTitle: string;
  lessonTitle: string | null;
  percentage: number;
  trackComplete: boolean;
  /** The module page, the same place the curriculum's module links open. */
  href: string;
  thumbnail: string | null;
};

function firstThumbnail(lessons: CurriculumLesson[]) {
  for (const lesson of lessons) {
    for (const recording of lesson.recordings ?? []) {
      const thumbnail = videoThumbnail(recording.url);
      if (thumbnail) return thumbnail;
    }
  }
  return null;
}

/**
 * Where the student left off, or null when they haven't started a module yet
 * (nothing completed and no current module), which the design shows as
 * "No module started yet".
 */
export function continueLearning(
  enrollment: TrackProgress,
  topics: CurriculumTopic[]
): ContinueLearning | null {
  const located = enrollment.currentLesson
    ? findLesson(topics, enrollment.currentLesson.id)
    : null;
  const topicId = located?.topic.id ?? enrollment.currentTopic?.id;
  const current = topicId ? findTopic(topics, topicId) : null;

  if (!current || enrollment.progress.completedLessons === 0) return null;

  const lessons = located
    ? [located.lesson, ...current.topic.lessons.filter((item) => item !== located.lesson)]
    : current.topic.lessons;

  return {
    moduleNumber: current.number,
    lessonNumber: located?.number ?? null,
    moduleTitle: current.topic.title,
    lessonTitle: located?.lesson.title ?? enrollment.currentLesson?.title ?? null,
    percentage: Math.min(100, Math.max(0, Math.round(enrollment.progress.percentage))),
    trackComplete: enrollment.trackComplete,
    href: moduleHref(current.topic.id),
    thumbnail: firstThumbnail(lessons),
  };
}

export type DeadlineState = "dueToday" | "inProgress" | "notStarted";

export type Deadline = {
  key: string;
  title: string;
  kind: "Assignment" | "Weekly task";
  dueAt: string;
  state: DeadlineState;
  /** Weekly tasks have no page of their own yet. */
  href: string | null;
};

/** Submission statuses where the work is still the student's to hand in. */
const stillOpen = new Set<StudentSubmission["status"]>([
  "ASSIGNED",
  "DRAFT",
  "CHANGES_REQUESTED",
  "ON_HOLD",
]);
const started = new Set<StudentSubmission["status"]>(["DRAFT", "CHANGES_REQUESTED"]);

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/**
 * Work still to hand in with a deadline that hasn't passed, soonest first:
 * assignments on unlocked modules and lessons (the ones the Assignments page
 * lists under "To do") plus open weekly tasks.
 */
export function upcomingDeadlines(
  topics: CurriculumTopic[],
  submissions: StudentSubmission[],
  tasks: WeeklyTask[],
  { now = new Date(), limit = 3 } = {}
): Deadline[] {
  const byAssignment = new Map(submissions.map((item) => [item.assignmentId, item]));
  const state = (dueAt: string, inProgress: boolean): DeadlineState =>
    isSameDay(new Date(dueAt), now) ? "dueToday" : inProgress ? "inProgress" : "notStarted";
  const isUpcoming = (dueAt: string | null | undefined): dueAt is string =>
    Boolean(dueAt && new Date(dueAt).getTime() >= now.getTime());

  const assignments: Deadline[] = topics.flatMap((topic) =>
    topicAssignments(topic).flatMap(({ assignment }) => {
      const submission = byAssignment.get(assignment.id);
      if (!isUpcoming(assignment.dueAt)) return [];
      if (submission && !stillOpen.has(submission.status)) return [];
      return [
        {
          key: `assignment-${assignment.id}`,
          title: assignment.title,
          kind: "Assignment" as const,
          dueAt: assignment.dueAt,
          state: state(assignment.dueAt, Boolean(submission && started.has(submission.status))),
          href: assignmentHref(assignment.id),
        },
      ];
    })
  );

  const weeklyTasks: Deadline[] = tasks
    .filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS")
    .filter((task) => isUpcoming(task.dueDate))
    .map((task) => ({
      key: `task-${task.id}`,
      title: task.title,
      kind: "Weekly task" as const,
      dueAt: task.dueDate,
      state: state(task.dueDate, task.status === "IN_PROGRESS"),
      href: null,
    }));

  return [...assignments, ...weeklyTasks]
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, limit);
}

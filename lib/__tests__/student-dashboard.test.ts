import { describe, expect, it } from "vitest";

import type { WeeklyTask } from "@/lib/instructor";
import type { TrackProgress } from "@/lib/student";
import type { StudentSubmission } from "@/lib/student-assignments";
import { continueLearning, upcomingDeadlines } from "@/lib/student-dashboard";
import type { CurriculumTopic, LessonAssignment } from "@/lib/student-lessons";

const open = { instructorUnlocked: true, unlocked: true, completed: false };

function assignment(id: string, dueAt: string | null): LessonAssignment {
  return { id, title: `Assignment ${id}`, dueAt, publishStatus: "PUBLISHED" } as LessonAssignment;
}

const topics: CurriculumTopic[] = [
  {
    id: "t1",
    title: "Introduction to Design",
    lock: open,
    lessons: [
      { id: "l1", title: "Visual design", lock: open },
      {
        id: "l2",
        title: "Color & typography",
        lock: open,
        recordings: [
          { id: "r1", lessonId: "l2", title: "Class", url: "https://youtu.be/abc123" },
        ],
        assignments: [assignment("a2", "2026-10-16T17:00:00.000Z")],
      },
    ],
    assignments: [assignment("a1", "2026-10-14T20:00:00.000Z")],
  },
  {
    id: "t2",
    title: "Design systems",
    lock: open,
    lessons: [{ id: "l3", title: "Button and Text Input", lock: open }],
    assignments: [
      assignment("past", "2026-10-01T00:00:00.000Z"),
      assignment("none", null),
      assignment("a3", "2026-10-20T09:00:00.000Z"),
      assignment("a4", "2026-10-25T09:00:00.000Z"),
    ],
  },
];

function enrollment(changes: Partial<TrackProgress> = {}): TrackProgress {
  return {
    enrollmentId: "e1",
    status: "ENROLLED",
    enrolledAt: "2026-09-01T00:00:00.000Z",
    track: { id: "track", name: "Design", description: "" },
    progress: { completedLessons: 3, totalLessons: 10, percentage: 30 },
    currentTopic: { id: "t1", title: "Introduction to Design" },
    currentLesson: { id: "l2", title: "Color & typography" },
    trackComplete: false,
    ...changes,
  };
}

describe("continueLearning", () => {
  it("points at the current module, numbered as the curriculum numbers it", () => {
    expect(continueLearning(enrollment(), topics)).toEqual({
      moduleNumber: 1,
      lessonNumber: 2,
      moduleTitle: "Introduction to Design",
      lessonTitle: "Color & typography",
      percentage: 30,
      trackComplete: false,
      href: "/student/my-learning/module/t1",
      thumbnail: "https://img.youtube.com/vi/abc123/mqdefault.jpg",
    });
  });

  it("falls back to the current module when there's no current lesson", () => {
    const result = continueLearning(
      enrollment({ currentTopic: { id: "t2", title: "Design systems" }, currentLesson: null }),
      topics
    );

    expect(result).toMatchObject({ moduleNumber: 2, lessonNumber: null, thumbnail: null });
  });

  it("is empty until the student has completed a lesson", () => {
    expect(
      continueLearning(
        enrollment({ progress: { completedLessons: 0, totalLessons: 10, percentage: 0 } }),
        topics
      )
    ).toBeNull();
  });

  it("is empty when the current module isn't in the curriculum", () => {
    expect(
      continueLearning(
        enrollment({ currentTopic: { id: "gone", title: "Gone" }, currentLesson: null }),
        topics
      )
    ).toBeNull();
  });
});

describe("upcomingDeadlines", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");
  const submission = (assignmentId: string, status: StudentSubmission["status"]) =>
    ({ id: `s-${assignmentId}`, assignmentId, status }) as StudentSubmission;
  const task = (id: string, dueDate: string, status: WeeklyTask["status"]) =>
    ({ id, title: `Task ${id}`, dueDate, status }) as WeeklyTask;

  it("lists open work soonest first, with its state and link", () => {
    const deadlines = upcomingDeadlines(
      topics,
      [submission("a2", "DRAFT"), submission("a3", "SUBMITTED")],
      [task("w1", "2026-10-18T09:00:00.000Z", "PENDING")],
      { now, limit: 10 }
    );

    expect(deadlines.map((item) => [item.key, item.kind, item.state, item.href])).toEqual([
      ["assignment-a1", "Assignment", "dueToday", "/student/assignments/a1"],
      ["assignment-a2", "Assignment", "inProgress", "/student/assignments/a2"],
      ["task-w1", "Weekly task", "notStarted", null],
      ["assignment-a4", "Assignment", "notStarted", "/student/assignments/a4"],
    ]);
  });

  it("keeps only the first few", () => {
    expect(upcomingDeadlines(topics, [], [], { now })).toHaveLength(3);
  });

  it("leaves out locked modules and finished weekly tasks", () => {
    const locked = topics.map((topic) => ({ ...topic, lock: undefined }));

    expect(
      upcomingDeadlines(locked, [], [task("w2", "2026-10-18T09:00:00.000Z", "SUBMITTED")], {
        now,
      })
    ).toEqual([]);
  });
});

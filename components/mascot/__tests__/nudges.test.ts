import { describe, expect, it } from "vitest";

import type { ControlTowerWeek } from "@/lib/control-tower";
import type { TrackProgress } from "@/lib/student";
import type { StudentSubmission } from "@/lib/student-assignments";
import type { ContinueLearning, Deadline } from "@/lib/student-dashboard";
import type { LiveSession } from "@/lib/live-sessions";
import type { CurriculumTopic } from "@/lib/student-lessons";
import { growthFromLessons, lessonsToNextStage, stageFromLessons } from "../growth";
import { buildNudges, nudgeKind } from "../nudges";

// A Wednesday.
const now = new Date("2026-10-14T09:00:00.000Z");

const enrollment = {
  track: { id: "t", name: "Design", description: "" },
} as TrackProgress;

const current: ContinueLearning = {
  moduleNumber: 2,
  lessonNumber: 1,
  moduleTitle: "Design systems",
  lessonTitle: "Buttons",
  percentage: 30,
  trackComplete: false,
  href: "/student/my-learning/module/t2",
  thumbnail: null,
};

function deadline(key: string, dueAt: string, state: Deadline["state"]): Deadline {
  return {
    key,
    title: `Task ${key}`,
    kind: "Assignment",
    dueAt,
    state,
    href: `/student/assignments/${key}`,
  };
}

function submission(id: string, changes: Partial<StudentSubmission>): StudentSubmission {
  return {
    id,
    assignmentId: `a-${id}`,
    assignment: { id: `a-${id}`, title: `Work ${id}` },
    ...changes,
  } as StudentSubmission;
}

const week = (weekEnd: string, status?: "DRAFT" | "SUBMITTED"): ControlTowerWeek => ({
  number: 3,
  weekStart: "2026-10-12T00:00:00.000Z",
  weekEnd,
  metric: status ? ({ status } as ControlTowerWeek["metric"]) : undefined,
});

const base = { now, enrollment, current, deadlines: [], submissions: [], variant: 0 };

describe("buildNudges", () => {
  it("falls back to resuming the current lesson", () => {
    const [first, ...rest] = buildNudges(base);
    expect(first.message).toBe("Pick up where you stopped: Buttons.");
    expect(first.action).toEqual({ label: "Resume", href: current.href });
    expect(first.urgent).toBe(false);
    expect(rest).toHaveLength(0);
  });

  it("puts work due today first and counts it", () => {
    const nudges = buildNudges({
      ...base,
      deadlines: [
        deadline("a", "2026-10-14T17:00:00.000Z", "dueToday"),
        deadline("b", "2026-10-14T20:00:00.000Z", "dueToday"),
        deadline("c", "2026-10-15T20:00:00.000Z", "notStarted"),
      ],
    });
    expect(nudges[0].message).toBe("2 things are due today. Start with “Task a”.");
    expect(nudges[0].urgent).toBe(true);
    expect(nudges[0].target).toBe("deadlines");
    expect(nudges.map(nudgeKind)).toEqual(["due-today", "due-soon", "resume"]);
    expect(nudges[1].message).toBe("“Task c” is due tomorrow.");
    expect(nudges.at(-1)?.id).toBe(`resume-${current.href}`);
  });

  it("leaves distant deadlines out", () => {
    const nudges = buildNudges({
      ...base,
      deadlines: [deadline("far", "2026-10-25T09:00:00.000Z", "notStarted")],
    });
    expect(nudges).toHaveLength(1);
  });

  it("flags requested changes and fresh feedback, not old feedback", () => {
    const nudges = buildNudges({
      ...base,
      submissions: [
        submission("old", { status: "GRADED", reviewedAt: "2026-10-01T09:00:00.000Z" }),
        submission("new", { status: "REVIEWED", reviewedAt: "2026-10-13T09:00:00.000Z" }),
        submission("fix", { status: "CHANGES_REQUESTED" }),
      ],
    });
    expect(nudges.map((item) => item.id)).toEqual([
      "changes-fix",
      "feedback-new",
      `resume-${current.href}`,
    ]);
  });

  it("only presses on Control Tower when the week is closing and unfinished", () => {
    const open = buildNudges({ ...base, controlTowerWeek: week("2026-10-18T23:59:59.999Z") });
    expect(open[0].urgent).toBe(false);

    const closing = buildNudges({
      ...base,
      now: new Date("2026-10-17T09:00:00.000Z"),
      controlTowerWeek: week("2026-10-18T23:59:59.999Z", "DRAFT"),
    });
    expect(closing[0].message).toBe("This week’s Control Tower closes in 2 days.");
    expect(closing[0].urgent).toBe(true);

    const done = buildNudges({
      ...base,
      controlTowerWeek: week("2026-10-18T23:59:59.999Z", "SUBMITTED"),
    });
    expect(done.some((item) => item.id.startsWith("control-tower"))).toBe(false);
  });

  it("welcomes the student back after a real gap, behind anything pressing", () => {
    expect(buildNudges({ ...base, daysAway: 3 })[0].id).toBe(`resume-${current.href}`);

    const calm = buildNudges({
      ...base,
      daysAway: 6,
      deadlines: [deadline("c", "2026-10-15T20:00:00.000Z", "notStarted")],
    });
    expect(calm.map((item) => item.id)).toEqual(["welcome-back", "due-soon-c"]);
    expect(calm[0].message).toBe("6 sunrises since you were last here. I kept your spot.");
    expect(calm[0].action?.href).toBe(current.href);

    const pressing = buildNudges({
      ...base,
      daysAway: 20,
      deadlines: [deadline("a", "2026-10-14T17:00:00.000Z", "dueToday")],
    });
    expect(pressing.map((item) => item.id)).toEqual(["due-today-a", "welcome-back"]);
  });

  it("sends the student to an unwatched lesson before its assignment", () => {
    const open = { instructorUnlocked: true, unlocked: true, completed: false };
    const topics = [
      {
        id: "t1",
        title: "Design",
        lock: open,
        lessons: [
          {
            id: "l1",
            title: "Colour",
            lock: open,
            assignments: [{ id: "a", title: "Task assignment-a", publishStatus: "PUBLISHED" }],
          },
        ],
      },
    ] as unknown as CurriculumTopic[];
    const due = deadline("assignment-a", "2026-10-14T17:00:00.000Z", "dueToday");

    const [first] = buildNudges({ ...base, topics, deadlines: [due] });
    expect(first.message).toBe(
      "“Task assignment-a” is due today. Watch “Colour” first, it’s what the assignment is on."
    );
    expect(first.action).toEqual({
      label: "Watch the lesson",
      href: "/student/my-learning/lesson/l1",
    });

    topics[0].lessons[0].lock = { ...open, completed: true };
    expect(buildNudges({ ...base, topics, deadlines: [due] })[0].action?.label).toBe("Open it");
  });

  it("says which comes first when a deadline and requested changes meet", () => {
    const [first, second] = buildNudges({
      ...base,
      deadlines: [deadline("a", "2026-10-14T17:00:00.000Z", "dueToday")],
      submissions: [submission("fix", { status: "CHANGES_REQUESTED" })],
    });
    expect(first.message).toBe(
      "“Task a” is due today, so do that first. The changes on “Work fix” can follow."
    );
    expect(second.id).toBe("changes-fix");
  });

  it("notices a clear week", () => {
    const [only] = buildNudges({
      ...base,
      controlTowerWeek: week("2026-10-18T23:59:59.999Z", "SUBMITTED"),
    });
    expect(only.message).toBe(
      "You’re clear for the week. A good moment to get ahead with Buttons."
    );
    expect(nudgeKind(only)).toBe("clear-week");
  });

  it("varies its wording from day to day, never within one", () => {
    const worded = (variant: number) => buildNudges({ ...base, variant })[0].message;
    expect(worded(1)).toBe("Buttons is waiting where you left it.");
    expect(worded(3)).toBe(worded(0));

    const monday = buildNudges({ ...base, variant: undefined })[0].message;
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    expect(buildNudges({ ...base, variant: undefined, now: later })[0].message).toBe(monday);
  });

  describe("live classes", () => {
    const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();
    const session = (id: string, startsIn: number, status: LiveSession["status"] = "upcoming") =>
      ({ id, title: `Class ${id}`, status, startsAt: at(startsIn), endsAt: at(startsIn + 60) }) as LiveSession;
    const dueToday = [deadline("d1", "2026-10-14T20:00:00.000Z", "dueToday")];

    it("counts down to a class 15 minutes out, ahead of everything else", () => {
      const [top] = buildNudges({ ...base, deadlines: dueToday, liveSessions: [session("s1", 15)] });
      expect(top).toMatchObject({
        id: "live-soon-s1",
        urgent: true,
        message: "“Class s1” starts in 15 minutes. Check your mic and camera while you wait.",
        action: { label: "Check your setup", href: "/student/live/s1" },
      });
    });

    it("says when a class is live, and offers to join", () => {
      const [top] = buildNudges({ ...base, liveSessions: [session("s2", -5, "live")] });
      expect(top).toMatchObject({ id: "live-now-s2", urgent: true, action: { label: "Join now", href: "/student/live/s2" } });
    });

    it("mentions a class later today calmly, behind anything pressing", () => {
      const nudges = buildNudges({ ...base, deadlines: dueToday, liveSessions: [session("s3", 5 * 60)] });
      expect(nudges[0].id).toBe("due-today-d1");
      expect(nudges[1]).toMatchObject({ id: "live-today-s3", urgent: false });
      expect(nudges[1].message).toMatch(/^“Class s3” is at \d{1,2}:\d{2} [AP]M today\.$/);
    });

    it("says nothing about classes that are over or days away", () => {
      const nudges = buildNudges({
        ...base,
        liveSessions: [session("old", -120, "completed"), session("later", 3 * 24 * 60)],
      });
      expect(nudges.some((nudge) => nudge.id.startsWith("live-"))).toBe(false);
    });
  });

  it("always has something to say", () => {
    expect(buildNudges({ deadlines: [], submissions: [], current: null })).toHaveLength(1);
    expect(
      buildNudges({ deadlines: [], submissions: [], current: null, notEnrolled: true })[0].id
    ).toBe("not-enrolled");
    expect(buildNudges({ ...base, current: null })[0].id).toBe("first-module");
  });
});

describe("lessonsToNextStage", () => {
  it("counts lessons up to the next stage's share of the track", () => {
    // On 12 lessons the stages start at lessons 1, 2, 4, 6, 9 and 11.
    expect(lessonsToNextStage(0, 12)).toBe(1);
    expect(lessonsToNextStage(3, 12)).toBe(1);
    expect(lessonsToNextStage(6, 12)).toBe(3);
    expect(lessonsToNextStage(10, 12)).toBe(1);
    expect(lessonsToNextStage(11, 12)).toBe(0);
    expect(lessonsToNextStage(12, 12)).toBe(0);
  });

  it("isn't thrown off by float rounding at a stage's edge", () => {
    // 20 × 0.15 is 3.0000000000000004, which must still read as lesson 3.
    expect(lessonsToNextStage(2, 20)).toBe(1);
    expect(stageFromLessons(3, 20)).toBe(2);
  });
});

describe("growth", () => {
  it("comes quickly at first and blooms a few lessons before the end", () => {
    expect(stageFromLessons(1, 20)).toBe(1);
    expect(stageFromLessons(3, 12)).toBe(2);
    expect(stageFromLessons(9, 12)).toBe(5);
    expect(stageFromLessons(11, 12)).toBe(6);
    expect(growthFromLessons(11, 12)).toBe(6);
    expect(growthFromLessons(12, 12)).toBe(6);
    expect(growthFromLessons(0, 0)).toBe(0);
  });

  it("grows only a little between stages, saving the change for the stage", () => {
    expect(growthFromLessons(0, 12)).toBe(0);
    // A quarter of the way between Seedling and Growing at most.
    expect(growthFromLessons(3, 12)).toBeCloseTo(2 + (0.1 / 0.15) * 0.25);
    expect(growthFromLessons(3, 12)).toBeLessThan(2.25);
    expect(Math.floor(growthFromLessons(4, 12))).toBe(3);
  });
});

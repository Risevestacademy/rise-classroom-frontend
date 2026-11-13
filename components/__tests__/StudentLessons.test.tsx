import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import LessonsPage from "@/app/student/my-learning/page";
import LessonPage from "@/app/student/my-learning/lesson/[lessonId]/page";
import ModulePage from "@/app/student/my-learning/module/[moduleId]/page";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const params = vi.hoisted(() => ({ lessonId: "l1", moduleId: "t1" }));

vi.mock("next/navigation", () => ({
  useParams: () => params,
}));

function lock(unlocked: boolean, completed = false) {
  return { instructorUnlocked: unlocked, unlocked, completed };
}

function unlockedLesson(id: string, title: string, completed: boolean) {
  return {
    id,
    topicId: "t1",
    title,
    position: Number(id.slice(1)),
    lock: lock(true, completed),
    counts: { assignments: 0, resources: 1 },
    resources: [],
    assignments: [],
    recordings: [
      { id: `r-${id}`, lessonId: id, title: "Class recording", url: "https://youtu.be/abc" },
    ],
  };
}

/* A locked lesson comes with only its title, position and counts. */
const lockedLesson = {
  id: "l3",
  title: "Colour",
  position: 3,
  publishStatus: "PUBLISHED",
  counts: { assignments: 0, resources: 0 },
};

function content(l1Completed = false) {
  return envelope([
    {
      id: "c1",
      trackId: "track-1",
      title: "Product Design",
      status: "ONGOING",
      cohort: { id: "co1", name: "Cohort 2026" },
      topics: [
        {
          id: "t1",
          curriculumId: "c1",
          title: "Visual design",
          description: "How layout guides the eye.",
          outcomes: ["Use a grid", "Pair typefaces"],
          position: 0,
          lock: lock(true),
          lessons: [
            unlockedLesson("l1", "Grids", l1Completed),
            unlockedLesson("l2", "Type", true),
            lockedLesson,
          ],
        },
        {
          id: "t2",
          title: "Prototyping",
          position: 1,
          counts: { lessons: 2, resources: 0, assignments: 0 },
          lessons: [],
        },
      ],
    },
  ]);
}

const progress = envelope([
  {
    enrollmentId: "e1",
    status: "ENROLLED",
    track: { id: "track-1", name: "Product Design", description: "" },
    progress: { completedLessons: 1, totalLessons: 3, percentage: 33 },
    currentTopic: { id: "t1", title: "Visual design" },
    currentLesson: { id: "l1", title: "Grids" },
    trackComplete: false,
  },
]);

describe("student lessons", () => {
  it("lists modules with what each one includes", async () => {
    mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": content(),
    });
    renderWithClient(<LessonsPage />);

    expect(await screen.findByText("01. Visual design")).toBeInTheDocument();
    expect(
      screen.getByText("Product Design · Cohort 2026 · 2 modules"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 live class recordings")).toBeInTheDocument();
    expect(screen.getByText("3 lessons")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View module" })).toHaveAttribute(
      "href",
      "/student/my-learning/module/t1",
    );
    expect(screen.getByText("02. Prototyping")).toBeInTheDocument();
    expect(screen.getByLabelText("Locked")).toBeInTheDocument();
  });

  it("shows a module's outcomes and lessons, with locked lessons not linked", async () => {
    mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": content(),
    });
    renderWithClient(<ModulePage />);

    expect(await screen.findByRole("heading", { name: "Visual design" })).toBeInTheDocument();
    expect(screen.getByText("Use a grid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Live Class 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grids" })).toHaveAttribute(
      "href",
      "/student/my-learning/lesson/l1",
    );
    expect(screen.getByText("Colour")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Colour" })).not.toBeInTheDocument();
  });

  it("says when a module is locked", async () => {
    params.moduleId = "t2";
    mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": content(),
    });
    renderWithClient(<ModulePage />);

    expect(await screen.findByText("This module is locked")).toBeInTheDocument();
    params.moduleId = "t1";
  });

  it("explains a locked lesson instead of crashing", async () => {
    params.lessonId = "l3";
    mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": content(),
      "GET /student/enrollments/e1/lessons/l3": envelope(lockedLesson),
    });
    renderWithClient(<LessonPage />);

    expect(await screen.findByText("This lesson is locked")).toBeInTheDocument();
    params.lessonId = "l1";
  });

  it("marks a lesson as completed through its module", async () => {
    let completed = false;
    const api = mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": () => content(completed),
      "GET /student/enrollments/e1/lessons/l1": () =>
        envelope(unlockedLesson("l1", "Grids", completed)),
      "PATCH /student/enrollments/e1/topics/t1/progress": () => {
        completed = true;
        return envelope({ id: "p1", itemType: "TOPIC", itemId: "t1", completed: false });
      },
    });
    const { user } = renderWithClient(<LessonPage />);

    await user.click(await screen.findByRole("button", { name: "Mark as completed" }));

    expect(api.bodies("PATCH /student/enrollments/e1/topics/t1/progress")).toEqual([
      { lessons: [{ id: "l1", completed: true }] },
    ]);
    expect(await screen.findByRole("button", { name: "Completed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

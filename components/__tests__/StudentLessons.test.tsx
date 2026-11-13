import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import LessonsPage from "@/app/student/my-learning/page";
import LessonPage from "@/app/student/my-learning/lesson/[lessonId]/page";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const params = vi.hoisted(() => ({ lessonId: "l1" }));

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
    recordings: [],
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
      topics: [
        {
          id: "t1",
          curriculumId: "c1",
          title: "Visual design",
          position: 0,
          lock: lock(true),
          lessons: [
            unlockedLesson("l1", "Grids", l1Completed),
            unlockedLesson("l2", "Type", true),
            lockedLesson,
          ],
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
  it("lists locked lessons and counts watched ones from their lock", async () => {
    mockApi({
      "GET /student/me/progress": progress,
      "GET /student/enrollments/e1/content": content(),
    });
    renderWithClient(<LessonsPage />);

    expect(await screen.findByText("1 of 3 watched")).toBeInTheDocument();
    expect(screen.getByText("Colour")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Grids/ })).toHaveAttribute(
      "href",
      "/student/my-learning/lesson/l1",
    );
    expect(screen.queryByRole("link", { name: /Colour/ })).not.toBeInTheDocument();
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

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";

import StudentAssignmentsPage from "@/app/student/assignments/page";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const future = "2099-01-15T17:00:00.000Z";
const past = "2020-01-15T17:00:00.000Z";

function page(items: unknown[]) {
  return envelope({ items, page: 1, limit: 100, total: items.length, totalPages: 1 });
}

/* A locked lesson comes with only its title, position and counts. */
function lockedLesson(id: string, title: string) {
  return {
    id,
    title,
    position: Number(id.slice(1)),
    publishStatus: "PUBLISHED",
    counts: { assignments: 1, resources: 0 },
  };
}

function assignment(id: string, title: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    lessonId: "l1",
    title,
    dueAt: future,
    submissionType: "LINK",
    publishStatus: "PUBLISHED",
    ...overrides,
  };
}

/* One track with two lessons: lesson 1 unlocked with its assignments, lesson 2 still locked. */
function routes({
  assignments = [] as unknown[],
  topicAssignments = [] as unknown[],
  submissions = [] as unknown[],
} = {}) {
  return {
    "GET /student/weekly-tasks": page([]),
    "GET /student/me/progress": envelope([{ enrollmentId: "e1" }]),
    "GET /student/enrollments/e1/submissions": page(submissions),
    "GET /student/enrollments/e1/content": envelope([
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
            lock: { instructorUnlocked: true, unlocked: true, completed: false },
            assignments: topicAssignments,
            resources: [],
            lessons: [
              {
                id: "l1",
                topicId: "t1",
                title: "Grids",
                position: 1,
                lock: { instructorUnlocked: true, unlocked: true, completed: false },
                resources: [],
                recordings: [],
                assignments,
              },
              lockedLesson("l2", "Type"),
            ],
          },
        ],
      },
    ]),
  };
}

async function renderPage(tab: string | undefined, api: Parameters<typeof mockApi>[0]) {
  const mocked = mockApi(api);
  const searchParams = Promise.resolve({ tab });
  await act(async () => {
    renderWithClient(
      <React.Suspense>
        <StudentAssignmentsPage searchParams={searchParams} />
      </React.Suspense>,
    );
  });
  return mocked;
}

const rowFor = async (title: string) =>
  (await screen.findByRole("link", { name: title })).closest("tr")!;

describe("student assignments list", () => {
  it("lists assignments the student hasn't started under To do", async () => {
    await renderPage(undefined, routes({ assignments: [assignment("a1", "Grid study")] }));

    const row = await rowFor("Grid study");
    expect(within(row).getByText("Visual design · Grids")).toBeInTheDocument();
    expect(within(row).getByText("Link")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Grid study" })).toHaveAttribute(
      "href",
      "/student/assignments/a1",
    );
    expect(screen.getByText("1 assignment to do")).toBeInTheDocument();
  });

  it("reads assignments from the content, without a request per lesson", async () => {
    const api = await renderPage(undefined, routes({ assignments: [assignment("a1", "Grid study")] }));

    await rowFor("Grid study");
    expect(api.urls("GET /student/enrollments/e1/lessons/l1")).toEqual([]);
    expect(api.urls("GET /student/enrollments/e1/lessons/l2")).toEqual([]);
  });

  it("lists assignments on the whole module under the module's name", async () => {
    await renderPage(
      undefined,
      routes({
        topicAssignments: [assignment("a3", "Module project", { lessonId: null, topicId: "t1" })],
      }),
    );

    const row = await rowFor("Module project");
    expect(within(row).getByText("Visual design")).toBeInTheDocument();
  });

  it("shows a started assignment once, from its submission", async () => {
    await renderPage(
      undefined,
      routes({
        assignments: [assignment("a1", "Grid study")],
        submissions: [
          {
            id: "s1",
            assignmentId: "a1",
            enrollmentId: "e1",
            submissionType: "LINK",
            status: "DRAFT",
            updatedAt: "2026-10-01T10:00:00.000Z",
            assignment: { id: "a1", title: "Grid study", dueAt: future, submissionType: "LINK" },
          },
        ],
      }),
    );

    const row = await rowFor("Grid study");
    expect(screen.getAllByRole("link", { name: "Grid study" })).toHaveLength(1);
    /* The submission row now names the lesson too. */
    expect(within(row).getByText("Visual design · Grids")).toBeInTheDocument();
  });

  it("keeps unstarted assignments past their deadline out of To do", async () => {
    const api = routes({
      assignments: [
        assignment("a1", "Grid study"),
        assignment("a2", "Type scale", { dueAt: past }),
      ],
    });

    await renderPage(undefined, api);
    await rowFor("Grid study");
    expect(screen.queryByRole("link", { name: "Type scale" })).not.toBeInTheDocument();
  });

  it("lists past-deadline assignments under Missed, still openable", async () => {
    await renderPage(
      "missed",
      routes({
        assignments: [
          assignment("a1", "Grid study"),
          assignment("a2", "Type scale", { dueAt: past }),
        ],
      }),
    );

    const row = await rowFor("Type scale");
    expect(within(row).getByText("Missed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Grid study" })).not.toBeInTheDocument();
  });

  it("leaves out draft assignments", async () => {
    await renderPage(
      undefined,
      routes({
        assignments: [
          assignment("a1", "Grid study"),
          assignment("a2", "Unfinished brief", { publishStatus: "DRAFT" }),
        ],
      }),
    );

    await rowFor("Grid study");
    expect(screen.queryByRole("link", { name: "Unfinished brief" })).not.toBeInTheDocument();
  });

  it("shows the empty state when there's nothing at all", async () => {
    await renderPage(undefined, routes());

    expect(await screen.findByText("No assignments yet")).toBeInTheDocument();
  });
});

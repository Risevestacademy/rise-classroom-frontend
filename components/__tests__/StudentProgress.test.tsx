import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProgressTab } from "@/components/student-profile/ProgressTab";
import type {
  CurriculumModule,
  LessonRecord,
  TopicRecord,
} from "@/features/curriculum/types";
import type { AdminUser } from "@/lib/admin";
import { studentProgress, useOverallProgress } from "@/lib/student-profile";
import { curriculumTreeRoutes, envelope, mockApi, renderWithClient } from "@/test/utils";

const timestamps = {
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function module(
  id: string,
  lessonIds: string[],
  status: CurriculumModule["status"] = "PUBLISHED",
) {
  return {
    id,
    title: id,
    description: "",
    status,
    lessons: lessonIds.map((lessonId) => ({ id: lessonId })),
  } as CurriculumModule;
}

describe("studentProgress", () => {
  it("counts completed lessons in each published module", () => {
    const progress = studentProgress(
      [
        module("m1", ["l1", "l2", "l3", "l4"]),
        module("draft", ["l5"], "DRAFT"),
        module("m2", ["l6", "l7"]),
        module("m3", []),
      ],
      new Set(["l1", "l2", "l3", "l5", "l6"]),
    );

    expect(progress.overall).toBe(67);
    expect(
      progress.modules.map(({ label, progress, completed, total }) => [
        label,
        progress,
        completed,
        total,
      ]),
    ).toEqual([
      ["Module 1", 75, 3, 4],
      ["Module 2", 50, 1, 2],
      ["Module 3", null, 0, 0],
    ]);
  });

  it("lists modules without progress when it can't be read", () => {
    const progress = studentProgress([module("m1", ["l1"])]);

    expect(progress.overall).toBeNull();
    expect(progress.modules[0].progress).toBeNull();
  });
});

const topic = (id: string, title: string, position: number): TopicRecord => ({
  ...timestamps,
  id,
  curriculumId: "cur1",
  title,
  description: `${title} description`,
  position,
  publishStatus: "PUBLISHED",
  outcomes: [],
});

const lesson = (id: string, topicId: string, position: number) => ({
  ...(timestamps as Pick<LessonRecord, "createdAt" | "updatedAt">),
  id,
  topicId,
  title: id,
  position,
  resources: [],
  recordings: [],
});

const student = {
  id: "u1",
  name: "Ada Obi",
  firstName: "Ada",
  lastName: "Obi",
  email: "ada@example.com",
  role: "STUDENT",
  status: "ACTIVE",
  onboardingStatus: "COMPLETED",
  createdAt: "2026-09-01T00:00:00.000Z",
  studentProfile: [
    {
      cohort: { id: "c1", name: "Cohort 2026" },
      enrollment: [{ status: "ENROLLED", track: { id: "t1", name: "Design" } }],
    },
  ],
  mentor: {
    id: "m1",
    name: "Tunde Bello",
    firstName: "Tunde",
    lastName: "Bello",
    email: "tunde@example.com",
    status: "ACTIVE",
    mentorshipId: "ms1",
    assignedAt: "2026-09-01T00:00:00.000Z",
  },
} satisfies AdminUser;

function routes() {
  return mockApi({
    "GET /admin/users/m1/mentees": envelope([
      { user: { id: "u1" }, studentProfileId: "sp1" },
    ]),
    "GET /admin/curriculums": envelope([
      { id: "draft", publishStatus: "DRAFT" },
      { id: "cur1", publishStatus: "PUBLISHED" },
    ]),
    ...curriculumTreeRoutes("admin", "cur1", [
      {
        ...topic("tp1", "Design basics", 0),
        lessons: [lesson("l1", "tp1", 0), lesson("l2", "tp1", 1)],
      },
      {
        ...topic("tp2", "Figma", 1),
        lessons: [lesson("l3", "tp2", 0), lesson("l4", "tp2", 1)],
      },
    ]),
    "GET /admin/progress": envelope({
      items: [
        { lessonId: "l1", completed: true },
        { lessonId: "l2", completed: true },
        { lessonId: "l3", completed: true },
      ],
      page: 1,
      limit: 100,
      total: 3,
      totalPages: 1,
    }),
  });
}

describe("ProgressTab", () => {
  it("shows the student's progress through their track's curriculum", async () => {
    const api = routes();
    renderWithClient(
      <ProgressTab student={student} track="Design" cohort="Cohort 2026" />,
    );

    expect(await screen.findByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Design Track")).toBeInTheDocument();
    expect(screen.getAllByText("100%")).toHaveLength(2);
    expect(screen.getByText("2 of 2 learning items completed")).toBeInTheDocument();
    expect(api.urls("GET /admin/curriculums")[0].searchParams.get("trackId")).toBe("t1");
    expect(api.urls("GET /admin/progress")[0].searchParams.get("studentProfileId")).toBe(
      "sp1",
    );

    await userEvent.click(screen.getByRole("button", { name: /Module 2/ }));

    expect(screen.getByRole("heading", { name: "Figma" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 learning items completed")).toBeInTheDocument();
  });

  it("lists the modules without progress when the student has no mentor", async () => {
    routes();
    renderWithClient(
      <ProgressTab student={{ ...student, mentor: null }} track="Design" />,
    );

    expect(await screen.findAllByText("Design basics")).toHaveLength(2);
    expect(screen.queryByText(/learning items completed/)).not.toBeInTheDocument();
  });
});

function Progress({ ids }: { ids: string[] }) {
  const progress = useOverallProgress(
    ids.map((profileId) => ({ profileId, cohortId: "c1", trackId: "t1" })),
  );
  return (
    <ul>
      {ids.map((id) => (
        <li key={id}>{`${id}: ${progress.has(id) ? progress.get(id) : "loading"}`}</li>
      ))}
    </ul>
  );
}

describe("useOverallProgress", () => {
  it("works out each student's progress, loading shared curricula once", async () => {
    const api = mockApi({
      "GET /admin/curriculums": envelope([{ id: "cur1", publishStatus: "PUBLISHED" }]),
      ...curriculumTreeRoutes("admin", "cur1", [
        {
          ...topic("tp1", "Design basics", 0),
          lessons: [lesson("l1", "tp1", 0), lesson("l2", "tp1", 1)],
        },
      ]),
      "GET /admin/progress": (_body: unknown, url: URL) =>
        envelope({
          items:
            url.searchParams.get("studentProfileId") === "sp1"
              ? [{ lessonId: "l1", completed: true }]
              : [],
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        }),
    });
    renderWithClient(<Progress ids={["sp1", "sp2"]} />);

    expect(await screen.findByText("sp1: 50")).toBeInTheDocument();
    expect(await screen.findByText("sp2: 0")).toBeInTheDocument();
    expect(api.urls("GET /admin/curriculums")).toHaveLength(1);
    expect(api.urls("GET /admin/progress")).toHaveLength(2);
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import type { CurriculumRecord } from "@/features/curriculum/types";
import { makeTrack } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

/* The top nav brings the session along, which doesn't matter here. */
vi.mock("@/components/instructor-dashboard/InstructorNavbar", () => ({
  InstructorNavbar: () => null,
}));

const { default: InstructorCurriculumPage } = await import("@/app/instructor/curriculum/page");

function makeCurriculum(overrides: Partial<CurriculumRecord>): CurriculumRecord {
  return {
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    id: "c1",
    trackId: "track-1",
    cohortId: "cohort-1",
    title: "Product Design",
    description: "",
    status: "ONGOING",
    publishStatus: "PUBLISHED",
    progressMode: "SEQUENTIAL",
    totalModules: 4,
    totalLessons: 12,
    totalAssignments: 3,
    cohort: { id: "cohort-1", name: "Cohort 4" },
    assignedInstructors: [],
    ...overrides,
  };
}

function renderPage(curricula: CurriculumRecord[]) {
  mockApi({
    "GET /instructor/tracks": envelope([
      { id: "it-1", instructorId: "i1", trackId: "track-1", cohortId: "cohort-1", track: makeTrack({ name: "Design" }) },
    ]),
    "GET /instructor/curriculums": envelope(curricula),
    "GET /instructor/students": envelope([]),
  });
  return renderWithClient(
    <CurriculumScopeProvider role="instructor">
      <InstructorCurriculumPage />
    </CurriculumScopeProvider>,
  );
}

describe("instructor curriculum list", () => {
  const curricula = [
    makeCurriculum({}),
    makeCurriculum({ id: "c2", title: "UX Research", publishStatus: "DRAFT", status: "COMPLETED" }),
  ];

  it("lists every curriculum with a link to open it", async () => {
    renderPage(curricula);

    expect(await screen.findByRole("heading", { name: "Product Design" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UX Research" })).toBeInTheDocument();
    /* The design system's Button renders the link with role="button". */
    const links = screen.getAllByText("View curriculum").map((el) => el.closest("a"));
    expect(links.map((link) => link?.getAttribute("href"))).toEqual([
      "/instructor/curriculum/c1",
      "/instructor/curriculum/c2",
    ]);
  });

  it("shows each curriculum's status, track, cohort and totals", async () => {
    renderPage([curricula[1]]);

    await screen.findByRole("heading", { name: "UX Research" });
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Design · Cohort 4")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("filters by title", async () => {
    const { user } = renderPage(curricula);
    await screen.findByRole("heading", { name: "Product Design" });

    await user.type(screen.getByRole("searchbox", { name: "Search curriculum" }), "ux");

    expect(screen.queryByRole("heading", { name: "Product Design" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UX Research" })).toBeInTheDocument();
  });

  it("says when nothing matches the search", async () => {
    const { user } = renderPage(curricula);
    await screen.findByRole("heading", { name: "Product Design" });

    await user.type(screen.getByRole("searchbox", { name: "Search curriculum" }), "physics");

    expect(screen.getByText(/No curriculum matches/)).toBeInTheDocument();
  });

  it("explains when the instructor has no curriculum", async () => {
    renderPage([]);

    expect(await screen.findByText("No curriculum yet")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import ControlTowerPage from "@/app/student/control-tower/page";
import type { Goal, Kpi } from "@/lib/control-tower";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

/* Leafy stays quiet, so its tour doesn't open over the page. */
vi.mock("@/components/mascot/Companion", () => ({
  useCompanion: () => ({ planted: false, quiet: true, growth: 0 }),
  useCompanionCheer: () => () => {},
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const timestamps = {
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const kpi: Kpi = {
  ...timestamps,
  id: "k1",
  studentId: "p1",
  goalId: "g1",
  name: "Ship components",
  currentValue: "2",
  targetValue: "5",
  unit: "components",
  status: "IN_PROGRESS",
  progress: 40,
};

const standalone: Kpi = {
  ...timestamps,
  id: "k2",
  studentId: "p1",
  goalId: null,
  name: "Practise for hours",
  currentValue: "10",
  targetValue: "10",
  unit: "hours",
  status: "ACHIEVED",
  progress: 100,
};

const goal: Goal = {
  ...timestamps,
  id: "g1",
  studentId: "p1",
  title: "Build a design system",
  longTermGoal: "Join a product team",
  status: "ACTIVE",
  kpis: [kpi],
};

/* As the API sends it: goal KPIs nested in their goal, standalone ones in `kpis`. */
function tower(goals: Goal[], kpis: Kpi[]) {
  return envelope({
    student: {
      id: "p1",
      userId: "u1",
      cohortId: "c1",
      user: { id: "u1", name: "Ada Obi", email: "ada@example.com" },
      cohort: { id: "c1", name: "Cohort 4" },
    },
    mentor: null,
    goals,
    kpis: {
      summary: {
        totalCount: kpis.length,
        achievedCount: 0,
        inProgressCount: kpis.length,
        behindCount: 0,
        missedCount: 0,
        achievementRate: 0,
      },
      items: kpis,
    },
    recentWeeklyMetrics: [],
  });
}

function renderPage(
  routes: Record<string, unknown> = {},
  { goals = [goal], kpis = [standalone] }: { goals?: Goal[]; kpis?: Kpi[] } = {},
) {
  const api = mockApi({
    "GET /control-tower/student": tower(goals, kpis),
    "GET /weekly-metrics/student/p1": envelope([]),
    ...routes,
  });
  return { ...renderWithClient(<ControlTowerPage />), api };
}

describe("student Control Tower goals and KPIs", () => {
  it("shows the student's goals with their KPIs and progress", async () => {
    renderPage();

    expect(await screen.findByText("Build a design system")).toBeInTheDocument();
    expect(screen.getByText("Long-term: Join a product team")).toBeInTheDocument();
    const row = screen.getByRole("button", { name: "Update Ship components" });
    expect(within(row).getByText("In progress")).toBeInTheDocument();
    expect(within(row).getByText("2 / 5 components")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 KPIs achieved · 0%")).toBeInTheDocument();
  });

  it("lists standalone KPIs in their own section, counted on their own", async () => {
    renderPage();

    const section = (await screen.findByRole("heading", { name: "Standalone KPIs" }))
      .closest("section")!;
    expect(
      within(section).getByRole("button", { name: "Update Practise for hours" }),
    ).toBeInTheDocument();
    expect(within(section).getByText("1 of 1 KPIs achieved · 100%")).toBeInTheDocument();
    expect(within(section).queryByText("Ship components")).not.toBeInTheDocument();
  });

  it("adds a standalone KPI with no goal", async () => {
    const { user, api } = renderPage({ "POST /kpis": envelope(standalone) }, { kpis: [] });

    await user.click(await screen.findByRole("button", { name: "Add a KPI" }));
    await user.type(
      screen.getByPlaceholderText("e.g. Ship components to the design library"),
      "Book interviews",
    );
    await user.click(screen.getByRole("button", { name: "Add KPI" }));

    await vi.waitFor(() =>
      expect(api.bodies("POST /kpis")).toEqual([
        {
          studentProfileId: "p1",
          name: "Book interviews",
          status: "NOT_STARTED",
          goalId: null,
        },
      ]),
    );
  });

  it("clears an emptied field with null rather than an empty string", async () => {
    const { user, api } = renderPage({ "PATCH /kpis/k1": envelope(kpi) });

    await user.click(await screen.findByRole("button", { name: "Update Ship components" }));
    const dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByDisplayValue("components"));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /kpis/k1")).toMatchObject([{ unit: null, targetValue: "5" }]),
    );
  });

  it("invites the student to set a first goal when they have none", async () => {
    const { user, api } = renderPage(
      { "POST /goals": envelope(goal) },
      { goals: [], kpis: [] },
    );

    await user.click(await screen.findByRole("button", { name: "Add a goal" }));
    await user.type(
      screen.getByPlaceholderText("e.g. Land a junior product design role"),
      "Get a design job",
    );
    await user.click(screen.getByRole("button", { name: "Add goal" }));

    await vi.waitFor(() =>
      expect(api.bodies("POST /goals")).toEqual([
        { studentProfileId: "p1", title: "Get a design job" },
      ]),
    );
  });

  it("adds a KPI to a goal", async () => {
    const { user, api } = renderPage({ "POST /kpis": envelope(kpi) });

    await user.click(await screen.findByRole("button", { name: "Add KPI" }));
    await user.type(
      screen.getByPlaceholderText("e.g. Ship components to the design library"),
      "Book interviews",
    );
    await user.type(screen.getByPlaceholderText("3"), "4");
    await user.click(screen.getByRole("button", { name: "Add KPI" }));

    await vi.waitFor(() =>
      expect(api.bodies("POST /kpis")).toEqual([
        {
          studentProfileId: "p1",
          name: "Book interviews",
          targetValue: "4",
          status: "NOT_STARTED",
          goalId: "g1",
        },
      ]),
    );
  });

  it("updates a KPI's current value without touching the week", async () => {
    const { user, api } = renderPage({ "PATCH /kpis/k1": envelope(kpi) });

    await user.click(await screen.findByRole("button", { name: "Update Ship components" }));
    const dialog = screen.getByRole("dialog");
    const current = within(dialog).getByDisplayValue("2");
    await user.clear(current);
    await user.type(current, "3");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /kpis/k1")).toMatchObject([{ currentValue: "3" }]),
    );
    expect(api.bodies("POST /weekly-metrics")).toEqual([]);
  });
});

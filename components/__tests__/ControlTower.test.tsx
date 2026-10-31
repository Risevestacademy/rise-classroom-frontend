import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act, screen, within } from "@testing-library/react";

import ControlTowerPage from "@/app/student/control-tower/page";
import { ControlTowerTab } from "@/components/student-profile/ControlTowerTab";
import { weekRangeFor, type Goal, type Kpi, type WeeklyMetric } from "@/lib/control-tower";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

/* The mentor pages' top nav needs the sidebar from their layout; it doesn't matter here. */
vi.mock("@/components/AppTopNav", () => ({ AppTopNav: () => null }));

const timestamps = {
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const student = {
  id: "p1",
  userId: "u1",
  cohortId: "c1",
  user: { id: "u1", name: "Ada Obi", email: "ada@example.com" },
  cohort: { id: "c1", name: "Cohort 4" },
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

const goal: Goal = {
  ...timestamps,
  id: "g1",
  studentId: "p1",
  title: "Build a design system",
  longTermGoal: "Join a product team",
  status: "ACTIVE",
  kpis: [kpi],
};

function metric(overrides: Partial<WeeklyMetric>): WeeklyMetric {
  const week = weekRangeFor();
  return {
    ...timestamps,
    id: "m1",
    studentId: "p1",
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    goalSummary: null,
    progress: null,
    challenges: null,
    priorities: null,
    mentorMeetingOutcome: null,
    mentorFeedback: null,
    status: "DRAFT",
    ...overrides,
  };
}

function tower(extra: Record<string, unknown> = {}) {
  return envelope({
    student,
    mentor: null,
    goals: [goal],
    kpis: {
      summary: {
        totalCount: 1,
        achievedCount: 0,
        inProgressCount: 1,
        behindCount: 0,
        missedCount: 0,
        achievementRate: 0,
      },
      items: [kpi],
    },
    recentWeeklyMetrics: [],
    ...extra,
  });
}

describe("student Control Tower", () => {
  function renderPage(metrics: WeeklyMetric[], routes: Record<string, unknown> = {}) {
    const api = mockApi({
      "GET /control-tower/student": tower(),
      "GET /weekly-metrics/student/p1": envelope(metrics),
      ...routes,
    });
    return { ...renderWithClient(<ControlTowerPage />), api };
  }

  it("asks what went well and what to do differently, and saves them under the API's names", async () => {
    const { user, api } = renderPage([], {
      "POST /weekly-metrics": (body: unknown) =>
        envelope(metric({ ...(body as object), id: "m1" })),
    });

    const wentWell = await screen.findByPlaceholderText(
      "Example: I finally understood how variants work in the design system",
    );
    expect(screen.queryByText("How are you progressing?")).not.toBeInTheDocument();
    expect(screen.queryByText("What didn't go well?")).not.toBeInTheDocument();

    await user.type(wentWell, "Variants clicked");
    await user.type(
      screen.getByPlaceholderText("Example: Ask my mentor for feedback earlier in the week"),
      "Ask earlier",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(api.bodies("POST /weekly-metrics")).toMatchObject([
        {
          whatWentWell: "Variants clicked",
          whatIWillDoDifferently: "Ask earlier",
          status: "DRAFT",
        },
      ]),
    );
    const [body] = api.bodies("POST /weekly-metrics") as Record<string, unknown>[];
    expect(body).not.toHaveProperty("progress");
    expect(body).not.toHaveProperty("challenges");
  });

  it("shows answers saved under the older field names", async () => {
    renderPage([metric({ progress: "Old went well", challenges: "Old differently" })]);

    expect(await screen.findByDisplayValue("Old went well")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old differently")).toBeInTheDocument();
  });

  it("shows the student's goals with their KPIs", async () => {
    renderPage([]);

    expect(await screen.findByText("Build a design system")).toBeInTheDocument();
    expect(screen.getByText("Long-term: Join a product team")).toBeInTheDocument();
    const row = screen.getByRole("button", { name: "Update Ship components" });
    expect(within(row).getByText("In progress")).toBeInTheDocument();
    expect(within(row).getByText("2 / 5 components")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 KPIs achieved · 0%")).toBeInTheDocument();
  });

  it("adds a KPI to a goal", async () => {
    const { user, api } = renderPage([], { "POST /kpis": envelope(kpi) });

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

  it("updates a KPI's current value", async () => {
    const { user, api } = renderPage([], { "PATCH /kpis/k1": envelope(kpi) });

    await user.click(await screen.findByRole("button", { name: "Update Ship components" }));
    const current = screen.getByDisplayValue("2");
    await user.clear(current);
    await user.type(current, "3");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /kpis/k1")).toMatchObject([{ currentValue: "3" }]),
    );
  });

  it("adds a goal", async () => {
    const { user, api } = renderPage([], { "POST /goals": envelope(goal) });

    await user.click(await screen.findByRole("button", { name: "Goal" }));
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
});

describe("admin student profile Control Tower tab", () => {
  it("loads the student's real check-ins and goals by profile id", async () => {
    const api = mockApi({
      "GET /control-tower/student": tower({
        timeline: [{ weekNumber: 6, weekStart: "", weekEnd: "", metricId: "m1" }],
      }),
      "GET /weekly-metrics/student/p1": envelope([
        metric({
          status: "SUBMITTED",
          priorities: "Finish the case study",
          whatWentWell: "Shipped the prototype",
        }),
      ]),
    });
    renderWithClient(
      <ControlTowerTab studentProfileId="p1" firstName="Ada" cohort="Cohort 4" />,
    );

    expect(await screen.findByText("Week 6 check-in")).toBeInTheDocument();
    expect(screen.getByText("Finish the case study")).toBeInTheDocument();
    expect(screen.getByText("Shipped the prototype")).toBeInTheDocument();
    expect(screen.getByText("Build a design system")).toBeInTheDocument();
    /* Admins only read the goals here. */
    expect(screen.queryByRole("button", { name: "Add KPI" })).not.toBeInTheDocument();
    expect(api.urls("GET /control-tower/student")[0].searchParams.get("studentProfileId")).toBe(
      "p1",
    );
  });

  it("explains when the student has no profile yet", () => {
    renderWithClient(<ControlTowerTab studentProfileId={undefined} firstName="Ada" />);

    expect(screen.getByText(/Ada isn't in a cohort yet/)).toBeInTheDocument();
  });
});

describe("mentor review", () => {
  /* A row from GET /mentors/my-mentees. */
  function mentee(id: string, name: string) {
    return {
      id: `mentorship-${id}`,
      mentorId: "mentor-1",
      studentId: id,
      active: true,
      assignedAt: "2026-09-01T00:00:00.000Z",
      student: {
        id,
        cohort: { id: "c1", name: "Cohort 4" },
        user: { id: `u-${id}`, name, email: `${id}@example.com` },
      },
    };
  }

  /* A mentee's own weeks, goals and KPIs, which the mentor pages read one student at a time. */
  function studentRoutes(id: string, weeks: WeeklyMetric[]) {
    return {
      [`GET /weekly-metrics/student/${id}`]: envelope(weeks),
      [`GET /goals/student/${id}`]: envelope([goal]),
      [`GET /kpis/student/${id}`]: envelope([kpi, { ...kpi, id: "k2", status: "ACHIEVED" }]),
    };
  }

  it("lists mentees with the ones waiting for review first", async () => {
    mockApi({
      "GET /mentors/my-mentees": envelope([
        mentee("p2", "Bayo Ade"),
        mentee("p1", "Ada Obi"),
        mentee("p3", "Chi Eze"),
      ]),
      ...studentRoutes("p2", [metric({ status: "REVIEWED" })]),
      ...studentRoutes("p1", [metric({ status: "SUBMITTED" })]),
      ...studentRoutes("p3", []),
    });
    const { default: MentorStudentsPage } = await import("@/app/mentor/students/page");
    renderWithClient(<MentorStudentsPage />);

    const links = await screen.findAllByRole("link", { name: /Obi|Ade|Eze/ });
    expect(links.map((link) => link.textContent)).toEqual(["Ada Obi", "Bayo Ade", "Chi Eze"]);
    expect(links[0]).toHaveAttribute("href", "/mentor/students/p1");
    expect(screen.getByText("Waiting for review")).toBeInTheDocument();
    expect(screen.getByText("No check-ins yet")).toBeInTheDocument();
    expect(await screen.findByText("1 check-in waiting for your review")).toBeInTheDocument();
    /* One of each mentee's two KPIs is achieved. */
    expect(await screen.findAllByText("50%")).toHaveLength(3);
  });

  it("never calls the Control Tower mentor endpoint, which answers mentors with 403", async () => {
    const api = mockApi({
      "GET /mentors/my-mentees": envelope([mentee("p1", "Ada Obi")]),
      ...studentRoutes("p1", []),
    });
    const { default: MentorStudentsPage } = await import("@/app/mentor/students/page");
    renderWithClient(<MentorStudentsPage />);

    expect(await screen.findByRole("link", { name: "Ada Obi" })).toBeInTheDocument();
    expect(api.urls("GET /control-tower/mentor")).toEqual([]);
  });

  async function renderMentee(week: Partial<WeeklyMetric>) {
    const reviews: unknown[] = [];
    mockApi({
      "GET /mentors/my-mentees": envelope([mentee("p1", "Ada Obi")]),
      ...studentRoutes("p1", [metric({ priorities: "Finish the case study", ...week })]),
      "PATCH /weekly-metrics/m1/review": (body: unknown) => {
        reviews.push(body);
        return envelope(metric({ ...week }));
      },
    });
    const { default: MenteePage } = await import(
      "@/app/mentor/students/[studentProfileId]/page"
    );
    /* The page reads its params with React.use, which suspends until act settles it. */
    let view!: ReturnType<typeof renderWithClient>;
    await act(async () => {
      view = renderWithClient(
        <React.Suspense fallback={null}>
          <MenteePage params={Promise.resolve({ studentProfileId: "p1" })} />
        </React.Suspense>,
      );
    });
    return { ...view, reviews };
  }

  it("adds meeting notes and feedback, then marks the week reviewed", async () => {
    const { user, reviews } = await renderMentee({ status: "SUBMITTED" });

    expect(await screen.findByText("Finish the case study")).toBeInTheDocument();
    /* Mentors see the mentee's goals and KPIs but can't change them. */
    expect(screen.getByText("Build a design system")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add KPI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Ship components" })).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/We broke Ada's portfolio goal/),
      "Split the goal into three case studies",
    );
    await user.type(
      screen.getByPlaceholderText("What they're doing well, and what to focus on next"),
      "Strong week",
    );
    await user.click(screen.getByRole("button", { name: "Mark as reviewed" }));

    await vi.waitFor(() =>
      expect(reviews).toEqual([
        {
          status: "REVIEWED",
          mentorMeetingOutcome: "Split the goal into three case studies",
          mentorFeedback: "Strong week",
        },
      ]),
    );
  });

  it("completes a reviewed week, keeping the notes", async () => {
    const { user, reviews } = await renderMentee({
      status: "REVIEWED",
      mentorMeetingOutcome: "Agreed next steps",
    });

    expect(await screen.findByDisplayValue("Agreed next steps")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save notes" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Mark as completed" }));

    await vi.waitFor(() =>
      expect(reviews).toEqual([
        { status: "COMPLETED", mentorMeetingOutcome: "Agreed next steps" },
      ]),
    );
  });

  it("waits for the student to submit before reviewing", async () => {
    await renderMentee({ status: "DRAFT" });

    expect(
      await screen.findByText("Ada hasn't submitted this week yet. You can review it once they do."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as reviewed" })).not.toBeInTheDocument();
  });
});

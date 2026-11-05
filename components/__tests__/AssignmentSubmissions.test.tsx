import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { AssignmentSheet, AssignmentsTab } from "@/features/curriculum/components/Assignments";
import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import type {
  AssignmentRecord,
  AssignmentSubmissionRecord,
  CurriculumRole,
  TopicRecord,
} from "@/features/curriculum/types";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const timestamps = {
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const topic: TopicRecord = {
  ...timestamps,
  id: "t1",
  curriculumId: "c1",
  title: "Visual design",
  description: "Layout and type",
  position: 0,
  publishStatus: "PUBLISHED",
  outcomes: [],
};

const assignment = {
  ...timestamps,
  id: "a1",
  topicId: "t1",
  lessonId: null,
  title: "Grid study",
  description: "Lay out a page on a grid",
  submissionType: "LINK",
  publishStatus: "PUBLISHED",
  attachments: [],
} as unknown as AssignmentRecord;

function submission(overrides: Partial<AssignmentSubmissionRecord>): AssignmentSubmissionRecord {
  return {
    ...timestamps,
    id: "s1",
    assignmentId: "a1",
    status: "SUBMITTED",
    submittedAt: "2026-09-10T14:30:00.000Z",
    isLate: false,
    grade: null,
    studentProfile: { id: "p1", user: { id: "u1", name: "Ada Obi", email: "ada@example.com" } },
    ...overrides,
  };
}

function page(items: AssignmentSubmissionRecord[]) {
  return envelope({ items, page: 1, limit: 100, total: items.length, totalPages: 1 });
}

/* One module with one assignment on it, plus the submissions reply. */
function routes(role: CurriculumRole, submissions: unknown) {
  return {
    [`GET /${role}/curriculums/c1/topics`]: envelope([topic]),
    [`GET /${role}/topics/t1/lessons`]: envelope([]),
    [`GET /${role}/topics/t1/resources`]: envelope([]),
    [`GET /${role}/topics/t1/assignments`]: envelope([assignment]),
    [`GET /${role}/assignments/a1/submissions`]: submissions,
  };
}

function renderAs(role: CurriculumRole, ui: React.ReactElement, submissions: unknown = page([])) {
  const api = mockApi(routes(role, submissions));
  const view = renderWithClient(
    <CurriculumScopeProvider role={role}>{ui}</CurriculumScopeProvider>,
  );
  return { ...view, api };
}

const sheet = <AssignmentSheet curriculumId="c1" assignmentId="a1" onClose={vi.fn()} />;

async function openSubmissions(user: ReturnType<typeof renderWithClient>["user"]) {
  await user.click(await screen.findByRole("tab", { name: "Submissions" }));
}

describe("assignment submissions for instructors", () => {
  it("lists each student's submission from the API", async () => {
    const { user } = renderAs(
      "instructor",
      sheet,
      page([
        submission({ status: "GRADED", grade: 85 }),
        submission({
          id: "s2",
          status: "SUBMITTED",
          isLate: true,
          studentProfile: { id: "p2", user: { id: "u2", name: "Bayo Ade", email: "bayo@example.com" } },
        }),
      ]),
    );

    await openSubmissions(user);

    const ada = (await screen.findByText("Ada Obi")).closest("tr")!;
    expect(within(ada).getByText("ada@example.com")).toBeInTheDocument();
    expect(within(ada).getByText("Graded")).toBeInTheDocument();
    expect(within(ada).getByText("85")).toBeInTheDocument();

    const bayo = screen.getByText("Bayo Ade").closest("tr")!;
    expect(within(bayo).getByText("Submitted")).toBeInTheDocument();
    expect(within(bayo).getByText("Late")).toBeInTheDocument();
    expect(within(bayo).getByText("--")).toBeInTheDocument();
  });

  it("says when nobody has submitted yet", async () => {
    const { user } = renderAs("instructor", sheet, page([]));

    await openSubmissions(user);

    expect(await screen.findByText("No submissions yet.")).toBeInTheDocument();
  });

  it("shows the error and loads again on Try again", async () => {
    const { user, api } = renderAs(
      "instructor",
      sheet,
      reply(500, { success: false, message: "Server is down" }),
    );

    await openSubmissions(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is down");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await vi.waitFor(() =>
      expect(api.urls("GET /instructor/assignments/a1/submissions")).toHaveLength(2),
    );
  });

  it("counts handed-in work in the assignments table, leaving drafts out", async () => {
    renderAs(
      "instructor",
      <AssignmentsTab curriculumId="c1" studentCount={12} onOpenAssignment={vi.fn()} />,
      page([
        submission({}),
        submission({ id: "s2", status: "GRADED" }),
        submission({ id: "s3", status: "DRAFT", submittedAt: null }),
      ]),
    );

    expect(await screen.findByRole("columnheader", { name: "Submissions" })).toBeInTheDocument();
    expect(await screen.findByText("2/12")).toBeInTheDocument();
  });
});

/* Opens Bayo's submission from the Submissions tab, with the detail and review routes mocked. */
async function openReview(detail: Record<string, unknown>) {
  const reviews: unknown[] = [];
  const api = mockApi({
    ...routes(
      "instructor",
      page([
        submission({
          id: "s2",
          studentProfile: { id: "p2", user: { id: "u2", name: "Bayo Ade", email: "bayo@example.com" } },
        }),
      ]),
    ),
    "GET /instructor/submissions/s2": envelope({
      ...timestamps,
      id: "s2",
      assignmentId: "a1",
      submissionType: "LINK",
      linkUrl: "https://figma.com/file/grid",
      status: "SUBMITTED",
      submittedAt: "2026-09-10T14:30:00.000Z",
      isLate: false,
      studentProfile: { id: "p2", user: { id: "u2", name: "Bayo Ade", email: "bayo@example.com" } },
      enrollment: { id: "e2", cohort: { id: "co1", name: "Cohort 4" } },
      ...detail,
    }),
    "POST /instructor/submissions/s2/review": (body: unknown) => {
      reviews.push(body);
      return envelope({ id: "s2" });
    },
  });
  const view = renderWithClient(
    <CurriculumScopeProvider role="instructor">{sheet}</CurriculumScopeProvider>,
  );
  await openSubmissions(view.user);
  await view.user.click(await screen.findByRole("button", { name: "Review" }));
  return { ...view, api, reviews };
}

describe("reviewing a submission", () => {
  it("opens over the sheet with the student's work", async () => {
    await openReview({});

    const dialog = await screen.findByRole("dialog", { name: "View submission" });
    expect(within(dialog).getByText("Grid study · Module 1 - Visual design")).toBeInTheDocument();
    expect(await within(dialog).findByText("https://figma.com/file/grid")).toBeInTheDocument();
    expect(within(dialog).getByText("bayo@example.com")).toBeInTheDocument();
  });

  it("publishes a score out of 100 with written feedback", async () => {
    const { user, reviews } = await openReview({});

    await user.type(await screen.findByPlaceholderText("e.g. 85"), "90");
    expect(screen.getByText("Maximum points: 100 · Draft score: 90/100")).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("What went well, and what to work on next"),
      "Clear grid, tighten the type scale",
    );
    await user.click(screen.getByRole("button", { name: "Publish grade" }));

    await vi.waitFor(() =>
      expect(reviews).toEqual([
        { status: "GRADED", grade: 90, feedback: "Clear grid, tighten the type scale" },
      ]),
    );
  });

  it("won't publish a score above the maximum", async () => {
    const { user } = await openReview({});

    await user.type(await screen.findByPlaceholderText("e.g. 85"), "120");

    expect(screen.getByText("Enter a whole number from 0 to 100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish grade" })).toBeDisabled();
  });

  /* PENDING-BACKEND: the API has no draft grades, so only the review status is sent. */
  it("saves a draft privately and marks the work as under review", async () => {
    const { user, reviews } = await openReview({});

    await user.type(await screen.findByPlaceholderText("e.g. 85"), "70");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(screen.getByText("Draft saved. Only instructors can see it.")).toBeInTheDocument();
    await vi.waitFor(() => expect(reviews).toEqual([{ status: "UNDER_REVIEW" }]));
  });

  it("sends the work back with a reason when changes are needed", async () => {
    const { user, reviews } = await openReview({ status: "UNDER_REVIEW" });

    await user.click(await screen.findByRole("button", { name: "Request changes instead" }));
    const send = screen.getByRole("button", { name: "Send to student" });
    expect(send).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("Explain what needs to change before you can grade it"),
      "Add the mobile layout",
    );
    await user.click(send);

    await vi.waitFor(() =>
      expect(reviews).toEqual([
        { status: "CHANGES_REQUESTED", changesRequestedReason: "Add the mobile layout" },
      ]),
    );
  });

  it("shows the published grade instead of the form", async () => {
    await openReview({ status: "GRADED", grade: 78, feedback: "Good start" });

    expect(await screen.findByText("78")).toBeInTheDocument();
    expect(screen.getByText("Good start")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish grade" })).not.toBeInTheDocument();
  });
});

describe("assignment submissions for admins", () => {
  /* The API has no admin submissions endpoint, so admins don't get the tab or the column. */
  it("has no Submissions tab", async () => {
    const { api } = renderAs("admin", sheet);

    expect(await screen.findByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Submissions" })).not.toBeInTheDocument();
    expect(api.urls("GET /admin/assignments/a1/submissions")).toEqual([]);
  });

  it("has no Submissions column", async () => {
    const { api } = renderAs(
      "admin",
      <AssignmentsTab curriculumId="c1" studentCount={12} onOpenAssignment={vi.fn()} />,
    );

    expect(await screen.findByRole("button", { name: "Grid study" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Submissions" })).not.toBeInTheDocument();
    expect(api.urls("GET /admin/assignments/a1/submissions")).toEqual([]);
  });
});

describe("changing an assignment's status", () => {
  it("shows a skeleton in the status column until the list shows the new status", async () => {
    let status = "DRAFT";
    let finishSave = () => {};
    mockApi({
      ...routes("admin", page([])),
      /* Each reload of the list reads the assignment's current status. */
      "GET /admin/topics/t1/assignments": () => envelope([{ ...assignment, publishStatus: status }]),
      /* Held open until the test lets the save finish. */
      "PATCH /admin/assignments/a1": (body: unknown) =>
        new Promise((resolve) => {
          finishSave = () => {
            status = (body as { publishStatus: string }).publishStatus;
            resolve(envelope({ ...assignment, publishStatus: status }));
          };
        }),
    });
    const { user } = renderWithClient(
      <CurriculumScopeProvider role="admin">
        <AssignmentsTab curriculumId="c1" studentCount={12} onOpenAssignment={vi.fn()} />
      </CurriculumScopeProvider>,
    );
    const row = (await screen.findByRole("button", { name: "Grid study" })).closest("tr")!;
    expect(within(row).getByText("Draft")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Grid study actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Publish" }));

    expect(within(row).getByRole("status", { name: "Updating Grid study status" })).toBeInTheDocument();
    expect(within(row).queryByText("Draft")).not.toBeInTheDocument();

    finishSave();

    expect(await within(row).findByText("Published")).toBeInTheDocument();
    expect(within(row).queryByRole("status")).not.toBeInTheDocument();
  });
});

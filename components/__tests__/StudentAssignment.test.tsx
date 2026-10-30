import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import StudentAssignmentPage from "@/app/student/assignments/[assignmentId]/page";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useParams: () => ({ assignmentId: "a1" }),
}));

const assignment = {
  id: "a1",
  lessonId: "l1",
  title: "Grid study",
  description: "Lay out a landing page on a 12-column grid",
  instructions: "Share a view-only Figma link",
  dueAt: "2099-01-15T17:00:00.000Z",
  submissionType: "LINK",
  attachments: ["https://example.com/briefs/grid-brief.pdf"],
};

function submission(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    assignmentId: "a1",
    enrollmentId: "e1",
    submissionType: "LINK",
    linkUrl: "https://figma.com/file/draft",
    status: "DRAFT",
    isLate: false,
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function renderPage(
  routes: Record<string, unknown>,
  current: unknown = null,
) {
  const api = mockApi({
    "GET /student/assignments/a1": envelope(assignment),
    "GET /student/assignments/a1/submission": envelope(current),
    ...routes,
  });
  return { ...renderWithClient(<StudentAssignmentPage />), api };
}

describe("student assignment page", () => {
  it("shows the brief with its instructions and resources", async () => {
    renderPage({});

    expect(await screen.findByRole("heading", { name: "Grid study" })).toBeInTheDocument();
    expect(screen.getByText("Share a view-only Figma link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /grid-brief\.pdf/ })).toHaveAttribute(
      "href",
      "https://example.com/briefs/grid-brief.pdf",
    );
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("saves a link as a draft, then submits it", async () => {
    const saved: unknown[] = [];
    const { user, api } = renderPage({
      "POST /student/assignments/a1/submission": (body: unknown) => {
        saved.push(body);
        return envelope(submission({ linkUrl: "https://figma.com/file/grid" }));
      },
      "POST /student/assignments/a1/submit": envelope(
        submission({ status: "SUBMITTED" }),
      ),
    });

    const input = await screen.findByPlaceholderText("https://");
    await user.type(input, "https://figma.com/file/grid");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await vi.waitFor(() =>
      expect(saved).toEqual([
        { submissionType: "LINK", linkUrl: "https://figma.com/file/grid" },
      ]),
    );

    await user.click(screen.getByRole("button", { name: "Submit assignment" }));
    await vi.waitFor(() =>
      expect(api.urls("POST /student/assignments/a1/submit")).toHaveLength(1),
    );
    /* Nothing changed since the draft was saved, so it isn't sent again. */
    expect(saved).toHaveLength(1);
  });

  it("won't submit a link that isn't a web address", async () => {
    const { user } = renderPage({});

    await user.type(await screen.findByPlaceholderText("https://"), "my figma file");

    expect(screen.getByText("Enter a full link, starting with https://")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit assignment" })).toBeDisabled();
  });

  it("shows handed-in work read-only while it's being reviewed", async () => {
    renderPage(
      {},
      submission({ status: "UNDER_REVIEW", submittedAt: "2026-10-02T09:00:00.000Z" }),
    );

    expect(await screen.findByText("Under review")).toBeInTheDocument();
    expect(screen.getByText("https://figma.com/file/draft")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit assignment" })).not.toBeInTheDocument();
  });

  it("shows the instructor's note and lets the student resubmit when changes are requested", async () => {
    renderPage(
      {},
      submission({
        status: "CHANGES_REQUESTED",
        changesRequestedReason: "Add the mobile layout",
      }),
    );

    expect(await screen.findByText("Your instructor asked for changes")).toBeInTheDocument();
    expect(screen.getByText("Add the mobile layout")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://")).toHaveValue("https://figma.com/file/draft");
    expect(screen.getByRole("button", { name: "Submit assignment" })).toBeEnabled();
  });

  it("shows the grade and feedback once graded", async () => {
    renderPage(
      {},
      submission({
        status: "GRADED",
        grade: 88,
        feedback: "Strong hierarchy",
        reviewer: { name: "Tolu Ade" },
      }),
    );

    expect(await screen.findByText("88")).toBeInTheDocument();
    expect(screen.getByText("Feedback from Tolu Ade")).toBeInTheDocument();
    expect(screen.getByText("Strong hierarchy")).toBeInTheDocument();
  });

  it("sends a file as a multipart upload", async () => {
    const bodies: unknown[] = [];
    mockApi({
      "GET /student/assignments/a1": envelope({ ...assignment, submissionType: "FILE_UPLOAD" }),
      "GET /student/assignments/a1/submission": envelope(null),
      "POST /student/assignments/a1/submission": (body: unknown) => {
        bodies.push(body);
        return envelope(submission({ submissionType: "FILE_UPLOAD" }));
      },
    });
    const { user, container } = renderWithClient(<StudentAssignmentPage />);

    await screen.findByText("Choose a file or drag & drop it here.");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(["%PDF"], "report.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await vi.waitFor(() => expect(bodies).toHaveLength(1));
    const form = bodies[0] as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("submissionType")).toBe("FILE_UPLOAD");
    expect((form.get("file") as File).name).toBe("report.pdf");
  });

  it("explains when the assignment can't be opened", async () => {
    mockApi({
      "GET /student/assignments/a1": reply(403, { success: false, message: "You are not enrolled on this track" }),
      "GET /student/assignments/a1/submission": envelope(null),
    });
    renderWithClient(<StudentAssignmentPage />);

    expect(await screen.findByText("This assignment isn't available")).toBeInTheDocument();
    expect(screen.getByText("You are not enrolled on this track")).toBeInTheDocument();
  });
});

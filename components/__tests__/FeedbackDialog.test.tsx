import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";

import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { FeedbackKind } from "@/lib/feedback";
import { renderWithClient } from "@/test/utils";

/* The API has no feedback endpoint yet, so the tests check what the form hands over. */
const { submitFeedback } = vi.hoisted(() => ({ submitFeedback: vi.fn() }));
vi.mock("@/lib/feedback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/feedback")>()),
  submitFeedback,
}));

beforeEach(() => {
  submitFeedback.mockReset().mockResolvedValue(undefined);
});

function renderDialog(kind: FeedbackKind | null) {
  const onOpenChange = vi.fn();
  const onSubmitted = vi.fn();
  const view = renderWithClient(
    <FeedbackDialog
      kind={kind}
      onOpenChange={onOpenChange}
      onSubmitted={onSubmitted}
    />,
  );
  return { ...view, onOpenChange, onSubmitted };
}

describe("FeedbackDialog", () => {
  it("renders nothing while closed", () => {
    renderDialog(null);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["problem", "Report a problem", "Submit"],
    ["improvement", "Suggest an improvement", "Submit feedback"],
    ["experience", "Share your experience", "Submit feedback"],
  ] as const)("shows the %s form", (kind, title, submitLabel) => {
    renderDialog(kind);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: submitLabel })).toBeDisabled();
  });

  describe("reporting a problem", () => {
    it("needs a topic and a message", async () => {
      const { user } = renderDialog("problem");
      const submit = screen.getByRole("button", { name: "Submit" });

      await user.click(screen.getByRole("button", { name: "Bug" }));
      expect(submit).toBeDisabled();

      await user.type(screen.getByPlaceholderText("Describe the problem"), "   ");
      expect(submit).toBeDisabled();

      await user.type(screen.getByPlaceholderText("Describe the problem"), "Page is blank");
      expect(submit).toBeEnabled();
    });

    it("clears the topic when its chip is picked again", async () => {
      const { user } = renderDialog("problem");
      const bug = screen.getByRole("button", { name: "Bug" });

      await user.click(bug);
      expect(bug).toHaveAttribute("aria-pressed", "true");
      await user.click(bug);
      expect(bug).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps one topic selected at a time", async () => {
      const { user } = renderDialog("problem");

      await user.click(screen.getByRole("button", { name: "Bug" }));
      await user.click(screen.getByRole("button", { name: "Access issue" }));

      expect(screen.getByRole("button", { name: "Bug" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: "Access issue" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("sends the trimmed report and reports success", async () => {
      const { user, onSubmitted } = renderDialog("problem");

      await user.click(screen.getByRole("button", { name: "Bug" }));
      await user.type(screen.getByPlaceholderText("Describe the problem"), "  Page is blank  ");
      await user.click(screen.getByRole("button", { name: "Submit" }));

      await vi.waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
      expect(submitFeedback).toHaveBeenCalledWith({
        kind: "problem",
        topic: "Bug",
        message: "Page is blank",
        rating: undefined,
        image: undefined,
      });
    });

    it("warns against sharing sensitive information", () => {
      renderDialog("problem");
      expect(
        screen.getByText("Please avoid sharing passwords or sensitive information."),
      ).toBeInTheDocument();
    });

    it("shows the error and stays open when sending fails", async () => {
      submitFeedback.mockRejectedValue(new Error("Feedback is down"));
      const { user, onSubmitted } = renderDialog("problem");

      await user.click(screen.getByRole("button", { name: "Bug" }));
      await user.type(screen.getByPlaceholderText("Describe the problem"), "Page is blank");
      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Feedback is down");
      expect(onSubmitted).not.toHaveBeenCalled();
    });
  });

  describe("suggesting an improvement", () => {
    it("offers its own topics", () => {
      renderDialog("improvement");
      expect(screen.getByRole("button", { name: "Feature request" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Bug" })).not.toBeInTheDocument();
    });
  });

  describe("sharing an experience", () => {
    it("needs only a rating", async () => {
      const { user } = renderDialog("experience");
      const submit = screen.getByRole("button", { name: "Submit feedback" });

      expect(submit).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "Good" }));
      expect(submit).toBeEnabled();
    });

    it("sends the rating with the optional topic and message", async () => {
      const { user, onSubmitted } = renderDialog("experience");

      await user.click(screen.getByRole("button", { name: "Excellent" }));
      await user.click(screen.getByRole("button", { name: "Mentorship" }));
      await user.type(
        screen.getByPlaceholderText("Tell us what's working for you and what isn't"),
        "Great mentors",
      );
      await user.click(screen.getByRole("button", { name: "Submit feedback" }));

      await vi.waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
      expect(submitFeedback).toHaveBeenCalledWith({
        kind: "experience",
        topic: "Mentorship",
        message: "Great mentors",
        rating: 5,
        image: undefined,
      });
    });

    it("has no screenshot field", () => {
      renderDialog("experience");
      expect(screen.queryByText("Add a screenshot or reference")).not.toBeInTheDocument();
    });
  });

  it("starts from an empty form each time it opens", async () => {
    const { user, client, rerender } = renderDialog("problem");
    await user.type(screen.getByPlaceholderText("Describe the problem"), "Draft");

    /* rerender drops the provider renderWithClient added, so it goes back in here. */
    const show = (kind: FeedbackKind) =>
      rerender(
        <QueryClientProvider client={client}>
          <FeedbackDialog kind={kind} onOpenChange={vi.fn()} onSubmitted={vi.fn()} />
        </QueryClientProvider>,
      );
    show("improvement");
    show("problem");

    expect(screen.getByPlaceholderText("Describe the problem")).toHaveValue("");
  });
});

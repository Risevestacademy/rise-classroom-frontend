import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LearningEngagement } from "@/components/settings/LearningEngagement";
import { QuestionBuilder } from "@/components/settings/QuestionBuilder";
import { SettingsProvider } from "@/components/settings/SettingsContext";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockReset();
});

/* The list sits beside the builder so a save can be seen landing in it. */
function renderBuilder(props: React.ComponentProps<typeof QuestionBuilder>) {
  const view = render(
    <SettingsProvider>
      <QuestionBuilder {...props} />
      <div data-testid="list">
        <LearningEngagement />
      </div>
    </SettingsProvider>,
  );
  return {
    ...view,
    user: userEvent.setup(),
    list: within(screen.getByTestId("list")),
  };
}

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  select: string,
  option: string,
) {
  await user.click(screen.getByRole("combobox", { name: select }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("QuestionBuilder", () => {
  it("won't save a question without a title and category", async () => {
    const { user, list } = renderBuilder({ mode: "add" });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Enter the question.")).toBeInTheDocument();
    expect(screen.getByText("Select a category.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(list.getByText("8")).toBeInTheDocument();
  });

  it("adds a long answer question to its category", async () => {
    const { user, list } = renderBuilder({ mode: "add" });

    await user.type(screen.getByLabelText("Question"), "What blocked you?");
    await pick(user, "Category", "Weekly Reflection");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(push).toHaveBeenCalledWith("/admin/settings/learning-engagement");
    expect(list.getByText("9")).toBeInTheDocument();
    expect(list.getByText("What blocked you?")).toBeInTheDocument();
    expect(list.getByText("4 Questions")).toBeInTheDocument();
  });

  it("adds a multiple choice question with its options", async () => {
    const { user, list } = renderBuilder({ mode: "add" });

    await user.type(screen.getByLabelText("Question"), "How was your week?");
    await pick(user, "Question type", "Multiple choice");
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Option 1"), "Good");
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.type(screen.getByLabelText("Option 2"), "Bad");
    await pick(user, "Category", "Weekly focus");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(list.getByText("How was your week?")).toBeInTheDocument();
    expect(list.getByText("Multiple choice")).toBeInTheDocument();
  });

  it("only shows the controls of the question being worked on", async () => {
    const { user } = renderBuilder({ mode: "add" });

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByLabelText("Question")).toHaveLength(2);
    expect(screen.getAllByRole("combobox", { name: "Category" })).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: 'Delete "Untitled question"' }),
    );
    expect(screen.getAllByLabelText("Question")).toHaveLength(1);
  });

  it("edits one question in place", async () => {
    const { user, list } = renderBuilder({ mode: "edit", questionId: "kpis" });

    const title = screen.getByLabelText("Question");
    expect(title).toHaveValue("Weekly KPIs");
    await user.clear(title);
    await user.type(title, "Weekly numbers");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(list.queryByText("Weekly KPIs")).not.toBeInTheDocument();
    expect(list.getByText("Weekly numbers")).toBeInTheDocument();
    expect(list.getByText("8")).toBeInTheDocument();
  });
});

describe("LearningEngagement", () => {
  it("deletes a question after confirming", async () => {
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <LearningEngagement />
      </SettingsProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: 'Actions for "Weekly KPIs"' }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Yes, Delete!" }));

    expect(screen.queryByText("Weekly KPIs")).not.toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    /* Weekly focus, and now Mentor Check-in too. */
    expect(screen.getAllByText("2 Questions")).toHaveLength(2);
  });
});

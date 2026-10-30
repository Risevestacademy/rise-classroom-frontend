import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { ModuleForm } from "@/features/curriculum/components/ModuleForm";
import type { Curriculum } from "@/features/curriculum/types";
import { renderWithClient } from "@/test/utils";

const curriculum = {
  id: "c1",
  title: "Product Design",
  description: "",
  track: { id: "track-1", name: "Design" },
  cohort: "Cohort 2026",
  status: "Active",
  totalModules: 2,
  totalLessons: 6,
  totalAssignments: 2,
  studentCount: 20,
  instructor: { name: "Grace Hopper", email: "grace@example.com" },
  liveClasses: [],
  publishStatus: "PUBLISHED",
  progressMode: "SEQUENTIAL",
  history: [],
} as unknown as Curriculum;

function renderForm(props: Partial<React.ComponentProps<typeof ModuleForm>> = {}) {
  const onSubmit = vi.fn();
  const view = renderWithClient(
    <ModuleForm
      heading="Add Module"
      curriculum={curriculum}
      moduleTitle="Module 3"
      moduleCaption="Added after the 2 existing modules."
      submitLabel="Create Module"
      pendingLabel="Creating…"
      isPending={false}
      cancelHref="/admin/curriculum/c1?tab=modules"
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { ...view, onSubmit };
}

const moduleDescription = () =>
  screen.getByPlaceholderText(/^Discover how product design/);

async function fillRequired(user: ReturnType<typeof renderWithClient>["user"]) {
  await user.type(screen.getByLabelText(/Module title/), "  Visual design ");
  await user.type(moduleDescription(), " The basics of layout ");
}

describe("ModuleForm", () => {
  it("needs a title and a description", async () => {
    const { user } = renderForm();
    const create = screen.getByRole("button", { name: "Create Module" });

    expect(create).toBeDisabled();
    await user.type(screen.getByLabelText(/Module title/), "Visual design");
    expect(create).toBeDisabled();
    await user.type(moduleDescription(), "   ");
    expect(create).toBeDisabled();
  });

  it("sends a trimmed draft, dropping empty outcomes, lessons and assignments", async () => {
    const { user, onSubmit } = renderForm();

    await fillRequired(user);
    await user.type(screen.getByLabelText("Outcome 2"), " Use a grid ");
    await user.type(screen.getByLabelText(/^Lesson title/), " Grids ");
    await user.click(screen.getByRole("button", { name: "Create Module" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const input = onSubmit.mock.calls[0][0];
    expect(input).toMatchObject({
      title: "Visual design",
      description: "The basics of layout",
      status: "DRAFT",
      outcomes: ["Use a grid"],
      recordingLink: "",
      resources: [],
      assignments: [],
    });
    expect(input.lessons).toHaveLength(1);
    expect(input.lessons[0]).toMatchObject({ title: "Grids", description: "" });
  });

  it("publishes straight away when draft is unticked", async () => {
    const { user, onSubmit } = renderForm();

    await fillRequired(user);
    await user.click(
      screen.getByRole("checkbox", { name: /Keep as draft/ })
    );
    await user.click(screen.getByRole("button", { name: "Create Module" }));

    expect(onSubmit.mock.calls[0][0].status).toBe("PUBLISHED");
  });

  it("adds and removes outcomes", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Add outcome" }));
    expect(screen.getByLabelText("Outcome 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove outcome 1" }));
    expect(screen.queryByLabelText("Outcome 4")).not.toBeInTheDocument();
  });

  it("shows the pending label and blocks a second submit", () => {
    renderForm({ isPending: true });

    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
  });

  /* The API has no file uploads, so resources are added as links. */
  describe("resource links", () => {
    const moduleLinkInput = () =>
      screen.getAllByPlaceholderText("https://drive.google.com/…")[0];
    const addLink = () => screen.getAllByRole("button", { name: "Add link" })[0];

    it("adds a link and sends it with the module", async () => {
      const { user, onSubmit } = renderForm();

      await fillRequired(user);
      await user.type(moduleLinkInput(), "https://drive.google.com/file/d/slides.pdf");
      await user.click(addLink());
      expect(screen.getByText("slides")).toBeInTheDocument();
      expect(moduleLinkInput()).toHaveValue("");

      await user.click(screen.getByRole("button", { name: "Create Module" }));
      expect(onSubmit.mock.calls[0][0].resources).toMatchObject([
        { name: "slides.pdf", url: "https://drive.google.com/file/d/slides.pdf" },
      ]);
    });

    it("adds a link with Enter", async () => {
      const { user } = renderForm();

      await user.type(moduleLinkInput(), "https://youtu.be/abc{Enter}");
      expect(screen.getByRole("link", { name: "https://youtu.be/abc" })).toBeInTheDocument();
    });

    it("rejects links that aren't https", async () => {
      const { user } = renderForm();

      await user.type(moduleLinkInput(), "drive.google.com/slides");
      await user.click(addLink());

      expect(screen.getByText("Paste a full link starting with https://")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Remove slides/ })).not.toBeInTheDocument();
    });

    it("rejects the same link twice", async () => {
      const { user } = renderForm();

      await user.type(moduleLinkInput(), "https://youtu.be/abc{Enter}");
      await user.type(moduleLinkInput(), "https://youtu.be/abc{Enter}");

      expect(screen.getByText("That link is already added.")).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: "https://youtu.be/abc" })).toHaveLength(1);
    });

    it("removes a link", async () => {
      const { user } = renderForm();

      await user.type(moduleLinkInput(), "https://youtu.be/abc{Enter}");
      await user.click(screen.getByRole("button", { name: "Remove abc" }));

      expect(screen.queryByRole("link", { name: "https://youtu.be/abc" })).not.toBeInTheDocument();
    });

    it("has no file upload", () => {
      renderForm();
      expect(screen.queryByRole("button", { name: /Upload file/ })).not.toBeInTheDocument();
    });
  });

  it("shows the save error", () => {
    renderForm({ errorMessage: "Module title already used" });

    expect(screen.getByText("Module title already used")).toBeInTheDocument();
  });
});

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

  describe("assignment due date", () => {
    type User = ReturnType<typeof renderWithClient>["user"];

    /* The picker opens on the current month, so tests pick a day in it. */
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), 20);
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-20`;

    async function addAssignment(user: User) {
      await fillRequired(user);
      await user.type(screen.getByLabelText(/^Assignment title/), " Grid study ");
    }

    async function pickDueDate(user: User, date: Date) {
      await user.click(screen.getByRole("button", { name: /^Due date/ }));
      await user.click(await screen.findByRole("button", { name: date.toDateString() }));
      await user.click(screen.getByRole("button", { name: "Apply" }));
    }

    async function choose(user: User, label: RegExp, option: string) {
      await user.click(screen.getByRole("combobox", { name: label }));
      await user.click(await screen.findByRole("option", { name: option }));
    }

    let onSubmit: ReturnType<typeof renderForm>["onSubmit"];

    /* The first assignment in the saved module. */
    const submitted = () => onSubmit.mock.calls[0][0].assignments[0];

    function render(props: Partial<React.ComponentProps<typeof ModuleForm>> = {}) {
      const view = renderForm(props);
      onSubmit = view.onSubmit;
      return view;
    }

    it("sends no due date when none is picked", async () => {
      const { user } = render();

      await addAssignment(user);
      await user.click(screen.getByRole("button", { name: "Create Module" }));

      expect(submitted()).toMatchObject({
        title: "Grid study",
        dueAt: null,
        submissionType: "FILE_UPLOAD",
      });
    });

    it("defaults the time to 11:59 PM once a date is picked", async () => {
      const { user } = render();
      const time = screen.getByRole("combobox", { name: "Due time" });

      expect(time).toHaveAttribute("data-disabled");
      await addAssignment(user);
      await pickDueDate(user, day);

      expect(time).not.toHaveAttribute("data-disabled");
      expect(time).toHaveTextContent("11:59PM");
      await user.click(screen.getByRole("button", { name: "Create Module" }));
      expect(submitted().dueAt).toBe(`${dayKey}T23:59:00`);
    });

    it("sends the picked date, time and submission type", async () => {
      const { user } = render();

      await addAssignment(user);
      await pickDueDate(user, day);
      await choose(user, /Due time/, "2:30PM");
      await choose(user, /Submission type/, "Link");
      await user.click(screen.getByRole("button", { name: "Create Module" }));

      expect(submitted()).toMatchObject({
        dueAt: `${dayKey}T14:30:00`,
        submissionType: "LINK",
      });
    });

    describe("editing a module", () => {
      const saved = new Date(2026, 10, 20, 17, 0);
      const initialModule = {
        id: "m1",
        curriculumId: "c1",
        title: "Visual design",
        description: "The basics of layout",
        status: "DRAFT",
        outcomes: ["Use a grid"],
        recordingLink: "",
        resources: [],
        lessons: [{ id: "l1", topic: "", title: "Grids", description: "", resources: [] }],
        assignments: [
          {
            id: "a1",
            title: "Grid study",
            description: "",
            instructions: "",
            resources: [],
            type: "Project",
            mode: "Individual",
            submissionType: "TEXT",
            dueAt: saved.toISOString(),
            afterLesson: null,
            status: "DRAFT",
          },
        ],
        coverImage: null,
        liveClassRecordings: [],
      } as React.ComponentProps<typeof ModuleForm>["initialModule"];

      it("shows the saved due date and time", () => {
        render({ initialModule, submitLabel: "Save changes" });

        expect(screen.getByRole("button", { name: "Due date, Nov 20, 2026" })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Due time" })).toHaveTextContent("5:00PM");
      });

      it("changes the due date and keeps the saved time", async () => {
        const { user } = render({ initialModule, submitLabel: "Save changes" });

        await pickDueDate(user, new Date(2026, 10, 27));
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(submitted()).toMatchObject({
          id: "a1",
          dueAt: "2026-11-27T17:00:00",
          submissionType: "TEXT",
        });
      });

      it("removes the due date", async () => {
        const { user } = render({ initialModule, submitLabel: "Save changes" });

        await user.click(screen.getByRole("button", { name: "Remove due date" }));
        expect(screen.getByRole("button", { name: "Due date" })).toHaveTextContent("Pick a date");
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(submitted().dueAt).toBeNull();
      });
    });
  });

  it("shows the save error", () => {
    renderForm({ errorMessage: "Module title already used" });

    expect(screen.getByText("Module title already used")).toBeInTheDocument();
  });
});

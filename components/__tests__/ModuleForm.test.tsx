import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

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

  /* PENDING-BACKEND: the API has no file uploads, so picked files stay in the session. */
  describe("supporting resources", () => {
    const moduleUpload = () =>
      screen.getAllByLabelText("Upload supporting resources")[0] as HTMLInputElement;

    it("adds a picked file and sends it with the module", async () => {
      const { user, onSubmit } = renderForm();

      await fillRequired(user);
      await user.upload(
        moduleUpload(),
        new File(["x"], "workbook.pdf", { type: "application/pdf" })
      );
      expect(screen.getByText("workbook.pdf")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Create Module" }));
      expect(onSubmit.mock.calls[0][0].resources).toMatchObject([
        { name: "workbook.pdf" },
      ]);
    });

    it("turns away files that aren't PDF, PPTX or DOCX", () => {
      renderForm();

      fireEvent.change(moduleUpload(), {
        target: { files: [new File(["x"], "photo.png", { type: "image/png" })] },
      });

      expect(
        screen.getByText(/photo.png couldn't be added/)
      ).toBeInTheDocument();
    });

    it("removes a picked file", async () => {
      const { user } = renderForm();

      await user.upload(moduleUpload(), new File(["x"], "workbook.pdf"));
      await user.click(screen.getByRole("button", { name: "Remove workbook.pdf" }));

      expect(screen.queryByText("workbook.pdf")).not.toBeInTheDocument();
    });
  });

  describe("adding an assignment", () => {
    type User = ReturnType<typeof renderWithClient>["user"];

    /* The picker opens on the current month, so tests pick a day in it. */
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), 20);
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-20`;

    async function openDialog(user: User) {
      await user.click(screen.getByRole("button", { name: "Add assignment" }));
      return screen.findByRole("dialog", { name: "Add Assignment" });
    }

    async function choose(user: User, label: RegExp, option: string) {
      await user.click(screen.getByRole("combobox", { name: label }));
      await user.click(await screen.findByRole("option", { name: option }));
    }

    it("starts with no assignments", () => {
      renderForm();
      expect(screen.queryByLabelText(/^Assignment title/)).not.toBeInTheDocument();
    });

    it("needs a title and a description", async () => {
      const { user } = renderForm();
      await openDialog(user);
      const create = screen.getByRole("button", { name: "Create Assignment" });

      expect(create).toBeDisabled();
      await user.type(screen.getByLabelText(/^Assignment title/), "Grid study");
      expect(create).toBeDisabled();
      await user.type(
        screen.getByPlaceholderText(/^Redesign a simple landing page/),
        "Lay out a page"
      );
      expect(create).toBeEnabled();
    });

    it("adds the assignment to the module with its settings", async () => {
      const { user, onSubmit } = renderForm();

      await fillRequired(user);
      await user.type(screen.getByLabelText(/^Lesson title/), "Grids");
      await openDialog(user);
      await user.type(screen.getByLabelText(/^Assignment title/), " Grid study ");
      await user.type(
        screen.getByPlaceholderText(/^Redesign a simple landing page/),
        "Lay out a page"
      );
      await user.click(screen.getByRole("button", { name: /^Due date/ }));
      await user.click(await screen.findByRole("button", { name: day.toDateString() }));
      await user.click(screen.getByRole("button", { name: "Apply" }));
      await choose(user, /Attach to lesson/, "After lesson 1");
      await user.clear(screen.getByLabelText(/^Maximum points/));
      await user.type(screen.getByLabelText(/^Maximum points/), "50");
      await choose(user, /Assignment type/, "Link");
      await user.click(screen.getByRole("button", { name: "Create Assignment" }));

      expect(screen.queryByRole("dialog", { name: "Add Assignment" })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^Assignment title/)).toHaveValue("Grid study");

      await user.click(screen.getByRole("button", { name: "Create Module" }));
      expect(onSubmit.mock.calls[0][0].assignments).toMatchObject([
        {
          title: "Grid study",
          description: "Lay out a page",
          dueAt: `${dayKey}T23:59:00`,
          afterLesson: 1,
          maxPoints: 50,
          submissionType: "LINK",
        },
      ]);
    });

    it("only offers this module", async () => {
      const { user } = renderForm();

      await user.type(screen.getByLabelText(/Module title/), "Visual design");
      await openDialog(user);

      expect(screen.getByRole("combobox", { name: /Module/ })).toHaveTextContent(
        "Module 3 - Visual design"
      );
    });

    it("asks for a whole number of points", async () => {
      const { user } = renderForm();
      await openDialog(user);

      await user.clear(screen.getByLabelText(/^Maximum points/));
      await user.type(screen.getByLabelText(/^Maximum points/), "0");

      expect(screen.getByText("Enter a whole number above 0")).toBeInTheDocument();
    });

    it("keeps a saved assignment's settings when the module is saved", async () => {
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
            dueAt: "2026-11-20T17:00:00",
            afterLesson: 1,
            maxPoints: 40,
            status: "DRAFT",
          },
        ],
        coverImage: null,
        liveClassRecordings: [],
      } as React.ComponentProps<typeof ModuleForm>["initialModule"];
      const { user, onSubmit } = renderForm({
        initialModule,
        submitLabel: "Save changes",
      });

      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(onSubmit.mock.calls[0][0].assignments).toMatchObject([
        {
          id: "a1",
          dueAt: "2026-11-20T17:00:00",
          afterLesson: 1,
          maxPoints: 40,
          submissionType: "TEXT",
        },
      ]);
    });
  });

  it("shows the save error", () => {
    renderForm({ errorMessage: "Module title already used" });

    expect(screen.getByText("Module title already used")).toBeInTheDocument();
  });
});

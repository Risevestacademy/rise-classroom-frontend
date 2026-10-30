import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { SettingsTab } from "@/features/curriculum/components/SettingsTab";
import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import type {
  Curriculum,
  CurriculumRecord,
  LessonRecord,
  TopicRecord,
} from "@/features/curriculum/types";
import { makeTrack } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  notFound: vi.fn(),
}));

/* The top nav brings the session and cohort picker along; neither matters here. */
vi.mock("@/components/AdminTopNav", () => ({ AdminTopNav: () => null }));

const { NewResourceScreen } = await import("@/features/curriculum/screens/NewResourceScreen");
const { NewAssignmentScreen } = await import(
  "@/features/curriculum/screens/NewAssignmentScreen"
);

beforeEach(() => push.mockReset());

const timestamps = {
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const curriculumRecord: CurriculumRecord = {
  ...timestamps,
  id: "c1",
  trackId: "track-1",
  cohortId: "cohort-1",
  title: "Product Design",
  description: "From research to hand-off",
  status: "ONGOING",
  publishStatus: "PUBLISHED",
  progressMode: "SEQUENTIAL",
  totalModules: 1,
  totalLessons: 1,
  totalAssignments: 0,
  cohort: { id: "cohort-1", name: "Cohort 4" },
  assignedInstructors: [],
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

const lesson: LessonRecord = { ...timestamps, id: "l1", topicId: "t1", title: "Grids", position: 0 };

/* One curriculum with one module, which has one lesson and nothing else yet. */
function curriculumRoutes(extra: Record<string, unknown> = {}) {
  return {
    "GET /admin/curriculums/c1": envelope(curriculumRecord),
    "GET /admin/tracks/track-1": envelope(makeTrack()),
    "GET /admin/users": envelope({ items: [], page: 1, limit: 1, total: 12, totalPages: 12 }),
    "GET /admin/curriculums/c1/topics": envelope([topic]),
    "GET /admin/topics/t1/lessons": envelope([lesson]),
    "GET /admin/topics/t1/resources": envelope([]),
    "GET /admin/topics/t1/assignments": envelope([]),
    "GET /admin/lessons/l1/resources": envelope([]),
    "GET /admin/lessons/l1/assignments": envelope([]),
    "GET /admin/lessons/l1/recordings": envelope([]),
    ...extra,
  };
}

function renderAsAdmin(ui: React.ReactElement) {
  return renderWithClient(<CurriculumScopeProvider role="admin">{ui}</CurriculumScopeProvider>);
}

/* Picks an option from one of the design system's selects. */
async function choose(
  user: ReturnType<typeof renderWithClient>["user"],
  label: RegExp,
  option: string,
) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("NewResourceScreen", () => {
  const savedResource = {
    ...timestamps,
    id: "r1",
    lessonId: "l1",
    title: "Grid notes",
    url: "https://drive.google.com/grid.pdf",
    publishStatus: "PUBLISHED",
  };

  async function renderScreen(extra: Record<string, unknown> = {}) {
    const api = mockApi(curriculumRoutes(extra));
    const view = renderAsAdmin(<NewResourceScreen id="c1" />);
    /* The module and lesson pickers fill in once the module list loads. */
    await screen.findByText("Module 1 - Visual design");
    return { ...view, api };
  }

  const linkInput = () => screen.getByRole("textbox", { name: /Link/ });

  it("has no file upload, only a link", async () => {
    await renderScreen();

    expect(linkInput()).toBeInTheDocument();
    expect(screen.queryByText(/Drag|drop|Browse/i)).not.toBeInTheDocument();
  });

  it("needs a title and a link", async () => {
    const { user } = await renderScreen();
    const create = screen.getByRole("button", { name: "Create resource" });

    expect(create).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Title/ }), "Grid notes");
    expect(create).toBeDisabled();
    await user.type(linkInput(), "https://drive.google.com/grid.pdf");
    expect(create).toBeEnabled();
  });

  it("saves a PDF link on the first lesson by default", async () => {
    const { user, api } = await renderScreen({
      "POST /admin/lessons/l1/resources": envelope(savedResource),
    });

    await user.type(screen.getByRole("textbox", { name: /Title/ }), " Grid notes ");
    await user.type(linkInput(), " https://drive.google.com/grid.pdf ");
    await user.click(screen.getByRole("button", { name: "Create resource" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(api.bodies("POST /admin/lessons/l1/resources")).toEqual([
      {
        title: "Grid notes",
        url: "https://drive.google.com/grid.pdf",
        type: "PDF",
        publishStatus: "PUBLISHED",
      },
    ]);
    expect(push.mock.calls[0][0]).toBe(
      "/admin/curriculum/c1?tab=resources&created=Grid+notes&module=1",
    );
  });

  it("sends the chosen type and can attach to the whole module", async () => {
    const { user, api } = await renderScreen({
      "POST /admin/topics/t1/resources": envelope(savedResource),
    });

    await choose(user, /Resource type/, "Video");
    expect(linkInput()).toHaveAttribute("placeholder", "https://www.youtube.com/watch?v=…");
    await choose(user, /^Lesson/, "Whole module (no specific lesson)");
    await user.type(screen.getByRole("textbox", { name: /Title/ }), "Intro video");
    await user.type(linkInput(), "https://youtu.be/intro");
    await user.click(screen.getByRole("button", { name: "Create resource" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(api.bodies("POST /admin/topics/t1/resources")).toMatchObject([
      { title: "Intro video", url: "https://youtu.be/intro", type: "VIDEO" },
    ]);
  });

  it("rejects a link that isn't https, without saving", async () => {
    const { user, api } = await renderScreen();

    await user.type(screen.getByRole("textbox", { name: /Title/ }), "Grid notes");
    await user.type(linkInput(), "drive.google.com/grid.pdf");
    await user.click(screen.getByRole("button", { name: "Create resource" }));

    expect(await screen.findByText("The link must be a full link starting with https://")).toBeInTheDocument();
    expect(api.bodies("POST /admin/lessons/l1/resources")).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("NewAssignmentScreen", () => {
  const savedAssignment = { ...timestamps, id: "a1", topicId: "t1", title: "Grid study" };

  async function renderScreen() {
    const api = mockApi(
      curriculumRoutes({ "POST /admin/topics/t1/assignments": envelope(savedAssignment) }),
    );
    const view = renderAsAdmin(<NewAssignmentScreen id="c1" />);
    await screen.findByText("Module 1 - Visual design");
    return { ...view, api };
  }

  const description = () =>
    screen.getByPlaceholderText("Redesign a simple landing page using hierarchy and contrast");

  it("needs a title and a description", async () => {
    const { user } = await renderScreen();
    const create = screen.getByRole("button", { name: "Create Assignment" });

    expect(create).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Assignment title/ }), "Grid study");
    expect(create).toBeDisabled();
    await user.type(description(), "   ");
    expect(create).toBeDisabled();
    await user.type(description(), "Lay out a page on a grid");
    expect(create).toBeEnabled();
  });

  it("saves a draft on the whole module, with links as attachments", async () => {
    const { user, api } = await renderScreen();

    await user.type(screen.getByRole("textbox", { name: /Assignment title/ }), " Grid study ");
    await user.type(description(), "Lay out a page on a grid");
    await user.type(
      screen.getByPlaceholderText("https://drive.google.com/…"),
      "https://www.figma.com/file/brief{Enter}",
    );
    await user.click(screen.getByRole("button", { name: "Create Assignment" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(api.bodies("POST /admin/topics/t1/assignments")).toEqual([
      {
        title: "Grid study",
        description: "Lay out a page on a grid",
        submissionType: "FILE_UPLOAD",
        publishStatus: "DRAFT",
        attachments: ["https://www.figma.com/file/brief"],
      },
    ]);
    expect(push.mock.calls[0][0]).toBe(
      "/admin/curriculum/c1?tab=assignments&created=Grid+study&module=1",
    );
  });

  it("ties the assignment to a lesson and sends the chosen type", async () => {
    const { user, api } = await renderScreen();

    await user.type(screen.getByRole("textbox", { name: /Assignment title/ }), "Grid study");
    await user.type(description(), "Lay out a page on a grid");
    await choose(user, /Due relative to lesson/, "After lesson 1");
    await choose(user, /Assignment type/, "Link");
    await user.click(screen.getByRole("button", { name: "Create Assignment" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(api.bodies("POST /admin/topics/t1/assignments")).toMatchObject([
      { lessonId: "l1", submissionType: "LINK" },
    ]);
  });

  it("has no file upload for resources", async () => {
    await renderScreen();
    expect(screen.getByRole("button", { name: "Add link" })).toBeInTheDocument();
    expect(screen.queryByText(/Drag|drop|Browse/i)).not.toBeInTheDocument();
  });
});

describe("SettingsTab", () => {
  const curriculum = {
    id: "c1",
    title: "Product Design",
    description: "From research to hand-off",
    publishStatus: "PUBLISHED",
    progressMode: "SEQUENTIAL",
    history: [],
  } as unknown as Curriculum;

  function renderTab(routes: Record<string, unknown> = {}) {
    const api = mockApi({ "PATCH /admin/curriculums/c1": envelope({}), ...routes });
    return { ...renderAsAdmin(<SettingsTab curriculum={curriculum} />), api };
  }

  const nameInput = () => screen.getByRole("textbox", { name: /Curriculum name/ });

  it("only saves once something has changed", async () => {
    const { user } = renderTab();
    const save = screen.getByRole("button", { name: "Save changes" });

    expect(save).toBeDisabled();
    await user.type(nameInput(), " 2");
    expect(save).toBeEnabled();
  });

  it("won't save an empty name", async () => {
    const { user } = renderTab();

    await user.clear(nameInput());
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("saves the trimmed name and description", async () => {
    const { user, api } = renderTab();

    await user.clear(nameInput());
    await user.type(nameInput(), "  Product Design 2 ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /admin/curriculums/c1")).toEqual([
        { title: "Product Design 2", description: "From research to hand-off" },
      ]),
    );
  });

  it("saves the status and progress mode as soon as they're picked", async () => {
    const { user, api } = renderTab();

    await user.click(screen.getByRole("radio", { name: /Draft/ }));
    await user.click(screen.getByRole("radio", { name: /Flexible/ }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /admin/curriculums/c1")).toEqual([
        { publishStatus: "DRAFT" },
        { progressMode: "FLEXIBLE" },
      ]),
    );
  });

  it("shows the error when saving fails", async () => {
    const { user } = renderTab({
      "PATCH /admin/curriculums/c1": reply(409, { success: false, message: "Name already taken" }),
    });

    await user.type(nameInput(), " 2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Name already taken")).toBeInTheDocument();
  });
});

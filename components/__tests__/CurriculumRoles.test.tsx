import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { NoteDialog, NotesTab } from "@/features/curriculum/components/Notes";
import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import type {
  CurriculumRecord,
  CurriculumRole,
  NoteRecord,
  TopicRecord,
} from "@/features/curriculum/types";
import { makeTrack } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

/* The top navs bring the session and cohort picker along; neither matters here. */
vi.mock("@/components/AdminTopNav", () => ({ AdminTopNav: () => null }));
vi.mock("@/components/instructor-dashboard/InstructorNavbar", () => ({
  InstructorNavbar: () => null,
}));

const { CurriculumDetailScreen } = await import(
  "@/features/curriculum/screens/CurriculumDetailScreen"
);

const timestamps = {
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const topic: TopicRecord = {
  ...timestamps,
  id: "topic-1",
  curriculumId: "c1",
  title: "Visual design",
  description: "Layout and type",
  position: 1,
  publishStatus: "PUBLISHED",
  outcomes: [],
};

const note: NoteRecord = {
  ...timestamps,
  id: "note-1",
  topicId: "topic-1",
  title: "Swap the grid lesson",
  body: "Move it before typography.",
  isPinned: false,
  author: { firstName: "Grace", lastName: "Hopper" },
};

const curriculum: CurriculumRecord = {
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
  totalLessons: 0,
  totalAssignments: 0,
  cohort: { id: "cohort-1", name: "Cohort 4" },
  assignedInstructors: [],
};

/* The module list behind the notes: one module with nothing in it yet. */
function moduleRoutes(role: CurriculumRole) {
  return {
    [`GET /${role}/curriculums/c1/topics`]: envelope([topic]),
    [`GET /${role}/topics/topic-1/lessons`]: envelope([]),
    [`GET /${role}/topics/topic-1/resources`]: envelope([]),
    [`GET /${role}/topics/topic-1/assignments`]: envelope([]),
  };
}

/* A curriculum card needs its track and student count, which each role reads differently. */
const curriculumRoutes: Record<CurriculumRole, Record<string, unknown>> = {
  admin: {
    "GET /admin/curriculums/c1": envelope(curriculum),
    "GET /admin/tracks/track-1": envelope(makeTrack()),
    "GET /admin/users": envelope({ items: [], page: 1, limit: 1, total: 12, totalPages: 12 }),
  },
  instructor: {
    "GET /instructor/curriculums/c1": envelope(curriculum),
    "GET /instructor/tracks": envelope([
      { id: "it-1", instructorId: "i1", trackId: "track-1", cohortId: "cohort-1", track: makeTrack() },
    ]),
    "GET /instructor/students": envelope([]),
  },
};

function renderAs(role: CurriculumRole, ui: React.ReactElement) {
  return renderWithClient(
    <CurriculumScopeProvider role={role}>{ui}</CurriculumScopeProvider>,
  );
}

const roles = ["admin", "instructor"] as const;

describe.each(roles)("curriculum notes as %s", (role) => {
  it("loads the notes from the role's own endpoint", async () => {
    const api = mockApi({
      ...moduleRoutes(role),
      [`GET /${role}/curriculums/c1/notes`]: envelope([note]),
    });
    renderAs(role, <NotesTab curriculumId="c1" onAddNote={vi.fn()} onEditNote={vi.fn()} />);

    expect(await screen.findByText("Swap the grid lesson")).toBeInTheDocument();
    expect(await screen.findByText(/Module 1/)).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
    const other = role === "admin" ? "instructor" : "admin";
    expect(api.fetchMock.mock.calls.some(([url]) => String(url).includes(`/${other}/`))).toBe(
      false,
    );
  });

  it("pins a note through the role's endpoint", async () => {
    const api = mockApi({
      ...moduleRoutes(role),
      [`GET /${role}/curriculums/c1/notes`]: envelope([note]),
      [`PATCH /${role}/curriculums/c1/notes/note-1/pin`]: envelope({}),
    });
    const { user } = renderAs(
      role,
      <NotesTab curriculumId="c1" onAddNote={vi.fn()} onEditNote={vi.fn()} />,
    );

    await user.click(await screen.findByRole("button", { name: "Swap the grid lesson actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Pin to top" }));

    await vi.waitFor(() =>
      expect(api.bodies(`PATCH /${role}/curriculums/c1/notes/note-1/pin`)).toEqual([
        { isPinned: true },
      ]),
    );
  });

  it("adds a note to the first module by default", async () => {
    const api = mockApi({
      ...moduleRoutes(role),
      [`GET /${role}/curriculums/c1/notes`]: envelope([]),
      [`POST /${role}/curriculums/c1/notes`]: envelope(note),
    });
    const onClose = vi.fn();
    const { user } = renderAs(role, <NoteDialog curriculumId="c1" onClose={onClose} />);

    const add = screen.getByRole("button", { name: "Add note" });
    expect(add).toBeDisabled();

    await user.type(screen.getByLabelText(/Title/), "  Swap the grid lesson ");
    await user.type(
      screen.getByPlaceholderText(/^Redesign a simple landing page/),
      " Move it before typography. ",
    );
    await screen.findByText("Module 1 - Visual design");
    await user.click(add);

    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(api.bodies(`POST /${role}/curriculums/c1/notes`)).toEqual([
      { title: "Swap the grid lesson", body: "Move it before typography.", topicId: "topic-1" },
    ]);
  });
});

describe("curriculum detail permissions", () => {
  function renderDetail(role: CurriculumRole) {
    mockApi({
      ...curriculumRoutes[role],
      ...moduleRoutes(role),
      [`GET /${role}/curriculums/c1/notes`]: envelope([]),
    });
    return renderAs(role, <CurriculumDetailScreen id="c1" searchParams={{}} />);
  }

  it("lets admins delete the curriculum", async () => {
    const { user } = renderDetail("admin");

    await user.click(await screen.findByRole("button", { name: "Curriculum actions" }));
    expect(await screen.findByRole("menuitem", { name: "Delete curriculum" })).toBeInTheDocument();
  });

  it("doesn't offer instructors the delete action", async () => {
    renderDetail("instructor");

    expect((await screen.findAllByText("Product Design")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Curriculum actions" })).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { curriculumApis } from "@/features/curriculum/api";
import { resourceFromLink } from "@/features/curriculum/mappers";
import type {
  AssignmentRecord,
  LessonRecord,
  ResourceRecord,
  TopicRecord,
} from "@/features/curriculum/types";
import { curriculumTreeRoutes, envelope, mockApi } from "@/test/utils";

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

const lesson: LessonRecord = { ...timestamps, id: "l1", topicId: "t1", title: "Grids", position: 0 };

const savedLink = {
  ...timestamps,
  id: "r1",
  lessonId: null,
  title: "Brief",
  url: "https://drive.google.com/brief.pdf",
  publishStatus: "PUBLISHED",
} as unknown as ResourceRecord;

/* A module with one lesson and one saved module-wide link. */
function moduleRoutes(assignments: AssignmentRecord[] = []) {
  return {
    ...curriculumTreeRoutes("admin", "c1", [
      {
        ...topic,
        resources: [savedLink],
        assignments,
        lessons: [{ ...lesson, resources: [], recordings: [] }],
      },
    ]),
    "POST /admin/topics/t1/resources": envelope(savedLink),
    "POST /admin/lessons/l1/resources": envelope(savedLink),
    "POST /admin/lessons/l1/recordings": envelope({ id: "rec1" }),
  };
}

describe("saving resource links", () => {
  const api = curriculumApis.admin;
  const saved = { ...resourceFromLink(savedLink.url), id: "r1" };

  it("creates new module links and leaves saved ones alone", async () => {
    const backend = mockApi(moduleRoutes());

    await api.updateModule("t1", {
      resources: [saved, resourceFromLink("https://youtu.be/intro")],
    });

    expect(backend.bodies("POST /admin/topics/t1/resources")).toEqual([
      { title: "intro", url: "https://youtu.be/intro", type: "LINK", publishStatus: "PUBLISHED" },
    ]);
  });

  it("creates new lesson links on the lesson", async () => {
    const backend = mockApi(moduleRoutes());

    await api.updateModule("t1", {
      lessons: [
        {
          id: "l1",
          topic: "",
          title: "Grids",
          description: "",
          recordingLink: "",
          resources: [resourceFromLink("https://www.figma.com/file/grid")],
        },
      ],
    });

    expect(backend.bodies("POST /admin/lessons/l1/resources")).toEqual([
      { title: "grid", url: "https://www.figma.com/file/grid", type: "LINK", publishStatus: "PUBLISHED" },
    ]);
  });

  it("sends the chosen type for a single resource", async () => {
    const backend = mockApi(moduleRoutes());

    await api.createResource("t1", "l1", {
      name: "https://drive.google.com/notes.pdf",
      sizeBytes: null,
      title: "Notes",
      description: "",
      url: "https://drive.google.com/notes.pdf",
      kind: "PDF",
    });

    expect(backend.bodies("POST /admin/lessons/l1/resources")).toEqual([
      { title: "Notes", url: "https://drive.google.com/notes.pdf", type: "PDF", publishStatus: "PUBLISHED" },
    ]);
  });
});

describe("saving lesson videos", () => {
  const api = curriculumApis.admin;

  it("saves each lesson's video as that lesson's recording", async () => {
    const backend = mockApi(moduleRoutes());

    await api.updateModule("t1", {
      lessons: [
        {
          id: "l1",
          topic: "",
          title: "Grids",
          description: "",
          recordingLink: "https://youtu.be/grids",
          resources: [],
        },
      ],
    });

    expect(backend.bodies("POST /admin/lessons/l1/recordings")).toEqual([
      { title: "Lesson video", url: "https://youtu.be/grids" },
    ]);
  });

  it("rejects a lesson video link that isn't https", async () => {
    mockApi(moduleRoutes());

    await expect(
      api.updateModule("t1", {
        lessons: [
          {
            id: "l1",
            topic: "",
            title: "Grids",
            description: "",
            recordingLink: "youtube.com/grids",
            resources: [],
          },
        ],
      }),
    ).rejects.toThrow("Lesson 1's video link must be a full link starting with https://");
  });
});

describe("loading modules", () => {
  const api = curriculumApis.admin;
  const assignment = (id: string, lessonId: string | null) =>
    ({
      ...timestamps,
      id,
      topicId: "t1",
      lessonId,
      title: id,
      publishStatus: "PUBLISHED",
    }) as unknown as AssignmentRecord;

  it("loads every module from the curriculum tree in one request", async () => {
    const backend = mockApi(
      moduleRoutes([assignment("on-lesson", "l1"), assignment("on-module", null)]),
    );

    const [loaded] = await new QueryClient().fetchQuery(api.queries.modules("c1"));

    expect(loaded.assignments.map((a) => [a.id, a.afterLesson])).toEqual([
      ["on-lesson", 1],
      ["on-module", null],
    ]);
    expect(backend.fetchMock).toHaveBeenCalledOnce();
  });

  it("reloads only the changed module into the cached list", async () => {
    const backend = mockApi(moduleRoutes());
    const client = new QueryClient();
    await client.fetchQuery(api.queries.modules("c1"));

    await api.refreshModule(client, "c1", "t1");

    expect(backend.urls("GET /admin/curriculums/c1/tree")).toHaveLength(1);
    expect(backend.urls("GET /admin/topics/t1/tree")).toHaveLength(1);
    expect(client.getQueryData(api.keys.modules("c1"))).toHaveLength(1);
  });
});

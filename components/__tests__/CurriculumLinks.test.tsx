import { describe, expect, it } from "vitest";

import { curriculumApis } from "@/features/curriculum/api";
import { resourceFromLink } from "@/features/curriculum/mappers";
import type { LessonRecord, ResourceRecord, TopicRecord } from "@/features/curriculum/types";
import { envelope, mockApi } from "@/test/utils";

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
function moduleRoutes() {
  return {
    "GET /admin/topics/t1": envelope(topic),
    "GET /admin/topics/t1/lessons": envelope([lesson]),
    "GET /admin/topics/t1/resources": envelope([savedLink]),
    "GET /admin/topics/t1/assignments": envelope([]),
    "GET /admin/lessons/l1/resources": envelope([]),
    "GET /admin/lessons/l1/assignments": envelope([]),
    "GET /admin/lessons/l1/recordings": envelope([]),
    "POST /admin/topics/t1/resources": envelope(savedLink),
    "POST /admin/lessons/l1/resources": envelope(savedLink),
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

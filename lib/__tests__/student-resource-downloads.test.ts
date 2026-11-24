import { describe, expect, it } from "vitest";

import { describeResource, resourceHref } from "@/lib/student-lessons";

const upload = "/api/v1/resources/r1/download";

describe("uploaded resources for students", () => {
  it("download through the backend proxy so the session cookie goes along", () => {
    expect(resourceHref(upload)).toBe("/api/backend/resources/r1/download");
  });

  it("keep external links as they are, and drop anything that isn't a web link", () => {
    expect(resourceHref("https://youtu.be/intro")).toBe("https://youtu.be/intro");
    expect(resourceHref("javascript:alert(1)")).toBeNull();
  });

  it("are always files, named by the uploaded file's extension", () => {
    expect(describeResource(upload, "DOCUMENT", "brief.docx")).toEqual({
      kind: "DOCX",
      host: "",
      isFile: true,
    });
    expect(describeResource(upload, "VIDEO", "intro.mp4")).toMatchObject({
      kind: "Video",
      isFile: true,
    });
    expect(describeResource(upload, "PDF")).toMatchObject({ kind: "PDF", isFile: true });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { api, apiErrorDetails } from "@/lib/api";
import { mockApi, reply } from "@/test/utils";

describe("apiErrorDetails", () => {
  afterEach(() => vi.restoreAllMocks());

  it("gives the route, status, message and both bodies of a failed request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi({
      "POST /admin/topics/t1/assignments": reply(500, { message: "Internal server error" }),
    });

    const error = await api
      .post("/admin/topics/t1/assignments", { title: "Grid study" })
      .catch((caught: unknown) => caught);

    expect(apiErrorDetails(error)).toMatchObject({
      route: "POST http://localhost:3000/api/backend/admin/topics/t1/assignments",
      status: 500,
      message: "Internal server error",
      requestBody: { title: "Grid study" },
      responseBody: { message: "Internal server error" },
      requestIds: {},
    });
  });

  it("describes errors that didn't come from the API", () => {
    expect(apiErrorDetails(new Error("offline"))).toMatchObject({ message: "offline" });
  });
});

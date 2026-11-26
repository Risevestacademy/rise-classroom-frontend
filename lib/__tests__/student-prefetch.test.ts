import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { prefetchStudentPage } from "@/lib/student-prefetch";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  api: { get: vi.fn() },
}));

const get = vi.mocked(api.get);

const progress = [
  { enrollmentId: "done", trackComplete: true },
  { enrollmentId: "current", trackComplete: false },
];

function respond() {
  get.mockImplementation(async (path: string) => ({
    success: true,
    data: path === "/student/me/progress" ? progress : [],
  }));
}

function setConnection(connection: object | undefined) {
  Object.defineProperty(navigator, "connection", {
    value: connection,
    configurable: true,
  });
}

afterEach(() => {
  get.mockReset();
  setConnection(undefined);
});

describe("prefetchStudentPage", () => {
  it("loads My learning's curriculum for the track in progress", async () => {
    respond();
    const queryClient = new QueryClient();

    prefetchStudentPage(queryClient, "/student/my-learning");

    await vi.waitFor(() =>
      expect(get).toHaveBeenCalledWith("/student/enrollments/current/content"),
    );
    expect(get).not.toHaveBeenCalledWith("/student/enrollments/done/content");
  });

  it("doesn't ask again for data that's still fresh", async () => {
    respond();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 60_000 } },
    });

    prefetchStudentPage(queryClient, "/student/my-learning");
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));

    prefetchStudentPage(queryClient, "/student/my-learning");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("skips prefetching when the student has asked to save data", () => {
    respond();
    setConnection({ saveData: true });

    prefetchStudentPage(new QueryClient(), "/student/my-learning");

    expect(get).not.toHaveBeenCalled();
  });

  it("skips prefetching on a 2G connection", () => {
    respond();
    setConnection({ effectiveType: "slow-2g" });

    prefetchStudentPage(new QueryClient(), "/student/notifications");

    expect(get).not.toHaveBeenCalled();
  });

  it("ignores pages it has nothing to load for", () => {
    respond();

    prefetchStudentPage(new QueryClient(), "/student/integration");

    expect(get).not.toHaveBeenCalled();
  });
});

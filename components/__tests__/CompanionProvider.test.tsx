import { afterEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

import { CompanionProvider } from "@/components/mascot/Companion";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const pathname = vi.hoisted(() => ({ current: "/student/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const progress = [
  {
    enrollmentId: "e1",
    trackComplete: false,
    progress: { completedLessons: 0, totalLessons: 0, percentage: 0 },
  },
];

function api() {
  return mockApi({
    "GET /auth/get-session": null,
    "GET /student/me/progress": envelope(progress),
    "GET /student/enrollments/e1/content": envelope([]),
    "GET /student/enrollments/e1/submissions": envelope({ items: [], total: 0 }),
    "GET /student/weekly-tasks": envelope({ items: [], total: 0 }),
    "GET /control-tower/student": envelope({ student: { id: "p1" } }),
    "GET /weekly-metrics/student/p1": envelope([]),
    "GET /live-sessions": envelope({ items: [] }),
  });
}

/* What Leafy's nudges need beyond growth and live classes. */
const nudgeRoutes = [
  "GET /student/enrollments/e1/content",
  "GET /student/weekly-tasks",
  "GET /control-tower/student",
];

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("CompanionProvider", () => {
  it("loads everything the nudges need on the dashboard", async () => {
    pathname.current = "/student/dashboard";
    const { urls } = api();

    renderWithClient(<CompanionProvider>{null}</CompanionProvider>);

    for (const route of nudgeRoutes) {
      await waitFor(() => expect(urls(route)).not.toHaveLength(0));
    }
  });

  it("only loads growth and live classes on other pages", async () => {
    pathname.current = "/student/profile";
    const { urls } = api();

    renderWithClient(<CompanionProvider>{null}</CompanionProvider>);

    await waitFor(() => expect(urls("GET /student/me/progress")).toHaveLength(1));
    await waitFor(() => expect(urls("GET /live-sessions")).not.toHaveLength(0));
    for (const route of nudgeRoutes) expect(urls(route)).toHaveLength(0);
  });
});

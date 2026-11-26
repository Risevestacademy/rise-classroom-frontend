import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  AdminSetupChecklist,
  AdminSetupProvider,
  SetupHint,
} from "@/components/admin-setup/AdminSetup";
import type { SessionResponse } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";
import { envelope, mockApi } from "@/test/utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

const user = { id: "admin-1" } as SessionResponse["user"];
const statusKey = "admin-setup:admin-1";

function academy({ cohorts = 0, tracks = 0, students = 0 }) {
  mockApi({
    "GET /admin/cohorts": envelope(Array.from({ length: cohorts }, (_, i) => ({ id: `c${i}` }))),
    "GET /admin/tracks": envelope(Array.from({ length: tracks }, (_, i) => ({ id: `t${i}` }))),
    "GET /admin/users": envelope({ items: [], total: students, page: 1, limit: 1, totalPages: 1 }),
  });
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(sessionQuery().queryKey, { user } as SessionResponse);
  render(
    <QueryClientProvider client={client}>
      <AdminSetupProvider>
        <span data-tour="nav:/admin/cohorts">Cohorts</span>
        <AdminSetupChecklist fallback={<p>It&apos;s quiet for now</p>} />
        <SetupHint item="cohort">Cohort tip</SetupHint>
      </AdminSetupProvider>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("Admin setup guide", () => {
  it("offers the checklist in a new academy, in place of the empty state", async () => {
    academy({});
    renderDashboard();

    expect(await screen.findByRole("heading", { name: "Set up your academy" })).toBeInTheDocument();
    expect(screen.queryByText("It's quiet for now")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start setup" })).toBeInTheDocument();
  });

  it("ticks off what's done and offers to continue", async () => {
    academy({ cohorts: 1 });
    renderDashboard();

    expect(await screen.findByLabelText("Done")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue setup" })).toBeInTheDocument();
  });

  it("starts by pointing at Cohorts, with tips while on that task", async () => {
    academy({});
    const events = renderDashboard();

    await events.click(await screen.findByRole("button", { name: "Start setup" }));

    expect(await screen.findByRole("dialog", { name: "Start with a cohort" })).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Cohort tip")).toBeInTheDocument();
  });

  it("pauses on End tour and can be picked up again", async () => {
    academy({});
    const events = renderDashboard();
    await events.click(await screen.findByRole("button", { name: "Start setup" }));

    await events.click(await screen.findByRole("button", { name: "End tour" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start setup" })).toBeInTheDocument();
    expect(localStorage.getItem(statusKey)).toBeNull();
  });

  it("never comes back once skipped", async () => {
    academy({});
    const events = renderDashboard();
    await events.click(await screen.findByRole("button", { name: "Skip the guide" }));

    expect(screen.getByText("It's quiet for now")).toBeInTheDocument();
    expect(localStorage.getItem(statusKey)).toBe("dismissed");
  });

  it("isn't offered once the academy has a student", async () => {
    academy({ cohorts: 1, tracks: 1, students: 1 });
    renderDashboard();

    await waitFor(() => expect(localStorage.getItem(statusKey)).toBe("done"));
    expect(screen.queryByRole("heading", { name: "Set up your academy" })).not.toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AdminNotification } from "@/lib/admin-notifications";
import { mockApi, reply, renderWithClient } from "@/test/utils";

const replace = vi.fn((url: string) => window.history.replaceState(null, "", url));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/notifications",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const { AdminNotificationsScreen } = await import(
  "@/components/notifications/AdminNotificationsScreen"
);

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const invite: AdminNotification = {
  id: "n1",
  title: "Join a live session now",
  body: "Jioke invited you to join Design review, which is live now.",
  type: "LIVE_SESSION_SCHEDULED",
  data: { live: true, liveSessionId: "s1" },
  entityType: "LIVE_SESSION",
  entityId: "s1",
  isRead: false,
  createdAt: minutesAgo(5),
};

const cancelled: AdminNotification = {
  id: "n2",
  title: "Live session cancelled",
  body: "Townhall has been cancelled.",
  type: "LIVE_SESSION_CANCELLED",
  data: { liveSessionId: "s2" },
  isRead: true,
  createdAt: minutesAgo(30),
};

const mentor: AdminNotification = {
  id: "n3",
  title: "Mentor assigned",
  body: "Ada now mentors Tobi.",
  type: "MENTOR_ASSIGNED",
  isRead: false,
  createdAt: minutesAgo(60),
};

const session = (id: string, status: string) => ({
  id,
  title: id === "s1" ? "Design review" : "Townhall",
  roomName: "room",
  type: "EXPLICIT_INVITE",
  status,
  hostId: "h1",
  host: { id: "h1", name: "Jioke" },
  scheduledStartAt: minutesAgo(10),
  scheduledEndAt: new Date(Date.now() + 50 * 60_000).toISOString(),
  timezone: "Africa/Lagos",
});

function routes(extra = {}) {
  return mockApi({
    "GET /notifications": {
      success: true,
      data: [invite, cancelled, mentor],
      metadata: {
        unreadCount: 2,
        pagination: { page: 1, limit: 50, totalItems: 3, totalPages: 1, hasNext: false, hasPrevious: false },
      },
    },
    "GET /live-sessions/s1": { success: true, data: session("s1", "LIVE") },
    "GET /live-sessions/s2": { success: true, data: session("s2", "CANCELLED") },
    "PATCH /notifications/n1/read": { success: true },
    "PATCH /notifications/n3/read": { success: true },
    ...extra,
  });
}

beforeEach(() => {
  replace.mockClear();
  window.history.replaceState(null, "", "/admin/notifications");
});

describe("AdminNotificationsScreen", () => {
  it("lists notifications with the counts on each tab", async () => {
    routes();
    renderWithClient(<AdminNotificationsScreen />);

    expect(await screen.findByText("Join a live session now")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All (3)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Unread (2)" })).toBeInTheDocument();
    expect(screen.getByText("No notification selected")).toBeInTheDocument();
  });

  it("offers to join a session that's live, and reads the notification", async () => {
    const api = routes();
    window.history.replaceState(null, "", "/admin/notifications?id=n1");
    renderWithClient(<AdminNotificationsScreen />);

    const details = await screen.findByRole("region", { name: "Notification details" });
    const join = await within(details).findByRole("link", { name: "Join session" });
    expect(join).toHaveAttribute("href", "/admin/live/s1");
    expect(within(details).getByText("Live now")).toBeInTheDocument();
    await waitFor(() => expect(api.bodies("PATCH /notifications/n1/read")).toHaveLength(1));
  });

  it("has no button for a cancelled session", async () => {
    routes();
    window.history.replaceState(null, "", "/admin/notifications?id=n2");
    renderWithClient(<AdminNotificationsScreen />);

    const details = await screen.findByRole("region", { name: "Notification details" });
    expect(await within(details).findByText("Cancelled")).toBeInTheDocument();
    expect(within(details).queryByRole("link")).not.toBeInTheDocument();
  });

  it("opens a notification from the list", async () => {
    routes();
    renderWithClient(<AdminNotificationsScreen />);

    await userEvent.click(await screen.findByText("Mentor assigned"));

    expect(replace).toHaveBeenCalledWith("/admin/notifications?id=n3", { scroll: false });
  });

  it("filters by type", async () => {
    routes();
    renderWithClient(<AdminNotificationsScreen />);
    await screen.findByText("Mentor assigned");

    await userEvent.click(screen.getByRole("button", { name: "Filter notifications" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Mentorship" }));

    expect(screen.getByText("Mentor assigned")).toBeInTheDocument();
    expect(screen.queryByText("Join a live session now")).not.toBeInTheDocument();
  });

  it("marks the selected notifications as read", async () => {
    const api = routes();
    renderWithClient(<AdminNotificationsScreen />);
    await screen.findByText("Mentor assigned");

    await userEvent.click(screen.getByRole("checkbox", { name: "Select all notifications" }));
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark as read" }));

    await waitFor(() => expect(screen.queryAllByLabelText("Unread")).toHaveLength(0));
    expect(api.bodies("PATCH /notifications/n1/read")).toHaveLength(1);
    expect(api.bodies("PATCH /notifications/n3/read")).toHaveLength(1);
  });

  it("deletes a notification after confirming", async () => {
    const api = routes({ "DELETE /notifications/n3": { success: true } });
    window.history.replaceState(null, "", "/admin/notifications?id=n3");
    renderWithClient(<AdminNotificationsScreen />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete notification" }));
    await userEvent.click(await screen.findByRole("button", { name: "Yes, Delete!" }));

    await waitFor(() => expect(api.fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true));
    await waitFor(() => expect(screen.getByRole("tab", { name: "All (2)" })).toBeInTheDocument());
    expect(replace).toHaveBeenCalledWith("/admin/notifications", { scroll: false });
  });

  it("explains when notifications can't load", async () => {
    mockApi({ "GET /notifications": reply(500) });
    renderWithClient(<AdminNotificationsScreen />);

    expect(await screen.findByText("Couldn't load notifications")).toBeInTheDocument();
  });
});

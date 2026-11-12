import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdminNotificationsPanel } from "@/components/AdminNotificationsPanel";
import type { AdminNotification } from "@/lib/admin-dashboard";
import { mockApi, renderWithClient } from "@/test/utils";

const notifications: AdminNotification[] = [
  {
    id: "n1",
    title: "Assignment submitted",
    body: "Sarah submitted Assignment 4",
    type: "ASSIGNMENT_SUBMITTED",
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: "n2",
    title: "Live class reminder",
    body: "Class starts in 15 minutes",
    type: "LIVE_CLASS_REMINDER",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];

function notificationRoutes() {
  return mockApi({
    "GET /notifications": {
      success: true,
      data: notifications,
      metadata: { unreadCount: 1 },
    },
    "PATCH /notifications/n1/read": { success: true },
    "PATCH /notifications/read-all": { success: true },
  });
}

function renderPanel() {
  return renderWithClient(<AdminNotificationsPanel open onOpenChange={() => {}} />);
}

describe("AdminNotificationsPanel", () => {
  it("lists the admin's notifications from the API", async () => {
    notificationRoutes();
    renderPanel();

    expect(await screen.findByText("Assignment submitted")).toBeInTheDocument();
    expect(screen.getByText("Sarah submitted Assignment 4")).toBeInTheDocument();
    expect(screen.getByText("10 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Unread")).toHaveLength(1);
  });

  it("shows only unread notifications on the Unread tab", async () => {
    notificationRoutes();
    renderPanel();
    await screen.findByText("Assignment submitted");

    await userEvent.click(screen.getByRole("tab", { name: "unread" }));

    expect(screen.getByText("Assignment submitted")).toBeInTheDocument();
    expect(screen.queryByText("Live class reminder")).not.toBeInTheDocument();
  });

  it("saves a notification as read when it's opened", async () => {
    const api = notificationRoutes();
    renderPanel();

    await userEvent.click(await screen.findByText("Assignment submitted"));

    await waitFor(() => expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument());
    expect(api.bodies("PATCH /notifications/n1/read")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Mark all as read" })).not.toBeInTheDocument();
  });

  it("doesn't save a notification that's already read", async () => {
    const api = notificationRoutes();
    renderPanel();

    await userEvent.click(await screen.findByText("Live class reminder"));

    expect(api.fetchMock).toHaveBeenCalledTimes(1);
  });

  it("marks every notification as read", async () => {
    const api = notificationRoutes();
    renderPanel();
    await screen.findByText("Assignment submitted");

    await userEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

    await waitFor(() => expect(api.bodies("PATCH /notifications/read-all")).toHaveLength(1));
    const list = screen.getByRole("list");
    expect(within(list).queryByLabelText("Unread")).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";

import {
  categoryOf,
  liveSessionAction,
  liveSessionIdOf,
  notificationStamp,
  type AdminNotification,
} from "@/lib/admin-notifications";

const base: AdminNotification = {
  id: "n1",
  title: "",
  body: "",
  type: "GENERAL",
  isRead: false,
  createdAt: "2026-11-27T09:00:00.000Z",
};

describe("categoryOf", () => {
  it("groups the API's notification types", () => {
    expect(categoryOf("LIVE_CLASS_REMINDER")).toBe("live");
    expect(categoryOf("LIVE_SESSION_CANCELLED")).toBe("live");
    expect(categoryOf("ASSIGNMENT_OVERDUE")).toBe("assignments");
    expect(categoryOf("TASK_SUBMITTED")).toBe("assignments");
    expect(categoryOf("FEEDBACK_AND_REVIEWS")).toBe("assignments");
    expect(categoryOf("STUDENT_DANGER")).toBe("students");
    expect(categoryOf("MENTOR_REASSIGNED")).toBe("mentorship");
    expect(categoryOf("NEW_LESSONS_AND_RECORDINGS")).toBe("lessons");
    expect(categoryOf("GENERAL")).toBe("general");
  });
});

describe("liveSessionIdOf", () => {
  it("reads the session from the data, then the entity", () => {
    expect(liveSessionIdOf({ ...base, data: { liveSessionId: "s1" } })).toBe("s1");
    expect(liveSessionIdOf({ ...base, entityType: "LIVE_SESSION", entityId: "s2" })).toBe("s2");
    expect(liveSessionIdOf({ ...base, entityType: "MENTORSHIP", entityId: "m1" })).toBeNull();
  });
});

describe("liveSessionAction", () => {
  it("joins a live session and links to the others", () => {
    expect(liveSessionAction({ id: "s1", status: "live" })).toEqual({
      label: "Join session",
      href: "/admin/live/s1",
    });
    expect(liveSessionAction({ id: "s1", status: "upcoming" })).toEqual({
      label: "View live session",
      href: "/admin/live-sessions?session=s1",
    });
    expect(liveSessionAction({ id: "s1", status: "completed" })?.label).toBe("View live session");
    expect(liveSessionAction({ id: "s1", status: "cancelled" })).toBeNull();
  });
});

describe("notificationStamp", () => {
  const now = new Date(2026, 10, 27, 12, 0);

  it("says today, yesterday, or the date", () => {
    expect(notificationStamp(new Date(2026, 10, 27, 6, 47).toISOString(), now)).toBe("Today at 6:47 AM");
    expect(notificationStamp(new Date(2026, 10, 26, 21, 47).toISOString(), now)).toBe("Yesterday at 9:47 PM");
    expect(notificationStamp(new Date(2026, 8, 22, 9, 5).toISOString(), now)).toBe("Sep 22 at 9:05 AM");
    expect(notificationStamp(new Date(2025, 8, 22, 9, 5).toISOString(), now)).toBe("Sep 22, 2025 at 9:05 AM");
  });
});

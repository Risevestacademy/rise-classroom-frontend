import { describe, expect, it } from "vitest";

import { notificationText } from "@/lib/notification-text";

const local = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

describe("notificationText", () => {
  it("shows the backend's UTC times in the reader's own time zone", () => {
    expect(notificationText("hello is scheduled for 2026-11-23T23:00:00.000Z.")).toBe(
      `hello is scheduled for ${local("2026-11-23T23:00:00.000Z")}.`,
    );
    expect(notificationText("Test starts at 2026-11-23T22:45:00Z")).not.toMatch(/T22:45/);
  });

  it("leaves other text alone", () => {
    expect(notificationText("Class starts in 15 minutes.")).toBe("Class starts in 15 minutes.");
    expect(notificationText("Version 2026-11-23 is out")).toBe("Version 2026-11-23 is out");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { UpcomingEvents } from "@/components/student-dashboard/UpcomingEvents";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const session = (id: string, title: string, type: string, status: string, start: string, end: string) => ({
  id,
  title,
  roomName: id,
  type,
  status,
  hostId: "h1",
  scheduledStartAt: start,
  scheduledEndAt: end,
  timezone: "Africa/Lagos",
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("UpcomingEvents", () => {
  it("shows the student's next live sessions, live first, with Join only on the one that's live", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T17:50:00Z"));
    mockApi({
      "GET /live-sessions": envelope({
        items: [
          session("soon", "Design class", "TRACK_MEETING", "SCHEDULED", "2026-11-24T18:00:00Z", "2026-11-24T19:00:00Z"),
          session("hall", "Town hall", "TOWNHALL", "SCHEDULED", "2026-11-27T17:00:00Z", "2026-11-27T18:00:00Z"),
          session("now", "Office hours", "MENTORSHIP_GROUP", "LIVE", "2026-11-24T17:30:00Z", "2026-11-24T18:30:00Z"),
          session("done", "Old class", "TRACK_MEETING", "ENDED", "2026-11-23T17:00:00Z", "2026-11-23T18:00:00Z"),
        ],
        nextCursor: null,
      }),
    });
    renderWithClient(<UpcomingEvents />);

    const titles = await screen.findAllByText(/class|hall|hours/i, { selector: "p.truncate" });
    expect(titles.map((title) => title.textContent)).toEqual(["Office hours", "Design class", "Town hall"]);
    expect(screen.getByText("Now")).toBeInTheDocument();
    // Base UI gives the links a button role.
    const joins = screen.getAllByRole("button", { name: "Join" }).map((join) => join.closest("a")?.getAttribute("href"));
    // One starting in 10 minutes waits for the host to start it.
    expect(joins).toEqual(["/student/live/now"]);
    expect(screen.getByText("27 Nov")).toBeInTheDocument();
    expect(screen.getByText("6:00 PM")).toBeInTheDocument();
  });

  it("says when nothing is coming up", async () => {
    mockApi({ "GET /live-sessions": envelope({ items: [], nextCursor: null }) });
    renderWithClient(<UpcomingEvents />);

    expect(await screen.findByText("No upcoming events")).toBeInTheDocument();
  });
});

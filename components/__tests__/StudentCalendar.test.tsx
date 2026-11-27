import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { toDateKey } from "@/lib/calendar";
import { toCalendarEvent, type CalendarItem } from "@/lib/calendar-events";
import { zonedTimeToIso } from "@/lib/live-sessions";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: StudentCalendarPage } = await import("@/app/student/calendar/page");
const { CalendarAreaProvider } = await import("@/components/calendar/CalendarArea");

const today = toDateKey(new Date());

function item(overrides: Partial<CalendarItem>): CalendarItem {
  return {
    id: "item",
    kind: "live_session",
    source: "LIVE_SESSION",
    type: "TRACK_MEETING",
    title: "Item",
    description: null,
    start: zonedTimeToIso(today, "12:00"),
    end: zonedTimeToIso(today, "13:00"),
    allDay: false,
    timezone: "Africa/Lagos",
    isRecurring: false,
    seriesId: null,
    status: "SCHEDULED",
    host: { id: "host-1", name: "Grace Host", image: null },
    cohort: { id: "cohort-1", name: "Cohort 4" },
    canEdit: true,
    ...overrides,
  };
}

const items = [
  item({ id: "live-1", title: "Track standup" }),
  item({
    id: "event-1",
    kind: "event",
    source: "CALENDAR_EVENT",
    type: null,
    title: "Demo day",
    start: zonedTimeToIso(today, "15:00"),
    end: zonedTimeToIso(today, "16:00"),
    tracks: [{ id: "track-1", name: "Design" }],
    allTracks: false,
    meetingUrl: "https://meet.example.com/demo",
    color: "#2e7d32",
  }),
  item({
    id: "weekly-1",
    kind: "task",
    source: "WEEKLY_TASK",
    type: null,
    title: "Weekly reflection",
    canEdit: false,
  }),
  item({
    id: "task-1",
    kind: "task",
    source: "CALENDAR_TASK",
    type: null,
    title: "My todo",
    host: null,
  }),
];

const guests = Array.from({ length: 12 }, (_, index) => ({
  id: `guest-${index + 1}`,
  name: `Guest ${index + 1}`,
  image: null,
}));

function renderPage(routes: Record<string, unknown> = {}) {
  mockApi({
    "GET /auth/get-session": { user: { id: "student-1", role: "STUDENT" }, session: {} },
    "GET /calendar/events": envelope({ items }),
    "GET /calendar/events/live-1": envelope({ ...items[0], participants: [] }),
    "GET /calendar/events/event-1": envelope({
      ...items[1],
      participants: guests,
      participantCount: guests.length,
    }),
    ...routes,
  });
  return renderWithClient(
    <CalendarAreaProvider area="student">
      <StudentCalendarPage />
    </CalendarAreaProvider>,
  );
}

describe("student calendar", () => {
  it("shows live sessions and events, but no tasks", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", { name: /Track standup/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Demo day/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Weekly reflection/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /My todo/ })).not.toBeInTheDocument();
  });

  it("has nothing to create or change", async () => {
    const { user } = renderPage();

    await screen.findByRole("button", { name: /Track standup/ }, { timeout: 5000 });
    expect(screen.queryByRole("button", { name: "Create event" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Track standup/ }));
    await screen.findByRole("button", { name: "Close" });
    expect(screen.queryByRole("button", { name: "Edit live session" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel live session" })).not.toBeInTheDocument();
  });

  it("joins a live session in the student's live room", async () => {
    const { user } = renderPage();

    await user.click(
      await screen.findByRole("button", { name: /Track standup/ }, { timeout: 5000 }),
    );
    expect(await screen.findByRole("link", { name: /Join Live Session/ })).toHaveAttribute(
      "href",
      "/student/live/live-1",
    );
  });

  it("opens an event's own meeting link", async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole("button", { name: /Demo day/ }, { timeout: 5000 }));
    expect(await screen.findByRole("link", { name: /Join meeting/ })).toHaveAttribute(
      "href",
      "https://meet.example.com/demo",
    );
  });

  it("lists every guest of an event", async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole("button", { name: /Demo day/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("button", { name: "12 guests" }));

    expect(screen.getByText("Guest 1")).toBeInTheDocument();
    expect(screen.getByText("Guest 12")).toBeInTheDocument();
  });

  it("gives the guest count when the organizer hides the list", async () => {
    const { user } = renderPage({
      "GET /calendar/events/event-1": envelope({
        ...items[1],
        participants: null,
        participantCount: 3,
      }),
    });

    await user.click(await screen.findByRole("button", { name: /Demo day/ }, { timeout: 5000 }));

    expect(await screen.findByText("3 guests")).toBeInTheDocument();
    expect(screen.getByText("· list hidden by the organizer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3 guests" })).not.toBeInTheDocument();
  });

  it("doesn't offer tasks in the filter", async () => {
    const { user } = renderPage();

    await screen.findByRole("button", { name: /Track standup/ }, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Filter" }));

    expect(await screen.findByText("Live sessions")).toBeInTheDocument();
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
  });
});

describe("toCalendarEvent with a plain event", () => {
  it("keeps its tracks, link and colour, and stays read-only", () => {
    const event = toCalendarEvent(items[1], "/admin");

    expect(event).toMatchObject({
      kind: "event",
      source: "CALENDAR_EVENT",
      trackIds: ["track-1"],
      link: "https://meet.example.com/demo",
      color: "#2e7d32",
      canEdit: false,
    });
  });
});

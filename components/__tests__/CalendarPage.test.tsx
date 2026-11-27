import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { addDays, toDateKey } from "@/lib/calendar";
import { toCalendarEvent, type CalendarItem } from "@/lib/calendar-events";
import { zonedTimeToIso } from "@/lib/live-sessions";
import { cohort, tracks } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/AdminTopNav", () => ({ AdminTopNav: () => null }));
vi.mock("@/components/AppTopNav", () => ({ AppTopNav: () => null }));

const { default: CalendarPage } = await import("@/app/admin/calendar/page");
const { default: MentorCalendarPage } = await import("@/app/mentor/calendar/page");
const { CalendarAreaProvider } = await import("@/components/calendar/CalendarArea");

const today = toDateKey(new Date());
const tomorrow = toDateKey(addDays(new Date(), 1));

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
    recurrence: null,
    status: "SCHEDULED",
    host: { id: "host-1", name: "Grace Host", image: null },
    cohort: { id: cohort.id, name: cohort.name },
    tracks: [],
    allTracks: false,
    meetingUrl: null,
    color: null,
    reminderMinutes: [15],
    guestPermissions: null,
    canEdit: true,
    ...overrides,
  };
}

const items = [
  item({ id: "live-1", title: "Track standup" }),
  item({ id: "ended-1", title: "Old retro", status: "ENDED", start: zonedTimeToIso(tomorrow, "12:00"), end: zonedTimeToIso(tomorrow, "13:00") }),
  item({
    id: "series-1",
    title: "Weekly sync",
    seriesId: "s-1",
    isRecurring: true,
    start: zonedTimeToIso(tomorrow, "15:00"),
    end: zonedTimeToIso(tomorrow, "16:00"),
  }),
  item({ id: "invite-1", title: "Invite chat", type: "EXPLICIT_INVITE", cohort: null }),
  item({ id: "other-1", title: "Other town hall", cohort: { id: "cohort-2", name: "Cohort 5" } }),
  item({
    id: "weekly-1",
    kind: "task",
    source: "WEEKLY_TASK",
    type: null,
    title: "Weekly reflection",
    canEdit: false,
    host: { id: "mentor-1", name: "Mo Mentor", image: null },
  }),
  item({
    id: "task-1",
    kind: "task",
    source: "CALENDAR_TASK",
    type: null,
    title: "My todo",
    host: null,
    start: zonedTimeToIso(tomorrow, "09:00"),
    end: zonedTimeToIso(tomorrow, "09:00"),
  }),
];

const weekday = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][new Date().getDay()];

const designReview = item({
  id: "event-1",
  kind: "event",
  source: "CALENDAR_EVENT",
  type: null,
  title: "Design review",
  seriesId: "es-1",
  isRecurring: true,
  recurrence: { rrule: `FREQ=WEEKLY;BYDAY=${weekday}`, endsOn: null },
  host: { id: "admin-1", name: "Ada Admin", image: null },
  meetingUrl: "https://meet.example.com/abc",
  color: "#2e7d32",
  reminderMinutes: [10, 60],
  guestPermissions: { modify: false, invite: true, seeGuestList: true },
});

function renderPage(routes: Record<string, unknown> = {}) {
  const api = mockApi({
    "GET /auth/get-session": { user: { id: "admin-1", role: "SUPERADMIN" }, session: {} },
    "GET /admin/cohorts": envelope([cohort]),
    "GET /admin/tracks": envelope(tracks),
    "GET /calendar/events": envelope({ items }),
    "GET /calendar/events/live-1": envelope({
      ...items[0],
      participants: [{ id: "s1", name: "Sam Student", image: null }],
    }),
    "GET /calendar/events/task-1": envelope({ ...items[6], participants: [], guestIds: [] }),
    ...routes,
  });
  return { ...renderWithClient(<CalendarPage />), api };
}

describe("CalendarPage", () => {
  it("shows the picked cohort's items and those with no cohort", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", { name: /Track standup/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invite chat/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Weekly reflection/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My todo/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Other town hall/ })).not.toBeInTheDocument();
  });

  it("lists a live session's participants and keeps weekly tasks and past sessions read-only", async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole("button", { name: /Track standup/ }));
    await user.click(await screen.findByRole("button", { name: "1 guest" }));
    expect(screen.getByText("Sam Student")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit live session" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: /Old retro/ }));
    await screen.findByRole("button", { name: "Close" });
    expect(screen.queryByRole("button", { name: "Edit live session" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: /Weekly reflection/ }));
    expect(await screen.findByText("Mo Mentor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete event" })).not.toBeInTheDocument();
  });

  it("deletes a calendar task through the API", async () => {
    const { user, api } = renderPage({
      "DELETE /calendar/events/task-1": envelope({}),
    });

    await user.click(await screen.findByRole("button", { name: /My todo/ }));
    await user.click(await screen.findByRole("button", { name: "Delete event" }));

    expect(await screen.findByText("Task deleted")).toBeInTheDocument();
    expect(api.bodies("DELETE /calendar/events/task-1")).toHaveLength(1);
  });

  it("creates a task in the picked cohort", async () => {
    const { user, api } = renderPage({
      "POST /calendar/events": (body: object) => envelope(item({ ...body, id: "task-2" })),
    });

    await screen.findByRole("button", { name: /Track standup/ });
    await user.click(screen.getByRole("button", { name: "Create event" }));
    await user.type(await screen.findByPlaceholderText("Add title"), "Read chapter 3");
    await user.click(screen.getByRole("radio", { name: "Task" }));
    await user.click(screen.getAllByRole("button", { name: "Create event" }).at(-1)!);

    expect(await screen.findByText("Task created")).toBeInTheDocument();
    expect(api.bodies("POST /calendar/events")).toEqual([
      expect.objectContaining({ kind: "task", title: "Read chapter 3", cohortId: cohort.id }),
    ]);
  });

  it("keeps the form open with the API's reason when a task can't be saved", async () => {
    const { user } = renderPage({
      "POST /calendar/events": reply(400, { message: "Task must fall within the cohort's dates" }),
    });

    await screen.findByRole("button", { name: /Track standup/ });
    await user.click(screen.getByRole("button", { name: "Create event" }));
    await user.type(await screen.findByPlaceholderText("Add title"), "Late task");
    await user.click(screen.getByRole("radio", { name: "Task" }));
    await user.click(screen.getAllByRole("button", { name: "Create event" }).at(-1)!);

    expect(await screen.findByRole("alert")).toHaveTextContent("cohort's dates");
    expect(screen.getByPlaceholderText("Add title")).toBeInTheDocument();
  });

  it("cancels the chosen sessions of a series after asking", async () => {
    const { user, api } = renderPage({
      "DELETE /calendar/events/series-1": (_body: unknown, url: URL) => {
        expect(url.searchParams.get("scope")).toBe("following");
        return envelope({});
      },
      "GET /calendar/events/series-1": envelope(items[2]),
    });

    await user.click(await screen.findByRole("button", { name: /Weekly sync/ }));
    await user.click(await screen.findByRole("button", { name: "Cancel live session" }));
    await user.click(await screen.findByRole("radio", { name: "This and following sessions" }));
    await user.click(screen.getByRole("button", { name: "Cancel session" }));

    expect(await screen.findByText("Live session cancelled")).toBeInTheDocument();
    expect(api.urls("DELETE /calendar/events/series-1")).toHaveLength(1);
  });

  it("opens a session in the live session editor", async () => {
    const { user } = renderPage({
      "GET /live-sessions/live-1": envelope({
        id: "live-1",
        title: "Track standup",
        type: "TRACK_MEETING",
        status: "SCHEDULED",
        scheduledStartAt: items[0].start,
        scheduledEndAt: items[0].end,
        timezone: "Africa/Lagos",
        hostId: "host-1",
      }),
    });

    await user.click(await screen.findByRole("button", { name: /Track standup/ }));
    await user.click(await screen.findByRole("button", { name: "Edit live session" }));

    expect(await screen.findByRole("heading", { name: "Edit live session" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add title")).toHaveValue("Track standup");
  });

  it("ticks a task off", async () => {
    const { user, api } = renderPage({
      "PATCH /calendar/events/task-1": envelope(items.at(-1)),
    });

    await user.click(await screen.findByRole("button", { name: /My todo/ }));
    await user.click(await screen.findByRole("checkbox", { name: "Done" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /calendar/events/task-1")).toEqual([{ completed: true }]),
    );
  });
});

describe("Events on the calendar", () => {
  const withEvent = {
    "GET /calendar/events": envelope({ items: [designReview] }),
    "GET /calendar/events/event-1": envelope({
      ...designReview,
      participants: [
        { id: "u-7", name: "Gift Guest", image: null },
        { id: "u-8", name: "Track Student", image: null },
      ],
      guestIds: ["u-7"],
      canInvite: true,
    }),
  };

  it("reads an event's tracks, link, colour, reminders and repeat", () => {
    const event = toCalendarEvent({
      ...designReview,
      tracks: [{ id: "track-2", name: "Backend" }],
    });
    expect(event).toMatchObject({
      kind: "event",
      trackIds: ["track-2"],
      link: "https://meet.example.com/abc",
      color: "#2e7d32",
      notifications: [10, 60],
      permissions: { modify: false, invite: true, seeGuests: true },
      repeat: { frequency: "week", interval: 1 },
    });
    expect(toCalendarEvent({ ...designReview, allTracks: true }).trackIds).toBe("all");
    expect(toCalendarEvent(item({})).trackIds).toBe("all");
  });

  it("creates an event with its link, colour, reminders and guest permissions", async () => {
    const { user, api } = renderPage({
      "POST /calendar/events": (body: object) => envelope(item({ ...body, id: "event-2" })),
    });

    await screen.findByRole("button", { name: /Track standup/ });
    await user.click(screen.getByRole("button", { name: "Create event" }));
    await user.type(await screen.findByPlaceholderText("Add title"), "Demo day");
    await user.type(screen.getByPlaceholderText("www.classroom.com"), "meet.example.com/x");
    await user.click(screen.getByRole("radio", { name: "#2e7d32" }));
    await user.click(screen.getAllByRole("button", { name: "Create event" }).at(-1)!);

    expect(await screen.findByText("Event created")).toBeInTheDocument();
    const [body] = api.bodies("POST /calendar/events");
    expect(body).toMatchObject({
      kind: "event",
      title: "Demo day",
      cohortId: cohort.id,
      meetingUrl: "https://meet.example.com/x",
      color: "#2e7d32",
      reminderMinutes: [10],
      guestIds: [],
      trackIds: [],
      allTracks: false,
      guestPermissions: { modify: false, invite: false, seeGuestList: true },
    });
    expect(body).not.toHaveProperty("recurrence");
  });

  it("opens an event's own meeting link", async () => {
    const { user } = renderPage(withEvent);

    await user.click(await screen.findByRole("button", { name: /Design review/ }, { timeout: 5000 }));
    expect(await screen.findByRole("link", { name: "Join meeting" })).toHaveAttribute(
      "href",
      "https://meet.example.com/abc",
    );
    expect(screen.getByText("10 minutes before, 1 hour before")).toBeInTheDocument();
  });

  it("edits the chosen occurrences of a repeating event, keeping its guests", async () => {
    const { user, api } = renderPage({
      ...withEvent,
      "PATCH /calendar/events/event-1": envelope(designReview),
    });

    await user.click(await screen.findByRole("button", { name: /Design review/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("button", { name: "Edit event" }));
    const title = await screen.findByPlaceholderText("Add title");
    expect(screen.getByText("Gift Guest")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Task" })).not.toBeInTheDocument();
    await user.clear(title);
    await user.type(title, "Design crit");
    await user.click(screen.getByRole("radio", { name: "This and following events" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Event updated")).toBeInTheDocument();
    const [body] = api.bodies("PATCH /calendar/events/event-1");
    expect(body).toMatchObject({
      scope: "following",
      title: "Design crit",
      guestIds: ["u-7"],
      color: "#2e7d32",
      meetingUrl: "https://meet.example.com/abc",
    });
    // The repeat didn't change, so the occurrences aren't recreated.
    expect(body).not.toHaveProperty("rrule");
  });

  it("asks which occurrences of a repeating event to delete", async () => {
    const { user, api } = renderPage({
      ...withEvent,
      "DELETE /calendar/events/event-1": envelope({}),
    });

    await user.click(await screen.findByRole("button", { name: /Design review/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("button", { name: "Delete event" }));
    await user.click(await screen.findByRole("radio", { name: "All events" }));
    await user.click(screen.getByRole("button", { name: "Delete event" }));

    expect(await screen.findByText("Event deleted")).toBeInTheDocument();
    expect(new URL(api.urls("DELETE /calendar/events/event-1")[0]).searchParams.get("scope")).toBe("all");
  });
});

describe("The mentor's calendar", () => {
  function renderMentorPage(routes: Record<string, unknown> = {}) {
    const api = mockApi({
      "GET /auth/get-session": { user: { id: "mentor-1", role: "MENTOR" }, session: {} },
      "GET /mentors/my-mentees": envelope([
        {
          id: "mentorship-1",
          assignedAt: "2026-11-05T07:26:13.769Z",
          student: {
            id: "profile-1",
            cohort: { id: "cohort-9", name: "Cohort 9" },
            user: { id: "u-1", name: "Halima Obi", email: "halima@example.com" },
          },
        },
      ]),
      "GET /calendar/events": envelope({ items }),
      ...routes,
    });
    const view = renderWithClient(
      <CalendarAreaProvider area="mentor">
        <MentorCalendarPage />
      </CalendarAreaProvider>,
    );
    const adminCalls = () =>
      api.fetchMock.mock.calls.map(([input]) => String(input)).filter((url) => url.includes("/admin/"));
    return { ...view, api, adminCalls };
  }

  it("shows everything on their calendar and joins sessions in the mentor area", async () => {
    const { user, adminCalls } = renderMentorPage({
      "GET /calendar/events/live-1": envelope({ ...items[0], participants: [] }),
    });

    // Nothing is hidden by cohort, so today's fourth item is behind "+2 more".
    await user.click(await screen.findByRole("button", { name: "+2 more" }, { timeout: 5000 }));
    expect(await screen.findByText(/Other town hall/)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(await screen.findByRole("button", { name: /Track standup/ }));
    expect(await screen.findByRole("link", { name: "Join Live Session" })).toHaveAttribute("href", "/mentor/live/live-1");
    expect(adminCalls()).toEqual([]);
  });

  it("keeps new tasks in their students' cohort", async () => {
    const { user, api } = renderMentorPage({
      "POST /calendar/events": (body: object) => envelope(item({ ...body, id: "task-2" })),
    });

    await user.click(await screen.findByRole("button", { name: "Create event" }));
    await user.type(await screen.findByPlaceholderText("Add title"), "Prep notes");
    await user.click(screen.getByRole("radio", { name: "Task" }));
    await user.click(screen.getAllByRole("button", { name: "Create event" }).at(-1)!);

    expect(await screen.findByText("Task created")).toBeInTheDocument();
    expect(api.bodies("POST /calendar/events")[0]).toMatchObject({ kind: "task", cohortId: "cohort-9" });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { CalendarAreaProvider } from "@/components/calendar/CalendarArea";
import { EventFormDialog, type EventDraft } from "@/components/calendar/EventFormDialog";
import { toRrule } from "@/lib/calendar";
import { zonedTimeToIso } from "@/lib/live-sessions";
import { cohort, makeUser, tracks } from "@/test/fixtures";
import { envelope, mockApi, reply, renderWithClient } from "@/test/utils";

const draft: EventDraft = {
  kind: "event",
  title: "",
  date: "2027-01-15",
  endDate: "2027-01-15",
  startTime: "09:00",
  endTime: "10:30",
  allDay: false,
  repeat: null,
  trackIds: [],
  link: "",
  description: "",
  guests: [],
  permissions: { modify: false, invite: false, seeGuests: true },
  notifications: [10],
  color: "#000000",
  attachments: [],
};

const created = envelope({ id: "s-1", title: "Kickoff", status: "SCHEDULED" });

function renderDialog(routes: Parameters<typeof mockApi>[0]) {
  const api = mockApi({
    "GET /admin/tracks": envelope(tracks),
    "GET /admin/cohorts": envelope([cohort]),
    "GET /admin/users": envelope({
      items: [makeUser({ id: "i-1", name: "Tola Ade", role: "INSTRUCTOR" })],
      page: 1,
      limit: 100,
      total: 1,
      totalPages: 1,
    }),
    ...routes,
  });
  const onSubmit = vi.fn();
  const onLiveSessionCreated = vi.fn();
  const view = renderWithClient(
    <EventFormDialog
      open
      onOpenChange={() => {}}
      mode="create"
      initial={draft}
      onSubmit={onSubmit}
      hasEvents={() => false}
      onLiveSessionCreated={onLiveSessionCreated}
    />,
  );
  return { ...view, api, onSubmit, onLiveSessionCreated };
}

async function pick(user: ReturnType<typeof renderWithClient>["user"], label: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: new RegExp(`^${label}`) }));
  await user.click(await screen.findByRole("option", { name: option }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("live session helpers", () => {
  it("reads a Lagos wall-clock time as the right instant", () => {
    expect(zonedTimeToIso("2027-01-15", "09:00")).toBe("2027-01-15T08:00:00.000Z");
    expect(zonedTimeToIso("2027-07-01", "00:30", "Europe/London")).toBe("2027-06-30T23:30:00.000Z");
  });

  it("writes repeat rules as RRULEs", () => {
    const friday = new Date(2027, 0, 29);
    expect(toRrule({ frequency: "week", interval: 2, weekdays: [3, 1], ends: { type: "after", count: 5 } }, friday)).toBe(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=5",
    );
    expect(toRrule({ frequency: "month", interval: 1, monthlyOn: "weekday", ends: { type: "never" } }, friday)).toBe(
      "FREQ=MONTHLY;BYDAY=-1FR",
    );
  });
});

describe("Scheduling a live session from the calendar", () => {
  it("keeps what was typed, asks for the track meeting's cohort and track, and schedules it", async () => {
    const { user, api, onLiveSessionCreated, onSubmit } = renderDialog({
      "POST /live-sessions": created,
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Kickoff");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    expect(screen.getByRole("heading", { name: "Schedule live session" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add title")).toHaveValue("Kickoff");

    const schedule = screen.getByRole("button", { name: "Schedule session" });
    expect(schedule).toBeDisabled();
    await pick(user, "Cohort", "Cohort 4");
    await pick(user, "Track", "Backend");
    await pick(user, "Host", "Tola Ade");
    await user.click(schedule);

    await vi.waitFor(() => expect(onLiveSessionCreated).toHaveBeenCalledWith("Kickoff"));
    expect(api.bodies("POST /live-sessions")[0]).toEqual({
      type: "TRACK_MEETING",
      title: "Kickoff",
      hostId: "i-1",
      scheduledStartAt: "2027-01-15T08:00:00.000Z",
      scheduledEndAt: "2027-01-15T09:30:00.000Z",
      timezone: "Africa/Lagos",
      cohortId: "cohort-1",
      trackId: "track-2",
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("schedules a repeating town hall as a series", async () => {
    const { user, api, onLiveSessionCreated } = renderDialog({
      "POST /live-sessions/series": created,
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Town hall");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    await pick(user, "Who it", "Town hall");
    await pick(user, "Cohort", "Cohort 4");
    await user.click(screen.getByRole("button", { name: "Do not repeat" }));
    await user.click(await screen.findByRole("menuitem", { name: /Weekly on Friday/ }));
    await user.click(screen.getByRole("button", { name: "Schedule session" }));

    await vi.waitFor(() => expect(onLiveSessionCreated).toHaveBeenCalled());
    expect(api.bodies("POST /live-sessions/series")[0]).toEqual({
      type: "TOWNHALL",
      title: "Town hall",
      scheduledStartAt: "2027-01-15T08:00:00.000Z",
      timezone: "Africa/Lagos",
      cohortId: "cohort-1",
      inviteeIds: [],
      rrule: "FREQ=WEEKLY;BYDAY=FR",
      defaultDurationMinutes: 90,
    });
  });

  it("asks for a mentorship group's cohort and sends it with the mentor", async () => {
    const { user, api, onLiveSessionCreated } = renderDialog({
      "POST /live-sessions": created,
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Group check-in");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    await pick(user, "Who it", "Mentorship group");
    const schedule = screen.getByRole("button", { name: "Schedule session" });
    await pick(user, "Mentor", "Tola Ade");
    expect(schedule).toBeDisabled();
    await pick(user, "Cohort", "Cohort 4");
    expect(schedule).toBeDisabled();
    await pick(user, "Mentor", "Tola Ade");
    await user.click(schedule);

    await vi.waitFor(() => expect(onLiveSessionCreated).toHaveBeenCalled());
    expect(api.bodies("POST /live-sessions")[0]).toMatchObject({
      type: "MENTORSHIP_GROUP",
      hostId: "i-1",
      cohortId: "cohort-1",
      mentorId: "i-1",
    });
    expect(api.urls("GET /admin/users").some((url) => url.searchParams.get("cohortId") === "cohort-1")).toBe(true);
  });

  it("shows why the API turned it down", async () => {
    const { user, onLiveSessionCreated } = renderDialog({
      "POST /live-sessions": reply(409, { success: false, message: "The host already has a session then" }),
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Kickoff");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    await pick(user, "Cohort", "Cohort 4");
    await pick(user, "Track", "Frontend");
    await user.click(screen.getByRole("button", { name: "Schedule session" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The host already has a session then");
    expect(onLiveSessionCreated).not.toHaveBeenCalled();
  });
});

describe("A mentor scheduling their own session", () => {
  const myMentees = envelope([
    {
      id: "mentorship-1",
      assignedAt: "2026-11-05T07:26:13.769Z",
      student: {
        id: "profile-1",
        cohort: { id: "cohort-1", name: "Cohort 4" },
        user: { id: "u-1", name: "Halima Obi", email: "halima@example.com" },
      },
    },
    {
      id: "mentorship-2",
      assignedAt: "2026-11-05T07:26:13.769Z",
      student: {
        id: "profile-2",
        cohort: { id: "cohort-1", name: "Cohort 4" },
        user: { id: "u-2", name: "Yusuf Balogun", email: "yusuf@example.com" },
      },
    },
  ]);

  function renderAsMentor(routes: Parameters<typeof mockApi>[0]) {
    const api = mockApi({
      "GET /auth/get-session": { user: { id: "mentor-1", name: "Ada Mentor", email: "ada@example.com" } },
      "GET /mentors/my-mentees": myMentees,
      ...routes,
    });
    const onLiveSessionCreated = vi.fn();
    const view = renderWithClient(
      <CalendarAreaProvider area="mentor">
        <EventFormDialog
          open
          onOpenChange={() => {}}
          mode="create"
          initial={draft}
          onSubmit={vi.fn()}
          hasEvents={() => false}
          onLiveSessionCreated={onLiveSessionCreated}
        />
      </CalendarAreaProvider>,
    );
    const adminCalls = () =>
      api.fetchMock.mock.calls.map(([input]) => String(input)).filter((url) => url.includes("/admin/"));
    return { ...view, api, onLiveSessionCreated, adminCalls };
  }

  it("books a one-on-one with one of their students, hosted by themselves", async () => {
    const { user, api, onLiveSessionCreated, adminCalls } = renderAsMentor({
      "POST /live-sessions": created,
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Weekly check-in");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    await user.click(screen.getByRole("combobox", { name: /^Who it/ }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "One-on-one mentorship",
      "Mentorship group",
    ]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("combobox", { name: /^Mentor/ })).not.toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();

    await pick(user, "Student", "Yusuf Balogun");
    await user.click(screen.getByRole("button", { name: "Schedule session" }));

    await vi.waitFor(() => expect(onLiveSessionCreated).toHaveBeenCalledWith("Weekly check-in"));
    expect(api.bodies("POST /live-sessions")[0]).toEqual({
      type: "MENTORSHIP_PAIR",
      title: "Weekly check-in",
      hostId: "mentor-1",
      scheduledStartAt: "2027-01-15T08:00:00.000Z",
      scheduledEndAt: "2027-01-15T09:30:00.000Z",
      timezone: "Africa/Lagos",
      mentorId: "mentor-1",
      mentorshipId: "mentorship-2",
      studentProfileId: "profile-2",
    });
    expect(adminCalls()).toEqual([]);
  });

  it("runs a group for their students' cohort without asking for it", async () => {
    const { user, api, onLiveSessionCreated, adminCalls } = renderAsMentor({
      "POST /live-sessions": created,
    });

    await user.type(screen.getByPlaceholderText("Add title"), "Group session");
    await user.click(screen.getByRole("radio", { name: "Live session" }));
    await pick(user, "Who it", "Mentorship group");
    await user.click(await screen.findByRole("button", { name: "Schedule session" }));

    await vi.waitFor(() => expect(onLiveSessionCreated).toHaveBeenCalled());
    expect(api.bodies("POST /live-sessions")[0]).toMatchObject({
      type: "MENTORSHIP_GROUP",
      hostId: "mentor-1",
      mentorId: "mentor-1",
      cohortId: "cohort-1",
    });
    expect(adminCalls()).toEqual([]);
  });

  it("invites their own students as guests, without the track picker", async () => {
    const { user, adminCalls } = renderAsMentor({});

    expect(screen.queryByText("Select track")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add guests" }));
    await user.type(await screen.findByPlaceholderText("Search people"), "yus");
    expect(await screen.findByText("Yusuf Balogun")).toBeInTheDocument();
    expect(screen.queryByText("Halima Obi")).not.toBeInTheDocument();
    expect(adminCalls()).toEqual([]);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";
import { JoinHub } from "@/components/live-room/JoinHub";
import {
  byRelevance,
  isComingUp,
  nextOfEachSeries,
  toLiveSession,
  type ApiLiveSession,
} from "@/lib/live-sessions";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const session = (overrides: Partial<ApiLiveSession>): ApiLiveSession => ({
  id: "s-1",
  title: "UI/UX live class",
  description: "Wireframes",
  roomName: "rise-session-1",
  type: "TRACK_MEETING",
  status: "SCHEDULED",
  hostId: "h-1",
  host: { id: "h-1", name: "Ada Obi" },
  scheduledStartAt: "2026-11-23T18:00:00.000Z",
  scheduledEndAt: "2026-11-23T19:00:00.000Z",
  track: { id: "t-1", name: "Design" },
  ...overrides,
});

const participants = envelope({
  items: [
    { userId: "h-1", name: "Ada Obi", platformRole: "INSTRUCTOR", sessionRole: "HOST", email: "ada@example.com" },
    { userId: "u-2", name: "Tola Ade", displayName: "Tola", platformRole: "STUDENT", sessionRole: "PARTICIPANT" },
  ],
  total: 2,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("toLiveSession", () => {
  it("shows the time in Lagos and the track's name", () => {
    expect(toLiveSession(session({}), Date.parse("2026-11-23T12:00:00Z"))).toMatchObject({
      date: "2026-11-23",
      startTime: "19:00",
      endTime: "20:00",
      status: "upcoming",
      trackName: "Design",
      hostName: "Ada Obi",
    });
  });
});

describe("the status shown", () => {
  // The fixture runs 18:00–19:00 UTC on Nov 23.
  const at = (iso: string) => Date.parse(iso);

  it("shows a scheduled session nobody started as completed once its time is over", () => {
    expect(toLiveSession(session({}), at("2026-11-23T18:30:00Z")).status).toBe("upcoming");
    expect(toLiveSession(session({}), at("2026-11-23T19:00:00Z")).status).toBe("completed");
  });

  it("keeps a live session live while it runs over, until an hour past its end", () => {
    const live = session({ status: "LIVE" });
    expect(toLiveSession(live, at("2026-11-23T19:59:00Z")).status).toBe("live");
    expect(toLiveSession(live, at("2026-11-23T20:00:00Z")).status).toBe("completed");
  });

  it("trusts the backend for ended and cancelled sessions", () => {
    expect(toLiveSession(session({ status: "ENDED" }), at("2026-11-23T17:00:00Z")).status).toBe("completed");
    expect(toLiveSession(session({ status: "CANCELLED" }), at("2026-11-23T17:00:00Z")).status).toBe("cancelled");
  });
});

describe("which sessions show first", () => {
  // 10:00 in Lagos on Nov 23.
  const now = Date.parse("2026-11-23T09:00:00Z");
  const at = (id: string, status: ApiLiveSession["status"], start: string, seriesId?: string) =>
    toLiveSession(
      session({
        id,
        status,
        seriesId,
        scheduledStartAt: start,
        scheduledEndAt: new Date(Date.parse(start) + 3_600_000).toISOString(),
      }),
      now,
    );

  it("puts live first, then everything coming up soonest first, then finished ones latest first", () => {
    const sessions = [
      at("last-week", "ENDED", "2026-11-16T09:00:00Z"),
      at("next-week", "SCHEDULED", "2026-11-30T09:00:00Z"),
      at("this-morning", "ENDED", "2026-11-23T06:00:00Z"),
      at("tonight", "SCHEDULED", "2026-11-23T18:00:00Z"),
      at("yesterday", "ENDED", "2026-11-22T09:00:00Z"),
      at("this-afternoon", "SCHEDULED", "2026-11-23T13:00:00Z"),
      at("live", "LIVE", "2026-11-23T08:30:00Z"),
      at("earlier-today", "ENDED", "2026-11-23T07:30:00Z"),
      at("tomorrow", "SCHEDULED", "2026-11-24T09:00:00Z"),
    ];
    expect(sessions.sort(byRelevance).map((s) => s.id)).toEqual([
      "live",
      "this-afternoon",
      "tonight",
      "tomorrow",
      "next-week",
      "earlier-today",
      "this-morning",
      "yesterday",
      "last-week",
    ]);
  });

  it("shows a repeating session once, at its next occurrence, and keeps its past ones", () => {
    const sessions = [
      at("retro-1", "ENDED", "2026-11-16T09:00:00Z", "retro"),
      at("retro-3", "SCHEDULED", "2026-11-30T09:00:00Z", "retro"),
      at("retro-2", "SCHEDULED", "2026-11-23T13:00:00Z", "retro"),
      at("retro-4", "SCHEDULED", "2026-12-07T09:00:00Z", "retro"),
      at("one-off", "SCHEDULED", "2026-11-30T09:00:00Z"),
    ];
    expect(nextOfEachSeries(sessions).map((s) => s.id)).toEqual(["retro-1", "retro-2", "one-off"]);
  });

  it("counts as upcoming what's live or starts within two days, every occurrence of a series", () => {
    const sessions = [
      at("live", "LIVE", "2026-11-23T08:30:00Z"),
      at("daily-today", "SCHEDULED", "2026-11-23T13:00:00Z", "daily"),
      at("daily-tomorrow", "SCHEDULED", "2026-11-24T13:00:00Z", "daily"),
      at("daily-in-3-days", "SCHEDULED", "2026-11-26T13:00:00Z", "daily"),
      at("next-week", "SCHEDULED", "2026-11-30T09:00:00Z"),
      at("done", "ENDED", "2026-11-23T06:00:00Z"),
    ];
    expect(sessions.filter((s) => isComingUp(s, now)).map((s) => s.id)).toEqual([
      "live",
      "daily-today",
      "daily-tomorrow",
    ]);
  });

  it("keeps the live occurrence of a repeating session over the next one", () => {
    const sessions = [
      at("retro-next", "SCHEDULED", "2026-11-30T09:00:00Z", "retro"),
      at("retro-now", "LIVE", "2026-11-23T08:30:00Z", "retro"),
    ];
    expect(nextOfEachSeries(sessions).map((s) => s.id)).toEqual(["retro-now"]);
  });
});

describe("LiveSessionsScreen", () => {
  it("lists the sessions from the API, live first, and previews one with its participants", async () => {
    mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({ id: "past", title: "Old class", status: "ENDED", scheduledStartAt: "2026-11-01T18:00:00Z", scheduledEndAt: "2026-11-01T19:00:00Z" }),
          session({ id: "live", title: "Live class", status: "LIVE" }),
          session({ id: "gone", title: "Cancelled class", status: "CANCELLED" }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/live/participants": participants,
      "GET /live-sessions/past/participants": participants,
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} joinPath="/admin/live" />);

    const titles = await screen.findAllByRole("button", { pressed: false, name: /class$/ });
    expect(titles.map((title) => title.textContent)).toEqual(["Live class", "Old class"]);

    await user.click(screen.getByRole("button", { name: "Live class" }));
    expect(await screen.findByRole("heading", { name: "Participants (2)" })).toBeInTheDocument();
    expect(screen.getByText("Join session").closest("a")).toHaveAttribute("href", "/admin/live/live");
  });

  it("closes the preview when the open session is clicked again", async () => {
    mockApi({
      "GET /live-sessions": envelope({ items: [session({ id: "live", title: "Live class", status: "LIVE" })], nextCursor: null }),
      "GET /live-sessions/live/participants": participants,
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} />);

    expect(screen.queryByRole("complementary", { name: "Session preview" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Live class" }));
    expect(screen.getByRole("complementary", { name: "Session preview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Live class", pressed: true }));
    await vi.waitFor(() =>
      expect(screen.queryByRole("complementary", { name: "Session preview" })).not.toBeInTheDocument(),
    );
  });

  it("says when there are no sessions", async () => {
    mockApi({ "GET /live-sessions": envelope({ items: [], nextCursor: null }) });
    renderWithClient(<LiveSessionsScreen topNav={null} />);

    expect(await screen.findByText(/No live sessions yet/)).toBeInTheDocument();
  });
});

describe("A completed session", () => {
  const past = session({
    id: "past",
    title: "Old class",
    status: "ENDED",
    scheduledStartAt: "2026-11-01T18:00:00Z",
    scheduledEndAt: "2026-11-01T19:00:00Z",
  });
  const attendee = (id: string, name: string, status: "PRESENT" | "ABSENT", seconds: number) => ({
    user: { id, name, displayName: null, image: null },
    status,
    totalConnectedSeconds: seconds,
  });

  it("shows who attended and plays the recording", async () => {
    mockApi({
      "GET /live-sessions": envelope({ items: [past], nextCursor: null }),
      "GET /live-sessions/past/participants": participants,
      "GET /live-sessions/past/attendance": envelope({
        attendances: [attendee("u-2", "Tola Ade", "ABSENT", 60), attendee("h-1", "Ada Obi", "PRESENT", 2700)],
      }),
      "GET /live-sessions/past/recording": envelope({ id: "r-1", status: "READY", durationSeconds: 3600 }),
      "GET /live-sessions/past/recording/url": envelope({ signedUrl: "https://files.example.com/rec/past.mp4?sig=1" }),
    });
    const { user, container } = renderWithClient(<LiveSessionsScreen topNav={null} />);

    await user.click(await screen.findByRole("button", { name: "Old class" }));
    expect(await screen.findByRole("heading", { name: "Attendance (1)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "See full list" }));
    expect(screen.getByText("Present · 45 min")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(container.querySelector("video")?.getAttribute("src")).toContain("https://files.example.com/rec/past.mp4"),
    );
  });

  it("says when the recording is still processing, and falls back to the invite list without attendance", async () => {
    mockApi({
      "GET /live-sessions": envelope({ items: [past], nextCursor: null }),
      "GET /live-sessions/past/participants": participants,
      "GET /live-sessions/past/attendance": reply(403, { success: false, message: "Forbidden" }),
      "GET /live-sessions/past/recording": envelope({ id: "r-1", status: "PROCESSING", durationSeconds: null }),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} />);

    await user.click(await screen.findByRole("button", { name: "Old class" }));
    expect(await screen.findByText("The recording is still processing. Check back soon.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Attendance (2)" })).toBeInTheDocument();
  });
});

describe("Joining from the session preview", () => {
  it("offers Join for a session about to start, not one still days away", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T17:50:00Z"));
    mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({ id: "soon", title: "Soon class" }),
          session({
            id: "later",
            title: "Later class",
            scheduledStartAt: "2026-11-30T18:00:00.000Z",
            scheduledEndAt: "2026-11-30T19:00:00.000Z",
          }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/soon/participants": envelope({ items: [], total: 0 }),
      "GET /live-sessions/later/participants": envelope({ items: [], total: 0 }),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} joinPath="/admin/live" />);

    await user.click(await screen.findByRole("button", { name: "Soon class" }));
    expect((await screen.findByText("Join session")).closest("a")).toHaveAttribute("href", "/admin/live/soon");

    await user.click(screen.getByRole("button", { name: "Later class" }));
    expect(await screen.findByRole("heading", { name: "Participants (0)" })).toBeInTheDocument();
    expect(screen.queryByText("Join session")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("Copying a session's link", () => {
  it("offers Copy link instead of Join before a session opens, and in the three-dot menu", async () => {
    mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({
            id: "later",
            title: "Later class",
            scheduledStartAt: "2027-01-15T08:00:00.000Z",
            scheduledEndAt: "2027-01-15T09:00:00.000Z",
          }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/later/participants": envelope({ items: [], total: 0 }),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} joinPath="/admin/live" />);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    await user.click(await screen.findByRole("button", { name: "Later class" }));
    await user.click(await screen.findByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/live/later`);
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Later class actions" })[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledTimes(2);
  });
});

describe("Editing a live session", () => {
  it("opens from the three-dot button and saves the new title and time for this session only", async () => {
    const api = mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({
            id: "next",
            title: "Weekly sync",
            seriesId: "series-1",
            scheduledStartAt: "2027-01-15T08:00:00.000Z",
            scheduledEndAt: "2027-01-15T09:00:00.000Z",
          }),
          session({ id: "past", title: "Old class", status: "ENDED" }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/next/participants": participants,
      "GET /live-sessions/past/participants": participants,
      "PATCH /live-sessions/next": envelope(session({ id: "next" })),
      "GET /live-sessions/series/series-1": envelope({ rrule: "FREQ=WEEKLY;BYDAY=FR", endsOn: null }),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit />);

    expect(await screen.findByRole("button", { name: "Old class actions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Weekly sync actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit session" }));
    expect(await screen.findByRole("heading", { name: "Edit live session" })).toBeInTheDocument();
    expect(screen.getByText("Track meeting · Design")).toBeInTheDocument();

    const title = screen.getByPlaceholderText("Add title");
    await user.clear(title);
    await user.type(title, "Weekly sync (moved)");
    await user.click(screen.getByRole("combobox", { name: "Start time" }));
    await user.click(await screen.findByRole("option", { name: "10:00AM" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Live session updated")).toBeInTheDocument();
    expect(api.bodies("PATCH /live-sessions/next")[0]).toEqual({
      scope: "THIS_OCCURRENCE",
      title: "Weekly sync (moved)",
      description: "Wireframes",
      scheduledStartAt: "2027-01-15T09:00:00.000Z",
      scheduledEndAt: "2027-01-15T10:00:00.000Z",
      timezone: "Africa/Lagos",
    });
  });

  it("cancels the chosen sessions of a series from the same menu", async () => {
    const api = mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({
            id: "next",
            title: "Weekly sync",
            seriesId: "series-1",
            scheduledStartAt: "2027-01-15T08:00:00.000Z",
            scheduledEndAt: "2027-01-15T09:00:00.000Z",
          }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/next/participants": participants,
      "GET /live-sessions/series/series-1": envelope({ rrule: "FREQ=WEEKLY;BYDAY=FR", endsOn: null }),
      "DELETE /calendar/events/next": envelope({}),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit />);

    expect(await screen.findByText("Weekly on Friday")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Weekly sync actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Cancel session" }));
    await user.click(await screen.findByRole("radio", { name: "This and following sessions" }));
    await user.click(screen.getByRole("button", { name: "Cancel session" }));

    expect(await screen.findByText("Live session cancelled")).toBeInTheDocument();
    const [url] = api.urls("DELETE /calendar/events/next");
    expect(url.searchParams.get("scope")).toBe("following");
  });

  it("has no menu for a session that has already happened", async () => {
    mockApi({
      "GET /live-sessions": envelope({
        items: [session({ id: "past", title: "Old class", status: "ENDED" })],
        nextCursor: null,
      }),
      "GET /live-sessions/past/participants": participants,
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit />);

    await user.click(await screen.findByRole("button", { name: "Old class actions" }));
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });
});

describe("A mentor's live sessions", () => {
  it("only lets them edit or cancel the sessions they host", async () => {
    mockApi({
      "GET /auth/get-session": { user: { id: "mentor-1" }, session: {} },
      "GET /live-sessions": envelope({
        items: [
          session({ id: "mine", title: "My check-in", hostId: "mentor-1", scheduledStartAt: "2027-01-15T08:00:00.000Z", scheduledEndAt: "2027-01-15T09:00:00.000Z" }),
          session({ id: "theirs", title: "Town hall", hostId: "admin-1", scheduledStartAt: "2027-01-16T08:00:00.000Z", scheduledEndAt: "2027-01-16T09:00:00.000Z" }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/mine/participants": participants,
      "GET /live-sessions/theirs/participants": participants,
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit="own" />);

    await user.click(await screen.findByRole("button", { name: "Town hall actions" }));
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "My check-in actions" }));
    expect(await screen.findByRole("menuitem", { name: "Edit session" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancel session" })).toBeInTheDocument();
  });
});

describe("Guests of an explicit-invite session", () => {
  it("adds and removes guests when the session is saved", async () => {
    const api = mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({
            id: "invite",
            title: "Portfolio review",
            type: "EXPLICIT_INVITE",
            track: null,
            scheduledStartAt: "2027-01-15T08:00:00.000Z",
            scheduledEndAt: "2027-01-15T09:00:00.000Z",
          }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/invite/participants": participants,
      "GET /live-sessions/invite/invitees": envelope([
        { userId: "u-2", removedAt: null, user: { id: "u-2", name: "Tola Ade", email: "tola@example.com" } },
      ]),
      "GET /admin/users": envelope({
        items: [{ id: "u-3", firstName: "Kemi", lastName: "Ojo", email: "kemi@example.com" }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      "PATCH /live-sessions/invite": envelope(session({ id: "invite" })),
      "POST /live-sessions/invite/invitees": envelope([]),
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit />);

    await user.click(await screen.findByRole("button", { name: "Portfolio review actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit session" }));
    await user.click(await screen.findByText("Tola Ade"));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Live session updated")).toBeInTheDocument();
    expect(api.bodies("POST /live-sessions/invite/invitees")).toEqual([{ inviteeIds: ["u-3"] }]);
  });
});

describe("Opening a session from a link", () => {
  it("previews the session a notification points to", async () => {
    mockApi({
      "GET /live-sessions": envelope({ items: [session({ id: "s-9", title: "Design crit" })], nextCursor: null }),
      "GET /live-sessions/s-9/participants": participants,
    });
    renderWithClient(<LiveSessionsScreen topNav={null} openSessionId="s-9" />);

    expect(await screen.findByRole("heading", { name: "Participants (2)" })).toBeInTheDocument();
  });

  it("opens a later occurrence of a repeating session, though only the next one has a card", async () => {
    mockApi({
      "GET /live-sessions": envelope({
        items: [
          session({ id: "week-1", title: "Weekly sync", seriesId: "series-1", scheduledStartAt: "2027-01-15T08:00:00.000Z", scheduledEndAt: "2027-01-15T09:00:00.000Z" }),
          session({ id: "week-2", title: "Weekly sync", seriesId: "series-1", scheduledStartAt: "2027-01-22T08:00:00.000Z", scheduledEndAt: "2027-01-22T09:00:00.000Z" }),
        ],
        nextCursor: null,
      }),
      "GET /live-sessions/week-1/participants": participants,
      "GET /live-sessions/week-2/participants": participants,
      "GET /live-sessions/series/series-1": envelope({ rrule: "FREQ=WEEKLY;BYDAY=FR", endsOn: null }),
    });
    renderWithClient(<LiveSessionsScreen topNav={null} openSessionId="week-2" />);

    const preview = await screen.findByRole("complementary", { name: "Session preview" });
    expect(within(preview).getByText("Fri, Jan 22 2027")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Weekly sync actions" })).toHaveLength(2);
  });
});

describe("JoinHub", () => {
  it("lets people join a live session and asks the API for the week", async () => {
    const now = Date.parse("2026-11-23T18:30:00Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const api = mockApi({
      "GET /live-sessions": envelope({ items: [session({ status: "LIVE" })], nextCursor: null }),
    });
    renderWithClient(<JoinHub serverNow={now} deviceCheckPath="/student/live" />);

    const card = (await screen.findByRole("heading", { name: "UI/UX live class" })).closest("li")!;
    expect(within(card).getByText("Live now")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Join live session" })).toHaveAttribute("href", "/student/live/s-1");

    const [url] = api.urls("GET /live-sessions");
    expect(url.searchParams.get("from")).toBe("2026-11-22T00:00:00Z");
    expect(url.searchParams.get("to")).toBe("2026-12-01T00:00:00Z");
  });

  it("opens Join 15 minutes early for staff, but not for students", async () => {
    const now = Date.parse("2026-11-23T17:50:00Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const routes = {
      "GET /live-sessions": envelope({ items: [session({})], nextCursor: null }),
    };

    mockApi(routes);
    const staff = renderWithClient(<JoinHub serverNow={now} deviceCheckPath="/mentor/live" />);
    const card = (await screen.findByRole("heading", { name: "UI/UX live class" })).closest("li")!;
    expect(within(card).getByText("In 10 Minutes")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Join live session" })).toHaveAttribute("href", "/mentor/live/s-1");
    staff.unmount();

    mockApi(routes);
    renderWithClient(<JoinHub serverNow={now} deviceCheckPath="/student/live" early={false} />);
    const studentCard = (await screen.findByRole("heading", { name: "UI/UX live class" })).closest("li")!;
    expect(within(studentCard).queryByRole("link", { name: "Join live session" })).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

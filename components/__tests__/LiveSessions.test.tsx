import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";
import { JoinHub } from "@/components/live-room/JoinHub";
import { toLiveSession, type ApiLiveSession } from "@/lib/live-sessions";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

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

  it("says when there are no sessions", async () => {
    mockApi({ "GET /live-sessions": envelope({ items: [], nextCursor: null }) });
    renderWithClient(<LiveSessionsScreen topNav={null} />);

    expect(await screen.findByText(/No live sessions yet/)).toBeInTheDocument();
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
    });
    const { user } = renderWithClient(<LiveSessionsScreen topNav={null} canEdit />);

    expect(await screen.findByRole("button", { name: "Old class actions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Weekly sync" }));
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

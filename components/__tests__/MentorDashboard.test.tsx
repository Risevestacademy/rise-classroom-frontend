import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import MentorDashboardPage from "@/app/mentor/dashboard/page";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("@/components/AppTopNav", () => ({ AppTopNav: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const noSessions = envelope({ items: [], nextCursor: null });

afterEach(() => {
  vi.useRealTimers();
});

function mentee(id: string, name: string, email: string) {
  return {
    id: `ms-${id}`,
    mentorId: "m1",
    studentId: `sp-${id}`,
    active: true,
    assignedAt: "2026-11-05T00:00:00.000Z",
    endedAt: null,
    student: {
      id: `sp-${id}`,
      cohort: { id: "c1", name: "Cohort 2026" },
      user: { id, name, email },
    },
  };
}

describe("MentorDashboardPage", () => {
  it("lists the mentor's own mentees", async () => {
    mockApi({
      "GET /auth/get-session": { user: { firstName: "Tunde", role: "MENTOR" } },
      "GET /mentors/my-mentees": envelope([
        mentee("u1", "Halima Obi", "halima@example.com"),
        mentee("u2", "Yusuf Balogun", "yusuf@example.com"),
      ]),
      "GET /live-sessions": noSessions,
    });
    renderWithClient(<MentorDashboardPage />);

    // There's no mentor view of a student's profile yet, so names don't link.
    expect(await screen.findByText("Halima Obi")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Halima Obi" })).not.toBeInTheDocument();
    expect(screen.getByText("yusuf@example.com")).toBeInTheDocument();
    expect(screen.getByText("My students").parentElement).toHaveTextContent("2");
  });

  it("says so when the mentor has no mentees", async () => {
    mockApi({
      "GET /auth/get-session": { user: { firstName: "Tunde", role: "MENTOR" } },
      "GET /mentors/my-mentees": envelope([]),
      "GET /live-sessions": noSessions,
    });
    renderWithClient(<MentorDashboardPage />);

    expect(
      await screen.findByText("No students assigned yet."),
    ).toBeInTheDocument();
  });

  it("lists the mentor's next live sessions, with Join on the one that's live", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T18:30:00Z"));
    const session = (id: string, title: string, status: string, start: string, end: string) => ({
      id,
      title,
      roomName: id,
      type: "MENTORSHIP_GROUP",
      status,
      hostId: "m1",
      scheduledStartAt: start,
      scheduledEndAt: end,
      timezone: "Africa/Lagos",
    });
    mockApi({
      "GET /auth/get-session": { user: { firstName: "Tunde", role: "MENTOR" } },
      "GET /mentors/my-mentees": envelope([]),
      "GET /live-sessions": envelope({
        items: [
          session("later", "Next week", "SCHEDULED", "2026-12-03T17:00:00Z", "2026-12-03T18:00:00Z"),
          session("now", "Group check-in", "LIVE", "2026-11-24T18:00:00Z", "2026-11-24T19:00:00Z"),
          session("past", "Old", "ENDED", "2026-11-20T17:00:00Z", "2026-11-20T18:00:00Z"),
        ],
        nextCursor: null,
      }),
    });
    renderWithClient(<MentorDashboardPage />);

    // Base UI gives the link a button role.
    const join = await screen.findByRole("button", { name: "Join" });
    expect(join.closest("a")).toHaveAttribute("href", "/mentor/live/now");
    expect(screen.getByText("In 9 days")).toBeInTheDocument();
    expect(screen.getByText("Thu, Dec 3 2026")).toBeInTheDocument();
    expect(screen.queryByText("Fri, Nov 20 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Upcoming sessions", { selector: "p" }).parentElement).toHaveTextContent("1");
  });
});

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ControlTowerTab } from "@/components/student-profile/ControlTowerTab";
import type { AdminUser } from "@/lib/admin";
import { weekRangeFor, type WeeklyMetric } from "@/lib/control-tower";
import { studentCheckIns } from "@/lib/student-check-ins";
import { mockApi, renderWithClient } from "@/test/utils";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function metric(weekStart: string, changes: Partial<WeeklyMetric> = {}): WeeklyMetric {
  return {
    id: `wm-${weekStart}`,
    studentId: "sp1",
    weekStart,
    weekEnd: new Date(Date.parse(weekStart) + WEEK_MS - 1).toISOString(),
    goalSummary: null,
    progress: null,
    challenges: null,
    priorities: null,
    mentorMeetingOutcome: null,
    mentorFeedback: null,
    status: "SUBMITTED",
    createdAt: weekStart,
    updatedAt: weekStart,
    ...changes,
  };
}

describe("studentCheckIns", () => {
  const now = new Date("2026-10-14T12:00:00Z"); // a Wednesday
  const cohort = {
    startDate: "2026-09-21T00:00:00.000Z",
    endDate: "2026-12-18T00:00:00.000Z",
  };

  it("lists every cohort week so far, newest first", () => {
    const weeks = studentCheckIns([], cohort, now);

    expect(weeks.map((week) => week.week)).toEqual([4, 3, 2, 1]);
    expect(weeks[0]).toMatchObject({
      range: "Oct 12 - Oct 18, 2026",
      status: "ongoing",
      daysLeft: 5,
    });
    expect(weeks.slice(1).map((week) => week.status)).toEqual([
      "overdue",
      "overdue",
      "overdue",
    ]);
  });

  it("marks submitted weeks and keeps drafts overdue once the week ends", () => {
    const weeks = studentCheckIns(
      [
        metric("2026-10-05T00:00:00.000Z", { status: "REVIEWED" }),
        metric("2026-09-28T00:00:00.000Z", { status: "DRAFT" }),
      ],
      cohort,
      now,
    );

    expect(weeks.map((week) => week.status)).toEqual([
      "ongoing",
      "submitted",
      "overdue",
      "overdue",
    ]);
  });

  it("maps each answer to the field the student saves it in", () => {
    const [week] = studentCheckIns(
      [
        metric("2026-10-12T00:00:00.000Z", {
          priorities: "Focus",
          goalSummary: "Achieve",
          mentorMeetingOutcome: "Meeting",
          progress: "Progress",
          whatWentWell: "Went well",
          challenges: "Didn't go well",
          whatIWillDoDifferently: "Differently",
        }),
      ],
      cohort,
      now,
    );

    expect(week.answers).toEqual({
      focus: "Focus",
      achieve: "Achieve",
      meeting: "Meeting",
      progress: "Progress",
      wentWell: "Went well",
      didntGoWell: "Didn't go well",
      doDifferently: "Differently",
    });
  });
});

const student = {
  id: "u1",
  name: "Ada Obi",
  firstName: "Ada",
  lastName: "Obi",
  email: "ada@example.com",
  role: "STUDENT",
  status: "ACTIVE",
  onboardingStatus: "COMPLETED",
  createdAt: "2026-09-01T00:00:00.000Z",
  studentProfile: [{ cohort: { id: "c1", name: "Cohort 2026" } }],
  mentor: {
    id: "m1",
    name: "Tunde Bello",
    firstName: "Tunde",
    lastName: "Bello",
    email: "tunde@example.com",
    status: "ACTIVE",
    mentorshipId: "ms1",
    assignedAt: "2026-09-01T00:00:00.000Z",
  },
} satisfies AdminUser;

describe("ControlTowerTab", () => {
  const thisWeek = weekRangeFor().weekStart;
  const lastWeek = new Date(Date.parse(thisWeek) - WEEK_MS).toISOString();

  function routes(mentees = [{ user: { id: "u1" }, studentProfileId: "sp1" }]) {
    return mockApi({
      "GET /admin/users/m1/mentees": { success: true, data: mentees },
      "GET /admin/cohorts/c1": {
        success: true,
        data: {
          id: "c1",
          name: "Cohort 2026",
          startDate: lastWeek,
          endDate: new Date(Date.parse(thisWeek) + 20 * WEEK_MS).toISOString(),
        },
      },
      "GET /weekly-metrics/student/sp1": {
        success: true,
        data: [
          metric(lastWeek, {
            priorities: "Ship the portfolio",
            whatWentWell: "Finished the API module",
          }),
        ],
      },
    });
  }

  it("shows the student's check-ins from the API", async () => {
    routes();
    renderWithClient(
      <ControlTowerTab student={student} firstName="Ada" cohort="Cohort 2026" />,
    );

    expect(await screen.findByText("Week 2 check-in")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
    expect(screen.getByText("0/8 Answered")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Week 1/ }));

    expect(screen.getByText("Week 1 check-in")).toBeInTheDocument();
    expect(screen.getByText("Week submitted")).toBeInTheDocument();
    expect(screen.getByText("Ship the portfolio")).toBeInTheDocument();
    expect(screen.getByText("Finished the API module")).toBeInTheDocument();
    expect(screen.getByText("2/8 Answered")).toBeInTheDocument();
  });

  it("says check-ins need a mentor when the student has none", async () => {
    routes();
    renderWithClient(
      <ControlTowerTab
        student={{ ...student, mentor: null }}
        firstName="Ada"
        cohort="Cohort 2026"
      />,
    );

    expect(await screen.findByText("No check-ins to show")).toBeInTheDocument();
  });
});

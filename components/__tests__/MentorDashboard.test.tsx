import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import MentorDashboardPage from "@/app/mentor/dashboard/page";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("@/components/AppTopNav", () => ({ AppTopNav: () => null }));

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
    });
    renderWithClient(<MentorDashboardPage />);

    expect(
      await screen.findByRole("link", { name: "Halima Obi" }),
    ).toHaveAttribute("href", "/mentor/students/u1");
    expect(screen.getByText("yusuf@example.com")).toBeInTheDocument();
    expect(screen.getByText("My students").parentElement).toHaveTextContent("2");
  });

  it("says so when the mentor has no mentees", async () => {
    mockApi({
      "GET /auth/get-session": { user: { firstName: "Tunde", role: "MENTOR" } },
      "GET /mentors/my-mentees": envelope([]),
    });
    renderWithClient(<MentorDashboardPage />);

    expect(
      await screen.findByText("No students assigned yet."),
    ).toBeInTheDocument();
  });
});

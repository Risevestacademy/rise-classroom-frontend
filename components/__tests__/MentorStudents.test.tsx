import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { MentorStudents } from "@/app/mentor/students/MentorStudents";
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

describe("MentorStudents", () => {
  it("lists the mentor's mentees with their totals", async () => {
    mockApi({
      "GET /mentors/my-mentees": envelope([
        mentee("u1", "Halima Obi", "halima@example.com"),
        mentee("u2", "Yusuf Balogun", "yusuf@example.com"),
      ]),
    });
    renderWithClient(<MentorStudents />);

    expect(await screen.findByText("Halima Obi")).toBeInTheDocument();
    expect(screen.getByText("yusuf@example.com")).toBeInTheDocument();
    expect(screen.getByText("Total students").parentElement).toHaveTextContent("2");
    // Mentors can't read progress yet.
    expect(screen.getByText("Students needing attention").parentElement).toHaveTextContent("--");
  });

  it("says so when the mentor has no mentees", async () => {
    mockApi({ "GET /mentors/my-mentees": envelope([]) });
    renderWithClient(<MentorStudents />);

    expect(await screen.findByText("No students assigned yet.")).toBeInTheDocument();
  });
});

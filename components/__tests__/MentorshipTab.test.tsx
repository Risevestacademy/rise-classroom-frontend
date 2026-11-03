import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { MentorshipTab } from "@/components/student-profile/MentorshipTab";
import { toAssignedStudent, type MentorStudent } from "@/lib/mentors";
import { renderWithClient } from "@/test/utils";

const mentor = {
  id: "mentor-1",
  name: "David Orobosa",
  firstName: "David",
  lastName: "Orobosa",
  displayName: null,
  email: "david@example.com",
  status: "ACTIVE" as const,
  mentorshipId: "ms-1",
  assignedAt: "2026-10-01T00:00:00.000Z",
};

describe("MentorshipTab", () => {
  it("shows the student's mentor with their track and cohort", () => {
    renderWithClient(
      <MentorshipTab
        student={{ id: "s1", name: "Ada Obi", email: "ada@example.com" }}
        mentor={mentor}
        track="Design"
        cohort="Cohort 2026"
      />,
    );

    expect(screen.getByRole("link", { name: "David Orobosa" })).toHaveAttribute(
      "href",
      "/admin/mentors/mentor-1",
    );
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Cohort 2026")).toBeInTheDocument();
  });

  it("says so when no mentor is assigned", () => {
    renderWithClient(<MentorshipTab student={{ id: "s1", name: "Ada Obi", email: "ada@example.com" }} mentor={null} />);
    expect(screen.getByText("No mentor assigned yet.")).toBeInTheDocument();
  });
});

describe("toAssignedStudent", () => {
  const mentee: MentorStudent = {
    mentorshipId: "ms-1",
    assignedAt: "2026-10-01T00:00:00.000Z",
    studentProfileId: "sp-1",
    cohort: { id: "c1", name: "Cohort 2026" },
    enrollment: [],
    user: {
      id: "u1",
      name: "Ada Obi",
      firstName: "Ada",
      lastName: "Obi",
      displayName: "Ada O.",
      email: "ada@example.com",
      status: "SUSPENDED",
    },
  };

  it("uses the student's user id, display name and status", () => {
    expect(toAssignedStudent(mentee)).toEqual({
      id: "u1",
      name: "Ada O.",
      email: "ada@example.com",
      status: "inactive",
      progress: null,
    });
  });
});

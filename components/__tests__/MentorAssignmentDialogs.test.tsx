import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import {
  AssignStudentsDialog,
  ReassignStudentDialog,
} from "@/components/MentorAssignmentDialogs";
import { makeUser } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const mentor = makeUser({
  id: "mentor-1",
  name: "David Orobosa",
  email: "david@example.com",
  role: "MENTOR",
  instructorTrack: [
    { cohort: { id: "cohort-1", name: "Cohort 2026" }, track: { id: "track-1", name: "Design" } },
  ],
});

const students = [
  makeUser({ id: "student-1", name: "Tobi Adeyemi", email: "tobi@example.com" }),
  makeUser({ id: "student-2", name: "Grace Williams", email: "grace@example.com" }),
];

function studentsPage() {
  return envelope({ items: students, page: 1, limit: 100, total: 2, totalPages: 1 });
}

describe("AssignStudentsDialog", () => {
  it("lists students from the mentor's cohort and track", async () => {
    const api = mockApi({ "GET /admin/users": studentsPage() });
    renderWithClient(
      <AssignStudentsDialog mentor={mentor} open onOpenChange={() => {}} />,
    );

    expect(await screen.findByText("Tobi Adeyemi")).toBeInTheDocument();
    const [url] = api.urls("GET /admin/users");
    expect(url.searchParams.get("role")).toBe("STUDENT");
    expect(url.searchParams.get("cohortId")).toBe("cohort-1");
    expect(url.searchParams.get("trackId")).toBe("track-1");
  });

  it("filters by name or email", async () => {
    mockApi({ "GET /admin/users": studentsPage() });
    const { user } = renderWithClient(
      <AssignStudentsDialog mentor={mentor} open onOpenChange={() => {}} />,
    );

    await screen.findByText("Tobi Adeyemi");
    await user.type(screen.getByPlaceholderText(/Search students/), "grace@");
    expect(screen.queryByText("Tobi Adeyemi")).not.toBeInTheDocument();
    expect(screen.getByText("Grace Williams")).toBeInTheDocument();
  });

  it("assigns every selected student, then closes", async () => {
    const onOpenChange = vi.fn();
    const api = mockApi({
      "GET /admin/users": studentsPage(),
      "POST /mentors/assign": envelope({ id: "m-1" }),
    });
    const { user } = renderWithClient(
      <AssignStudentsDialog mentor={mentor} open onOpenChange={onOpenChange} />,
    );

    const assign = screen.getByRole("button", { name: "Assign student" });
    expect(assign).toBeDisabled();

    await user.click(await screen.findByRole("checkbox", { name: /Tobi Adeyemi/ }));
    await user.click(screen.getByRole("checkbox", { name: /Grace Williams/ }));
    expect(screen.getByText("2 students selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Assign students" }));

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(api.bodies("POST /mentors/assign")).toEqual([
      { mentorId: "mentor-1", studentUserId: "student-1" },
      { mentorId: "mentor-1", studentUserId: "student-2" },
    ]);
  });

  it("shows the API's reason when the mentor is full", async () => {
    const onOpenChange = vi.fn();
    mockApi({
      "GET /admin/users": studentsPage(),
      "POST /mentors/assign": reply(400, { message: "Mentor has reached the maximum of 4 mentees" }),
    });
    const { user } = renderWithClient(
      <AssignStudentsDialog mentor={mentor} open onOpenChange={onOpenChange} />,
    );

    await user.click(await screen.findByRole("checkbox", { name: /Tobi Adeyemi/ }));
    await user.click(screen.getByRole("button", { name: "Assign student" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Mentor has reached the maximum of 4 mentees",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("explains when the mentor has no cohort and track", () => {
    mockApi({});
    renderWithClient(
      <AssignStudentsDialog
        mentor={{ ...mentor, instructorTrack: [] }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText(/isn't on a cohort and track yet/)).toBeInTheDocument();
  });
});

describe("ReassignStudentDialog", () => {
  const mentors = envelope({
    items: [
      mentor,
      makeUser({ id: "mentor-2", name: "Kemi Ade", email: "kemi@example.com", role: "MENTOR" }),
    ],
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  });

  it("needs a new mentor, leaving out the current one", async () => {
    mockApi({ "GET /admin/users": mentors });
    const onReassign = vi.fn(async () => {});
    const { user } = renderWithClient(
      <ReassignStudentDialog
        student={{ id: "student-1", name: "Ozavize Bello", email: "oza@example.com" }}
        currentMentor={{ id: "mentor-1", name: "David Orobosa" }}
        open
        onOpenChange={() => {}}
        onReassign={onReassign}
      />,
    );

    expect(screen.getByLabelText("Current mentor")).toHaveValue("David Orobosa");
    const submit = screen.getByRole("button", { name: "Reassign student" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /New mentor/ }));
    expect(await screen.findByRole("option", { name: "Kemi Ade" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "David Orobosa" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Kemi Ade" }));
    await user.click(submit);
    expect(onReassign).toHaveBeenCalledWith("mentor-2");
  });
});

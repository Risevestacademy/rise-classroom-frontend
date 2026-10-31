import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import type { AdminUser } from "@/lib/admin";
import { cohortQueries } from "@/lib/cohorts";
import { cohort, makeUser, tracks } from "@/test/fixtures";
import { envelope, mockApi } from "@/test/utils";

const instructor = makeUser({
  id: "instructor-1",
  firstName: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  role: "INSTRUCTOR",
});
const mentor = makeUser({
  id: "mentor-1",
  firstName: "Tunde",
  lastName: "Bello",
  email: "tunde@example.com",
  role: "MENTOR",
  status: "SUSPENDED",
});
const student = makeUser({
  studentProfile: [
    {
      cohort: { id: cohort.id, name: cohort.name },
      enrollment: [{ status: "ENROLLED", track: tracks[0] }],
    },
  ],
});

// The API lists mentors' cohort assignments as instructor-track records too.
const assignments = [instructor, mentor].map((user, index) => ({
  id: `assignment-${index}`,
  instructorId: user.id,
  trackId: tracks[0].id,
  cohortId: cohort.id,
  instructor: {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  },
  track: tracks[0],
}));

/** `/admin/users` answers by role, which `mockApi` can't key on. */
function mockUsersByRole(users: Record<string, AdminUser[] | null>) {
  const api = mockApi({});
  api.fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api\/backend/, "");
    const items = users[url.searchParams.get("role") ?? ""];
    const status = path === "/admin/users" && items === null ? 500 : 200;
    const body =
      path === "/admin/users"
        ? envelope({ items, page: 1, limit: 100, total: items?.length, totalPages: 1 })
        : path === "/admin/instructor-tracks"
          ? envelope(assignments)
          : envelope(cohort);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  });
}

const loadDetail = () =>
  new QueryClient().fetchQuery(cohortQueries.detail(cohort.id));

describe("cohort detail", () => {
  it("lists mentors under mentors, not instructors", async () => {
    mockUsersByRole({
      STUDENT: [student],
      INSTRUCTOR: [instructor],
      MENTOR: [mentor],
    });

    const detail = await loadDetail();

    expect(detail.instructorList.map((row) => row.name)).toEqual(["Grace Hopper"]);
    expect(detail.instructorList[0].students).toBe(1);
    expect(detail.mentorList).toHaveLength(1);
    expect(detail.mentorList[0]).toMatchObject({
      name: "Tunde Bello",
      accountStatus: "SUSPENDED",
      students: null,
    });
    expect(detail.instructorsAndMentors).toBe(2);
  });

  it("still loads when the staff lookups fail", async () => {
    mockUsersByRole({ STUDENT: [student], INSTRUCTOR: null, MENTOR: null });

    const detail = await loadDetail();

    expect(detail.instructorList).toHaveLength(2);
    expect(detail.mentorList).toHaveLength(0);
  });
});

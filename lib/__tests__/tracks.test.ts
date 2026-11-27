import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { averageProgress, trackQueries } from "@/lib/tracks";
import { envelope, mockApi, reply } from "@/test/utils";

afterEach(() => vi.unstubAllGlobals());

function student(id: string, cohortId: string, trackId: string, percentage?: number) {
  return envelope({
    id,
    studentProfile: [
      {
        cohort: { id: cohortId, name: "Cohort" },
        enrollment: [
          {
            status: "ENROLLED",
            track: { id: trackId, name: "Track" },
            ...(percentage === undefined
              ? {}
              : { progress: { completedLessons: percentage / 10, totalLessons: 10, percentage } }),
          },
        ],
      },
    ],
  });
}

describe("averageProgress", () => {
  it("weighs every student the same, and is 0 with nobody on the track", () => {
    const row = (percentage: number) => ({
      userId: String(percentage),
      completedLessons: 0,
      totalLessons: 10,
      percentage,
    });
    expect(averageProgress([row(100), row(50), row(0)])).toBe(50);
    expect(averageProgress([])).toBe(0);
  });
});

describe("trackQueries.progress", () => {
  it("reads each student's progress on this track in this cohort", async () => {
    mockApi({
      "GET /admin/users/u1": student("u1", "c1", "t1", 40),
      // Progress on another cohort's enrolment doesn't count.
      "GET /admin/users/u2": student("u2", "other", "t1", 90),
      // Not started yet: no progress object.
      "GET /admin/users/u3": student("u3", "c1", "t1"),
    });

    const rows = await new QueryClient().fetchQuery(
      trackQueries.progress("t1", "c1", ["u1", "u2", "u3"]),
    );

    expect(rows.map((row) => row.percentage)).toEqual([40, 0, 0]);
    expect(rows[0]).toMatchObject({ userId: "u1", completedLessons: 4, totalLessons: 10 });
  });
});

describe("trackQueries.progress when some students fail to load", () => {
  it("leaves them out of the average instead of failing the track", async () => {
    mockApi({
      "GET /admin/users/u1": student("u1", "c1", "t1", 60),
      "GET /admin/users/u2": reply(404),
    });

    const rows = await new QueryClient().fetchQuery(
      trackQueries.progress("t1", "c1", ["u1", "u2"]),
    );

    expect(rows[1]).toMatchObject({ userId: "u2", unknown: true });
    expect(averageProgress(rows)).toBe(60);
  });

  it("fails when nobody's progress could be loaded", async () => {
    mockApi({ "GET /admin/users/u1": reply(404) });

    await expect(
      new QueryClient().fetchQuery(trackQueries.progress("t1", "c1", ["u1"])),
    ).rejects.toThrow();
  });
});

describe("trackQueries.curriculum", () => {
  it("picks the curriculum for the cohort, or null when there isn't one", async () => {
    mockApi({
      "GET /admin/tracks/t1/curriculums": envelope([
        { id: "a", cohortId: "other", totalLessons: 5 },
        { id: "b", cohortId: "c1", totalLessons: 12 },
      ]),
    });
    const client = new QueryClient();

    expect(await client.fetchQuery(trackQueries.curriculum("t1", "c1"))).toMatchObject({
      id: "b",
      totalLessons: 12,
    });
    expect(await client.fetchQuery(trackQueries.curriculum("t1", "none"))).toBeNull();
  });
});

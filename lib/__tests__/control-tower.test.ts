import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  daysLeftIn,
  formatWeekRange,
  isSameWeek,
  mentorDisplay,
  saveWeeklyMetric,
  weekRangeFor,
} from "@/lib/control-tower";

describe("weekRangeFor", () => {
  // The week the live API accepted for Saturday 3 Oct 2026.
  it("runs Monday to Sunday in UTC", () => {
    expect(weekRangeFor(new Date("2026-10-03T12:00:00.000Z"))).toEqual({
      weekStart: "2026-09-28T00:00:00.000Z",
      weekEnd: "2026-10-04T23:59:59.999Z",
    });
  });

  it("gives every day of a week the same start", () => {
    const starts = [
      "2026-09-28T00:00:00.000Z", // Monday, first instant
      "2026-09-30T15:30:00.000Z",
      "2026-10-04T23:59:59.999Z", // Sunday, last instant
    ].map((day) => weekRangeFor(new Date(day)).weekStart);

    expect(new Set(starts)).toEqual(new Set(["2026-09-28T00:00:00.000Z"]));
  });

  it("starts a new week on Monday", () => {
    expect(weekRangeFor(new Date("2026-10-05T00:00:00.000Z")).weekStart).toBe(
      "2026-10-05T00:00:00.000Z"
    );
  });

  it("crosses month and year boundaries", () => {
    expect(weekRangeFor(new Date("2027-01-01T10:00:00.000Z"))).toEqual({
      weekStart: "2026-12-28T00:00:00.000Z",
      weekEnd: "2027-01-03T23:59:59.999Z",
    });
  });
});

describe("daysLeftIn", () => {
  const weekEnd = "2026-10-04T23:59:59.999Z";

  it("counts today as a day left", () => {
    expect(daysLeftIn(weekEnd, new Date("2026-10-03T12:00:00.000Z"))).toBe(2);
    expect(daysLeftIn(weekEnd, new Date("2026-10-04T08:00:00.000Z"))).toBe(1);
  });

  it("never goes negative once the week is over", () => {
    expect(daysLeftIn(weekEnd, new Date("2026-10-06T00:00:00.000Z"))).toBe(0);
  });
});

describe("formatWeekRange", () => {
  it("shows the stored dates regardless of the viewer's timezone", () => {
    expect(
      formatWeekRange("2026-09-28T00:00:00.000Z", "2026-10-04T23:59:59.999Z")
    ).toMatch(/Sep 28.*Oct 4/);
  });
});

describe("isSameWeek", () => {
  it("compares instants, not strings", () => {
    expect(
      isSameWeek("2026-09-28T00:00:00.000Z", "2026-09-28T00:00:00Z")
    ).toBe(true);
    expect(
      isSameWeek("2026-09-28T00:00:00.000Z", "2026-10-05T00:00:00.000Z")
    ).toBe(false);
  });
});

describe("mentorDisplay", () => {
  it("reads a flat record", () => {
    expect(mentorDisplay({ name: "Tunde Bello", email: "t@rise.edu" })).toEqual(
      { name: "Tunde Bello", initials: "TB", email: "t@rise.edu" }
    );
  });

  it("reads a nested instructor and builds the name from parts", () => {
    expect(
      mentorDisplay({ instructor: { firstName: "Ada", lastName: "Obi" } }).name
    ).toBe("Ada Obi");
  });

  it("falls back to a generic label for an unknown shape", () => {
    expect(mentorDisplay({ id: "x" })).toEqual({
      name: "Your mentor",
      initials: "YM",
      email: undefined,
    });
  });
});

describe("saveWeeklyMetric", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "m1" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts the week and answers to the weekly-metrics endpoint", async () => {
    await expect(
      saveWeeklyMetric({
        ...weekRangeFor(new Date("2026-10-03T12:00:00.000Z")),
        priorities: "Ship the navbar",
        status: "DRAFT",
      })
    ).resolves.toEqual({ id: "m1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/backend/weekly-metrics");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      weekStart: "2026-09-28T00:00:00.000Z",
      weekEnd: "2026-10-04T23:59:59.999Z",
      priorities: "Ship the navbar",
      status: "DRAFT",
    });
  });
});

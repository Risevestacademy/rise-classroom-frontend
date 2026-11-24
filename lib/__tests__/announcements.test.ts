import { describe, expect, it } from "vitest";

import {
  audienceLabel,
  inDateRange,
  matchesAudience,
  type AnnouncementAudience,
} from "@/lib/announcements";

const design = { id: "1", name: "Design" };
const frontend = { id: "2", name: "Frontend" };

describe("audienceLabel", () => {
  it.each<[AnnouncementAudience, string]>([
    [{ type: "EVERYONE" }, "Everyone"],
    [{ type: "ROLES", roles: ["MENTOR", "STUDENT"] }, "Students, Mentors"],
    [{ type: "TRACKS", tracks: [design] }, "Design track"],
    [{ type: "TRACKS", tracks: [design, frontend] }, "Design, Frontend tracks"],
  ])("labels %j as %s", (audience, label) => {
    expect(audienceLabel(audience)).toBe(label);
  });
});

describe("matchesAudience", () => {
  const roles: AnnouncementAudience = { type: "ROLES", roles: ["STUDENT"] };
  const tracks: AnnouncementAudience = { type: "TRACKS", tracks: [design] };

  it("matches roles, tracks and everyone separately", () => {
    expect(matchesAudience(roles, "STUDENT")).toBe(true);
    expect(matchesAudience(roles, "MENTOR")).toBe(false);
    expect(matchesAudience(tracks, "track:Design")).toBe(true);
    expect(matchesAudience(tracks, "track:Frontend")).toBe(false);
    expect(matchesAudience({ type: "EVERYONE" }, "EVERYONE")).toBe(true);
    expect(matchesAudience(roles, "EVERYONE")).toBe(false);
    expect(matchesAudience(roles, "all")).toBe(true);
  });
});

describe("inDateRange", () => {
  const now = new Date("2026-11-17T12:00:00Z").getTime();

  it("keeps announcements inside the range", () => {
    expect(inDateRange("2026-11-12T12:00:00Z", "7d", now)).toBe(true);
    expect(inDateRange("2026-11-01T12:00:00Z", "7d", now)).toBe(false);
    expect(inDateRange("2020-01-01T00:00:00Z", "all", now)).toBe(true);
  });
});

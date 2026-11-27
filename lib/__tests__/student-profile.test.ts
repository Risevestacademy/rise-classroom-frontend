import { describe, expect, it } from "vitest";

import type { CurriculumModule, ModuleAssignment } from "@/features/curriculum/types";
import { upcomingTrackDeadlines } from "@/lib/student-profile";

const assignment = (
  id: string,
  dueAt: string | null,
  status: ModuleAssignment["status"] = "PUBLISHED",
) => ({ id, title: `Assignment ${id}`, dueAt, status }) as ModuleAssignment;

const trackModule = (
  assignments: ModuleAssignment[],
  status: CurriculumModule["status"] = "PUBLISHED",
) => ({ id: `m-${assignments[0]?.id}`, status, assignments }) as CurriculumModule;

describe("upcomingTrackDeadlines", () => {
  const now = new Date(2026, 10, 27, 12);

  it("lists published assignments still to come, soonest first, once each", () => {
    const deadlines = upcomingTrackDeadlines(
      [
        trackModule([
          assignment("late", new Date(2026, 11, 18, 23).toISOString()),
          assignment("soon", new Date(2026, 10, 28, 9).toISOString()),
          assignment("soon", new Date(2026, 10, 28, 9).toISOString()),
        ]),
        trackModule([assignment("today", new Date(2026, 10, 27, 23).toISOString())]),
      ],
      { now },
    );
    expect(deadlines.map((item) => [item.id, item.daysLeft])).toEqual([
      ["today", 0],
      ["soon", 1],
      ["late", 21],
    ]);
  });

  it("leaves out past, undated, draft and draft-module assignments", () => {
    const deadlines = upcomingTrackDeadlines(
      [
        trackModule([
          assignment("past", new Date(2026, 10, 26).toISOString()),
          assignment("undated", null),
          assignment("draft", new Date(2026, 11, 1).toISOString(), "DRAFT"),
        ]),
        trackModule([assignment("hidden", new Date(2026, 11, 1).toISOString())], "DRAFT"),
      ],
      { now },
    );
    expect(deadlines).toEqual([]);
  });

  it("keeps only the first few", () => {
    const many = Array.from({ length: 5 }, (_, index) =>
      assignment(`a${index}`, new Date(2026, 11, index + 1).toISOString()),
    );
    expect(upcomingTrackDeadlines([trackModule(many)], { now })).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";

import { currentItem, guideStep, type SetupProgress } from "@/lib/admin-setup";

const none: SetupProgress = { cohort: false, track: false, student: false };
const withCohort = { ...none, cohort: true };
const withTrack = { ...withCohort, track: true };
const withStudent = { ...withTrack, student: true };
const start = { formStep: 0, trackNoteRead: false, teamStep: 0 };

describe("currentItem", () => {
  it("asks for a cohort, then a track, then a student, then shows the team", () => {
    expect(currentItem(none)).toBe("cohort");
    // A track made before the cohort doesn't skip the cohort.
    expect(currentItem({ ...none, track: true })).toBe("cohort");
    expect(currentItem(withCohort)).toBe("track");
    expect(currentItem(withTrack)).toBe("student");
    expect(currentItem(withStudent)).toBe("team");
  });
});

describe("guideStep", () => {
  it("leads to Cohorts, then its create button, then through the form", () => {
    expect(guideStep("/admin/dashboard", none, start).target).toBe("nav:/admin/cohorts");
    expect(guideStep("/admin/cohorts", none, start).target).toBe("create-cohort");

    const form = (formStep: number) =>
      guideStep("/admin/cohorts/create", none, { ...start, formStep });
    expect(form(0)).toMatchObject({ target: "cohort-name", interactive: true, back: undefined });
    expect(form(1).target).toBe("cohort-dates");
    expect(form(2).target).toBe("cohort-status");
    expect(form(3)).toMatchObject({ target: "cohort-submit", next: undefined, back: "form-back" });
  });

  it("then leads to Tracks and its create button", () => {
    expect(guideStep("/admin/cohorts", withCohort, start).target).toBe("nav:/admin/tracks");
    expect(guideStep("/admin/tracks", withCohort, start).target).toBe("create-track");
  });

  it("explains why a new track isn't listed before moving on", () => {
    const note = guideStep("/admin/tracks", withTrack, start);
    expect(note).toMatchObject({
      target: "tracks-list",
      interactive: false,
      next: { action: "track-note-read" },
    });
    expect(
      guideStep("/admin/tracks", withTrack, { ...start, trackNoteRead: true }).target,
    ).toBe("nav:/admin/cohorts");
  });

  it("invites the first student from inside the cohort", () => {
    expect(guideStep("/admin/students", withTrack, start).target).toBe("nav:/admin/cohorts");
    expect(guideStep("/admin/cohorts", withTrack, start).target).toBe("cohort-card");
    expect(guideStep("/admin/cohorts/abc-123", withTrack, start).target).toBe("invite-student");
  });

  it("ends by pointing at instructors and mentors", () => {
    expect(guideStep("/admin/cohorts/abc", withStudent, start)).toMatchObject({
      target: "nav:/admin/instructors",
      next: { action: "team-next" },
    });
    expect(
      guideStep("/admin/cohorts/abc", withStudent, { ...start, teamStep: 1 }),
    ).toMatchObject({
      target: "nav:/admin/mentors",
      next: { action: "finish", label: "Done" },
      back: "team-back",
    });
  });
});

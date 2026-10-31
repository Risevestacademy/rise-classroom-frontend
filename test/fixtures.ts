import type { AdminUser, Cohort, Track } from "@/lib/admin";

export function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: "cohort-1",
    name: "Cohort 4",
    year: "2026",
    status: "ONGOING",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-12-01T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: "track-1",
    name: "Frontend",
    description: "",
    status: "ACTIVE",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "user-1",
    name: "Ada Obi",
    firstName: "Ada",
    lastName: "Obi",
    email: "ada@example.com",
    role: "STUDENT",
    status: "ACTIVE",
    onboardingStatus: "COMPLETED",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export const cohort = makeCohort();

export const tracks = [
  makeTrack(),
  makeTrack({ id: "track-2", name: "Backend" }),
];

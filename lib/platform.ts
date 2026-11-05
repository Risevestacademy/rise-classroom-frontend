import type { OnboardingStatus, UserStatus } from "@/lib/auth";


export type AcademyStatus = "ACTIVE" | "SUSPENDED";


type Organization = {
  id: string;
  name: string;
  slug: string;
  status: AcademyStatus;
  createdAt: string;
  updatedAt: string;
  counts: { users: number; cohorts: number; tracks: number };
};

export type AcademyAdmin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
};

export type Academy = Organization & { admins: AcademyAdmin[] };

export function setupAdmin(academy: Academy) {
  return academy.admins.find((admin) => admin.onboardingStatus === "COMPLETED");
}

export function isAwaitingSetup(academy: Academy) {
  return academy.status === "ACTIVE" && !setupAdmin(academy);
}

export function isActiveAcademy(academy: Academy) {
  return academy.status === "ACTIVE" && Boolean(setupAdmin(academy));
}

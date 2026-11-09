import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
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

const detailBatchSize = 6;

async function getAcademy(id: string) {
  const { data } = await api.get<Envelope<Academy>>(
    `/platform/organizations/${id}`,
  );
  return data;
}

async function listAcademies() {
  const { data: organizations } = await api.get<Envelope<Organization[]>>(
    "/platform/organizations",
  );

  const academies: Academy[] = [];
  for (let start = 0; start < organizations.length; start += detailBatchSize) {
    const batch = organizations.slice(start, start + detailBatchSize);
    academies.push(...(await Promise.all(batch.map(({ id }) => getAcademy(id)))));
  }
  return academies.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateAcademyStatus(id: string, status: AcademyStatus) {
  const { data } = await api.patch<Envelope<Organization>>(
    `/platform/organizations/${id}`,
    { status },
  );
  return data;
}

export function setupAdmin(academy: Academy) {
  return academy.admins.find((admin) => admin.onboardingStatus === "COMPLETED");
}

export function isAwaitingSetup(academy: Academy) {
  return academy.status === "ACTIVE" && !setupAdmin(academy);
}

export function isActiveAcademy(academy: Academy) {
  return academy.status === "ACTIVE" && Boolean(setupAdmin(academy));
}

export const platformKeys = {
  academies: ["platform", "academies"] as const,
};

export const platformQueries = {
  academies: () =>
    queryOptions({
      queryKey: platformKeys.academies,
      queryFn: listAcademies,
    }),
};

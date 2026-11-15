import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import type { OnboardingStatus } from "@/lib/auth";
import type { LearnerCount, LearningSpaceType } from "@/lib/sign-up";

/* The platform admin's data. Academies start as applications from the public
   sign-up form: approving one creates the organisation (the academy) and
   invites its first super admin. */

export type AcademyStatus = "ACTIVE" | "SUSPENDED";

export type ApplicationStatus =
  | "NEW"
  | "INFO_REQUESTED"
  | "APPROVED"
  | "DECLINED";

export type AcademyAdmin = {
  id: string;
  name: string;
  email: string;
  /* INVITED until they set their password from the invite email. */
  onboardingStatus: OnboardingStatus;
  onboardedAt: string | null;
  lastActiveAt: string | null;
};

export type OrganizationApplication = {
  id: string;
  fullName: string;
  email: string;
  academyName: string;
  website: string | null;
  learningSpaceType: LearningSpaceType;
  estimatedLearners: LearnerCount;
  status: ApplicationStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /* Null until the application is approved. */
  organization: {
    id: string;
    name: string;
    slug: string;
    admin: AcademyAdmin | null;
  } | null;
};

type Person = { id: string; name: string; email: string };

export type ApplicationEvent = {
  id: string;
  type: "SUBMITTED" | "INFO_REQUESTED" | "RESUBMITTED" | "APPROVED" | "DECLINED";
  /* The info request, the applicant's answer, or the decline reason. */
  message: string | null;
  createdAt: string;
  /* The platform admin who acted; null when the applicant did. */
  actor: Person | null;
};

export type ApplicationDetails = OrganizationApplication & {
  reviewedBy: Person | null;
  /* Oldest first. */
  events: ApplicationEvent[];
};

export type AcademyCounts = { users: number; cohorts: number; tracks: number };

export type Academy = {
  id: string;
  name: string;
  slug: string;
  status: AcademyStatus;
  createdAt: string;
  updatedAt: string;
  counts: AcademyCounts;
  admin: AcademyAdmin | null;
  /* The application the academy was approved from, when it can be found. */
  application: OrganizationApplication | null;
};

type ApplicationPage = {
  items: OrganizationApplication[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const applicationsPath = "/platform/organization-applications";
const pageLimit = 50;

/* Every application, newest first. The pages work on the whole list (search,
   counts, filters), so all of the API's pages are read. */
async function listApplications(
  status?: ApplicationStatus,
): Promise<OrganizationApplication[]> {
  const applications: OrganizationApplication[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await api.get<Envelope<ApplicationPage>>(applicationsPath, {
      query: { status, page, limit: pageLimit },
    });
    applications.push(...data.items);
    totalPages = data.totalPages;
    page += 1;
  } while (page <= totalPages);
  return applications;
}

async function getApplication(id: string): Promise<ApplicationDetails> {
  const { data } = await api.get<Envelope<ApplicationDetails>>(
    `${applicationsPath}/${id}`,
  );
  return data;
}

/* Creates the organisation and emails its super admin an onboarding link. */
export async function approveApplication(
  id: string,
): Promise<OrganizationApplication> {
  const { data } = await api.post<
    Envelope<{ application: OrganizationApplication }>
  >(`${applicationsPath}/${id}/approve`, {});
  return data.application;
}

/* Emails the applicant the question with a link to answer it, and holds the
   application as INFO_REQUESTED until they do. Only a NEW one can be asked. */
export async function requestApplicationInfo(
  id: string,
  message: string,
): Promise<OrganizationApplication> {
  const { data } = await api.post<
    Envelope<{ application: OrganizationApplication }>
  >(`${applicationsPath}/${id}/request-info`, { message });
  return data.application;
}

/* The reason is kept in the application's history; the applicant isn't emailed. */
export async function declineApplication(
  id: string,
  reason: string,
): Promise<OrganizationApplication> {
  const { data } = await api.post<Envelope<OrganizationApplication>>(
    `${applicationsPath}/${id}/decline`,
    { reason },
  );
  return data;
}

type Organization = {
  id: string;
  name: string;
  slug: string;
  status: AcademyStatus;
  createdAt: string;
  updatedAt: string;
  counts: AcademyCounts;
  /* The organisation's first super admin. */
  admin: AcademyAdmin | null;
};

type OrganizationPage = Omit<ApplicationPage, "items"> & {
  items: Organization[];
};

async function listOrganizations(): Promise<Organization[]> {
  const organizations: Organization[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await api.get<Envelope<OrganizationPage>>(
      "/platform/organizations",
      { query: { page, limit: pageLimit } },
    );
    organizations.push(...data.items);
    totalPages = data.totalPages;
    page += 1;
  } while (page <= totalPages);
  return organizations;
}

/* Every academy, newest first. What the applicant said about it (website,
   kind of learning space, size) lives on its application, so the approved
   applications are read alongside; an academy still lists without one. */
async function listAcademies(): Promise<Academy[]> {
  const [organizations, approved] = await Promise.all([
    listOrganizations(),
    listApplications("APPROVED").catch((): OrganizationApplication[] => []),
  ]);
  const applications = new Map(
    approved.map((application) => [application.organization?.id, application]),
  );

  return organizations
    .map((organization) => ({
      ...organization,
      application: applications.get(organization.id) ?? null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateAcademyStatus(
  id: string,
  status: AcademyStatus,
): Promise<AcademyStatus> {
  const { data } = await api.patch<Envelope<{ status: AcademyStatus }>>(
    `/platform/organizations/${id}`,
    { status },
  );
  return data.status;
}

/* The academy's super admin, once they've finished setting up. */
export function setupAdmin(academy: Academy): AcademyAdmin | undefined {
  return academy.admin?.onboardingStatus === "COMPLETED"
    ? academy.admin
    : undefined;
}

export function isAwaitingSetup(academy: Academy): boolean {
  return academy.status === "ACTIVE" && !setupAdmin(academy);
}

export function isActiveAcademy(academy: Academy): boolean {
  return academy.status === "ACTIVE" && Boolean(setupAdmin(academy));
}

/* Approved, but the academy's super admin hasn't finished setting up yet. */
export function isApplicationAwaitingSetup(
  application: OrganizationApplication,
): boolean {
  return (
    application.status === "APPROVED" &&
    application.organization !== null &&
    application.organization.admin?.onboardingStatus !== "COMPLETED"
  );
}

/* Still waiting on the platform admin's decision. */
export function isOpenApplication(
  application: OrganizationApplication,
): boolean {
  return (
    application.status === "NEW" || application.status === "INFO_REQUESTED"
  );
}

export const platformKeys = {
  all: ["platform"] as const,
  academies: ["platform", "academies"] as const,
  applications: ["platform", "applications"] as const,
  application: (id: string) => ["platform", "applications", id] as const,
};

export const platformQueries = {
  academies: () =>
    queryOptions({
      queryKey: platformKeys.academies,
      queryFn: listAcademies,
    }),

  applications: () =>
    queryOptions({
      queryKey: platformKeys.applications,
      queryFn: () => listApplications(),
    }),

  application: (id: string) =>
    queryOptions({
      queryKey: platformKeys.application(id),
      queryFn: () => getApplication(id),
    }),
};

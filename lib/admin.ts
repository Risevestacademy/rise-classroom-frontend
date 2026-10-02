import { api, ApiError } from "@/lib/api";
import type { OnboardingStatus, Role, UserStatus } from "@/lib/auth";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type CohortStatus = "ONGOING" | "COMPLETED" | "TERMINATED";
export type TrackStatus = "ACTIVE" | "SUSPENDED";

export type Cohort = {
  id: string;
  name: string;
  year: string;
  status: CohortStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Track = {
  id: string;
  name: string;
  description: string;
  status: TrackStatus;
  createdAt: string;
  updatedAt: string;
};

export type OnboardUserInput = {
  cohortId: string;
  trackId: string;
  role: Exclude<Role, "SUPERADMIN">;
  firstName: string;
  lastName: string;
  email: string;
};

export type OnboardedUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  onboardedAt?: string | null;
  createdAt: string;
};

export type OnboardUserResult = {
  outcome: "invited";
  emailSent: boolean;
  user: OnboardedUser;
};

export async function listCohorts(query?: { status?: CohortStatus }) {
  const response = await api.get<ApiEnvelope<Cohort[]>>("/admin/cohorts", {
    query,
  });
  return response.data;
}

export async function listTracks(query?: { status?: TrackStatus }) {
  const response = await api.get<ApiEnvelope<Track[]>>("/admin/tracks", {
    query,
  });
  return response.data;
}

export async function onboardUser(input: OnboardUserInput) {
  const response = await api.post<ApiEnvelope<OnboardUserResult>>(
    "/admin/users",
    input,
  );
  return response.data;
}

function getAdminAccessErrorMessage(error: ApiError) {
  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.status === 403) {
    return "Only super admins can do this. Check that your account is active.";
  }

  return null;
}

export function getProgramOptionsErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return (
    getAdminAccessErrorMessage(error) ??
    "We couldn't load cohorts and tracks. Please try again."
  );
}

export function getOnboardErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const accessMessage = getAdminAccessErrorMessage(error);
  if (accessMessage) return accessMessage;

  if (error.status === 404) {
    return "That cohort or track no longer exists. Go back and pick another one.";
  }

  if (error.status === 409) {
    return "Someone with this email already has an account. If they were invited earlier, resend their invite instead.";
  }

  if (error.status >= 500) {
    return "We couldn't send the invitation. Please try again.";
  }
  return error.message || "We couldn't send the invitation. Please try again.";
}

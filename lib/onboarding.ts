import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope } from "@/lib/api";

export type OnboardingRole = "STUDENT" | "INSTRUCTOR";

/** What `POST /onboarding/details` returns for an invite link's token. */
export type OnboardingDetails = {
  firstName: string;
  lastName: string;
  email: string;
  role: OnboardingRole;
  memberships: { cohort: string; track: string }[];
};

export type CompleteOnboardingInput = {
  token: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  /** Optional profile photo. */
  image?: File | null;
};

/** Profile photo formats `POST /onboarding/complete` accepts. */
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Largest profile photo the backend accepts (2MB). */
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** Returns why the backend would reject a photo, or null if it's fine. */
export function validateProfileImage(file: File) {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG or WebP image.";
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "Choose an image that's 2MB or smaller.";
  }

  return null;
}

// The token goes in the body rather than the URL so it isn't written to the
// backend's request logs.
async function getOnboardingDetails(token: string) {
  const { data } = await api.post<Envelope<OnboardingDetails>>(
    "/onboarding/details",
    { token }
  );

  return data;
}

/**
 * Sets the password, display name and optional profile photo, and uses up the
 * invite link. It does not sign the user in — that is a separate call
 * afterwards. Sent as multipart so the photo can go in the same request.
 */
export function completeOnboarding({
  image,
  ...fields
}: CompleteOnboardingInput) {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    body.append(key, value);
  }

  if (image) body.append("image", image);

  return api.post<{ success: boolean; message: string }>(
    "/onboarding/complete",
    body
  );
}

export const onboardingQueries = {
  details: (token: string) =>
    queryOptions({
      queryKey: ["onboarding", "details", token] as const,
      queryFn: () => getOnboardingDetails(token),
      enabled: token.length > 0,
      // An invite's details don't change while someone is filling the form in,
      // and the endpoint is rate limited, so fetch once per visit.
      staleTime: Infinity,
      retry: false,
    }),
};

/** Turns an onboarding failure into something the invitee can act on. */
export function getOnboardingErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  switch (error.status) {
    case 404:
      return "This invitation link is invalid or has already been used. If you've already set up your account, sign in instead.";
    case 410:
      return "This invitation link has expired. Ask your program admin to send you a new one.";
    case 413:
      return "Your profile photo is larger than 2MB. Go back and choose a smaller one.";
    case 429:
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope } from "@/lib/api";

export type OnboardingRole = "STUDENT" | "INSTRUCTOR" | "MENTOR";

/** The onboarding wording that differs by role, as in each role's designs. */
export const onboardingCopy: Record<
  OnboardingRole,
  {
    inviteTitle: (firstName: string) => string;
    createAccountSubtitle: string;
    /** Mentors see an "Account created" step before completing their profile. */
    showsAccountCreated: boolean;
    confirmTitle: string;
    confirmSubtitle: string;
    welcomeSubtitle: string;
    welcomeMessage: string;
    dashboardLabel: string;
  }
> = {
  STUDENT: {
    inviteTitle: (firstName) =>
      `Hi ${firstName}, you've been invited to Rise Classroom`,
    createAccountSubtitle:
      "Set up your account to start your learning journey with Rise Classroom",
    showsAccountCreated: false,
    confirmTitle: "Confirm your Program",
    confirmSubtitle: "Make sure these details are correct before you continue",
    welcomeSubtitle: "",
    welcomeMessage:
      "Learn, track progress, complete assignments, and stay connected.",
    dashboardLabel: "Go to your dashboard",
  },
  INSTRUCTOR: {
    inviteTitle: (firstName) =>
      `Hi ${firstName}, you've been invited to Rise Classroom as an instructor`,
    createAccountSubtitle:
      "Set up your account to get started with Rise Classroom.",
    showsAccountCreated: false,
    confirmTitle: "Confirm your Program",
    confirmSubtitle:
      "Review your program and teaching assignment before continuing.",
    welcomeSubtitle:
      "Your teaching space is ready. Let’s get you set up to support your learners.",
    welcomeMessage:
      "Learn, track progress, complete assignments, and stay connected.",
    dashboardLabel: "Go to your dashboard",
  },
  MENTOR: {
    // PENDING-BACKEND: the design names the program ("Rise Academy"), but the
    // invite details don't include it.
    inviteTitle: () => "Your invitation to Rise Classroom has been accepted",
    createAccountSubtitle:
      "Set up your account to start mentoring with Rise Classroom.",
    showsAccountCreated: true,
    confirmTitle: "Confirm your Assignment",
    confirmSubtitle: "Make sure these details are correct before you continue",
    welcomeSubtitle: "",
    welcomeMessage:
      "Support your students, track their progress, and guide them throughout their learning journey.",
    // PENDING-DESIGN: there's no tour yet, so this goes to the dashboard.
    dashboardLabel: "Take a quick tour",
  },
};

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
  phoneNumber: string;
  location: string;
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
 * Sets the password, display name, phone number, location and optional profile
 * photo, and uses up the invite link. It does not sign the user in — that is a
 * separate call afterwards. Sent as multipart so the photo can go in the same request.
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

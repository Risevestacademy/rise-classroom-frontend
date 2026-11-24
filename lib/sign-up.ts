import { api, ApiError } from "@/lib/api";

/** "What best describes your learning space?" choices, in the design's order. */
export const learningSpaceTypes = [
  { value: "TRAINING_ACADEMY", label: "Training academy" },
  { value: "BOOTCAMP", label: "Bootcamp" },
  { value: "SCHOOL_OR_INSTITUTION", label: "School or institution" },
  { value: "INDEPENDENT_EDUCATOR", label: "Independent educator" },
  { value: "OTHER", label: "other" },
] as const;

/** "Estimated number of learners" choices, in the design's order. */
export const learnerCounts = [
  { value: "JUST_GETTING_STARTED", label: "Just getting started" },
  { value: "FROM_1_TO_50", label: "1-50 learners" },
  { value: "FROM_51_TO_200", label: "51-200 learners" },
  { value: "FROM_201_TO_500", label: "201-500 learners" },
  { value: "OVER_500", label: "More than 500 learners" },
] as const;

export type LearningSpaceType = (typeof learningSpaceTypes)[number]["value"];
export type LearnerCount = (typeof learnerCounts)[number]["value"];

const labelOf = (
  choices: readonly { value: string; label: string }[],
  value: string,
): string => choices.find((choice) => choice.value === value)?.label ?? value;

export const learningSpaceLabel = (value: LearningSpaceType): string =>
  labelOf(learningSpaceTypes, value);

export const learnerCountLabel = (value: LearnerCount): string =>
  labelOf(learnerCounts, value);

export type SignUpApplication = {
  fullName: string;
  email: string;
  academyName: string;
  /** Without the `https://` the field shows. */
  website: string;
  learningSpaceType: LearningSpaceType;
  learnerCount: LearnerCount;
};

/* The API needs a first and a last name: the applicant becomes the academy's
   super admin, and their name is split at the first space. */
export function hasFirstAndLastName(fullName: string): boolean {
  return fullName.trim().split(/\s+/).length >= 2;
}

/* Sends the application for a platform admin to review. Public: no session. */
export async function submitSignUpApplication(
  application: SignUpApplication,
): Promise<void> {
  await api.post("/organization-applications", {
    fullName: application.fullName,
    email: application.email,
    academyName: application.academyName,
    /* Optional; the API accepts a bare domain and stores it with https://. */
    website: application.website || undefined,
    learningSpaceType: application.learningSpaceType,
    estimatedLearners: application.learnerCount,
  });
}

/* Why an application wasn't accepted, in words for the applicant. */
export function signUpErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "This email already has an account or an application in review. Sign in, or wait to hear from us.";
    }
    if (error.status === 429) {
      return "Too many applications have been sent from here. Please try again in an hour.";
    }
    if (error.status === 400 && error.message) return error.message;
  }
  return "We couldn't send your application. Please try again.";
}

/* An application as its applicant sees it from a "more info needed" link. */
export type MoreInfoApplication = {
  fullName: string;
  email: string;
  academyName: string;
  website: string | null;
  learningSpaceType: LearningSpaceType;
  estimatedLearners: LearnerCount;
  /* The platform admin's question. */
  infoRequest: { message: string; requestedAt: string } | null;
};

/* The token goes in the body, as the API asks, so it stays out of request
   logs. Only works while the application is waiting on an answer. */
export async function getMoreInfoApplication(
  token: string,
): Promise<MoreInfoApplication> {
  const { data } = await api.post<{ data: MoreInfoApplication }>(
    "/organization-applications/details",
    { token },
  );
  return data;
}

export type MoreInfoAnswer = Omit<SignUpApplication, "email"> & {
  token: string;
  /* The answer to the platform admin's question. */
  response: string;
};

/* Uses up the link and puts the application back in review. The email can't
   be changed. */
export async function submitMoreInfoAnswer(
  answer: MoreInfoAnswer,
): Promise<void> {
  await api.post("/organization-applications/resubmit", {
    token: answer.token,
    response: answer.response,
    fullName: answer.fullName,
    academyName: answer.academyName,
    website: answer.website || undefined,
    learningSpaceType: answer.learningSpaceType,
    estimatedLearners: answer.learnerCount,
  });
}

/* Why a "more info needed" link or its answer didn't work. */
export function moreInfoErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "This link isn't valid any more. It may have been used already, or your application is no longer waiting on an answer.";
    }
    if (error.status === 410) {
      return "This link has expired. Links are valid for 7 days.";
    }
    if (error.status === 429) {
      return "Too many attempts. Please try again in a little while.";
    }
    if (error.status === 400 && error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

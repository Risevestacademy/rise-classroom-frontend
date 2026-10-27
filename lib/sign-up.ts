/** "What best describes your learning space?" choices, in the design's order. */
export const learningSpaceTypes = [
  { value: "trainingAcademy", label: "Training academy" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "school", label: "School or institution" },
  { value: "independentEducator", label: "Independent educator" },
  { value: "other", label: "other" },
] as const;

/** "Estimated number of learners" choices, in the design's order. */
export const learnerCounts = [
  { value: "justStarting", label: "Just getting started" },
  { value: "1-50", label: "1-50 learners" },
  { value: "51-200", label: "51-200 learners" },
  { value: "201-500", label: "201-500 learners" },
  { value: "500+", label: "More than 500 learners" },
] as const;

export type LearningSpaceType = (typeof learningSpaceTypes)[number]["value"];
export type LearnerCount = (typeof learnerCounts)[number]["value"];

export type SignUpApplication = {
  fullName: string;
  email: string;
  academyName: string;
  /** Without the `https://` the field shows. */
  website: string;
  learningSpaceType: LearningSpaceType;
  learnerCount: LearnerCount;
};

/**
 * PENDING-BACKEND: there's no public endpoint for sign-up applications yet
 * (`POST /platform/organizations` needs a signed-in platform admin), so
 * nothing is sent. Swap this for the real call once it exists.
 */
export async function submitSignUpApplication(
  application: SignUpApplication,
): Promise<void> {
  void application;
}

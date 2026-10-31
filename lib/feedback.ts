/* The three forms under "Help & Feedback" in the account menu. */
export type FeedbackKind = "problem" | "improvement" | "experience";

/* Topic chips for each form */
export const feedbackTopics: Record<FeedbackKind, readonly string[]> = {
  problem: [
    "Bug",
    "Lesson or resource issue",
    "Assignment issue",
    "Access issue",
    "Slow or not loading",
    "Navigation issue",
    "Other",
  ],
  improvement: [
    "Feature request",
    "Existing feature",
    "User experience",
    "Learning experience",
    "Other",
  ],
  experience: [
    "Learning experience",
    "Assignment",
    "Platform usability",
    "Mentorship",
    "Community",
    "Other",
  ],
};


export const experienceRatings = [
  { value: 1, label: "Very poor", image: "/very-poor.png" },
  { value: 2, label: "Poor", image: "/poor.png" },
  { value: 3, label: "Okay", image: "/okay.png" },
  { value: 4, label: "Good", image: "/good.png" },
  { value: 5, label: "Excellent", image: "/excellent.png" },
] as const;

/* Screenshot formats and size the attachment field accepts. */
export const feedbackImageExtensions = [".jpg", ".jpeg", ".png"] as const;
export const feedbackImageMaxBytes = 10 * 1e6;

export type FeedbackInput = {
  kind: FeedbackKind;
  topic: string | null;
  message: string;
  /* 1 to 5, for the experience form only. */
  rating?: number;
  image?: File;
};

/* Pending-Backend */
export async function submitFeedback(input: FeedbackInput) {
  void input;
}

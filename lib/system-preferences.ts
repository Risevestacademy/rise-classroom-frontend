/* PENDING-BACKEND: the API has no system preferences yet, so these are the
   design's defaults and changes last until the page is reloaded. */

type Choice<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

const choice = <T extends string>(
  value: T,
  label: string,
  description?: string,
): Choice<T> => ({ value, label, description });

export type SystemPreferencePage = {
  slug: string;
  title: string;
  description: string;
};

const page = (
  slug: string,
  title: string,
  description: string,
): SystemPreferencePage => ({ slug, title, description });

export const systemPreferenceGroups: {
  title: string;
  description: string;
  pages: SystemPreferencePage[];
}[] = [
  {
    title: "Learning preferences",
    description: "Define how learning is delivered, accessed and tracked",
    pages: [
      page(
        "assignment-submissions",
        "Assignment submissions rules",
        "Set rules for deadlines, late submission and resubmission",
      ),
      page(
        "grading-assessment",
        "Grading & assessment defaults",
        "Configure grading scales, pass marks and assessment types",
      ),
      page(
        "learning-materials",
        "Learning materials preferences",
        "Set default formats, resources and content delivery options",
      ),
      page(
        "progress-tracking",
        "Student progress tracking",
        "Define how progress is calculated and tracked",
      ),
    ],
  },
  {
    title: "Data management",
    description: "Manage your academy's data, storage and file settings",
    pages: [
      page(
        "data-export",
        "Academy data export",
        "Export student, program and performance data",
      ),
      page(
        "storage-usage",
        "Storage usage",
        "View and manage your academy's storage consumption",
      ),
      page(
        "file-upload-limits",
        "File upload limits",
        "Set maximum file sizes and allowed file types",
      ),
    ],
  },
];

export function findSystemPreferencePage(
  slug: string,
): SystemPreferencePage | undefined {
  return systemPreferenceGroups
    .flatMap((group) => group.pages)
    .find((item) => item.slug === slug);
}

/* Assignment submissions rules */

export type DeadlineMode = "instructor" | "default";

export const deadlineModes: Choice<DeadlineMode>[] = [
  choice(
    "instructor",
    "Use the due date set by each instructor",
    "Recommended. Instructors set unique deadlines for each assignment",
  ),
  choice(
    "default",
    "Use a default deadline for all assignments",
    "Set a standard due date duration for all assignments",
  ),
];

export const deadlineDurations: Choice[] = ["3", "7", "14", "30"].map((days) =>
  choice(days, `${days} days`),
);

export type LatePolicy = "penalty" | "no-penalty";

export const latePolicies: Choice<LatePolicy>[] = [
  choice("penalty", "Allow with a penalty"),
  choice("no-penalty", "Allow without a penalty"),
];

export const latePenalties: Choice[] = ["5", "10", "15", "20", "25", "50"].map(
  (percent) => choice(percent, `${percent} %`),
);

export const resubmissionLimits: Choice[] = [
  choice("1", "1 attempt"),
  choice("2", "2 attempts"),
  choice("3", "3 attempts"),
  choice("unlimited", "Unlimited attempts"),
];

export const resubmissionGrades: Choice[] = [
  choice("latest", "Use the latest submission"),
  choice("highest", "Use the highest grade"),
  choice("average", "Use the average grade"),
];

/* Grading & assessment defaults */

export type GradingSystem = "percentage" | "letter";

export const gradingSystems: Choice<GradingSystem>[] = [
  choice("percentage", "Percentage", "Graded based on a 0 - 100% scale"),
  choice("letter", "Letter grade", "Use letter grades (A - F) with a set range"),
];

export const gradeScale = [
  { grade: "A", range: "≥ 70%" },
  { grade: "B", range: "60 - 69%" },
  { grade: "C", range: "50 - 59%" },
  { grade: "D", range: "40 - 49%" },
  { grade: "F", range: "< 40%" },
] as const;

export const assessmentTypes: Choice[] = [
  choice(
    "assignments",
    "Assignments",
    "Assess student understanding through submitted tasks",
  ),
  choice(
    "projects",
    "Projects",
    "Evaluate practical application of learned skills",
  ),
  choice("quizzes", "Quizzes", "Test knowledge through short assessments"),
  choice(
    "examinations",
    "Examinations",
    "Measure student understanding through formal tests",
  ),
  choice(
    "participation",
    "Participation",
    "Evaluate student engagement and contribution",
  ),
];

export const defaultAssessmentTypes = ["assignments", "projects", "examinations"];

/* Learning materials preferences */

export const materialTypes: Choice[] = [
  choice("documents", "Documents (PDF, DOCX, PPTX)"),
  choice("videos", "Videos"),
  choice("audio", "Audio files"),
  choice("images", "Images"),
  choice("links", "External links"),
];

export const defaultMaterialTypes = ["documents", "videos", "images", "links"];

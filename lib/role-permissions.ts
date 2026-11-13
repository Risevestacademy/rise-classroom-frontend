/* PENDING-BACKEND: the API has no role permissions yet, so these are the
   design's defaults and changes last until the page is reloaded. */

export type RolePermission = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type AcademyRole = {
  slug: string;
  name: string;
  description: string;
  /* A locked role keeps every permission, and none can be switched off. */
  locked?: boolean;
  permissions: RolePermission[];
};

const on = (key: string, label: string, description: string): RolePermission => ({
  key,
  label,
  description,
  enabled: true,
});

const off = (key: string, label: string, description: string): RolePermission => ({
  ...on(key, label, description),
  enabled: false,
});

/* Super admins and admins have the same permissions, bar one description. */
const adminPermissions = (academy: string) => [
  on("academy", "Academy", academy),
  on(
    "programs",
    "Programs",
    "Create and manage tracks, cohorts and program details.",
  ),
  on(
    "people",
    "People",
    "Add, manage, and deactivate admins, instructors, mentors and students",
  ),
  on(
    "learning",
    "Learning",
    "Create and manage curriculum, lessons, assignments and resources",
  ),
  on(
    "performance",
    "Performance",
    "View and monitor participant and cohort performance",
  ),
  on(
    "feedback",
    "Feedback",
    "Access and manage feedback from students and instructors",
  ),
  on("reports", "Reports", "View and export academy reports and insights"),
  on(
    "settings",
    "Settings",
    "Manage academy settings, roles and platform preferences",
  ),
];

export const academyRoles: AcademyRole[] = [
  {
    slug: "super-admin",
    name: "Super admin",
    description: "Academy-wide administration and oversight",
    locked: true,
    permissions: adminPermissions(
      "Update and manage academy information and settings",
    ),
  },
  {
    slug: "admin",
    name: "Admin",
    description: "Operational administration within the academy",
    permissions: adminPermissions("View academy info and settings"),
  },
  {
    slug: "mentor",
    name: "Mentor",
    description: "Support assigned students and manage mentorship activities.",
    permissions: [
      on("students", "Students", "View and manage assigned mentees"),
      on("mentorship", "Mentorship", "Conduct and log mentorship session"),
      off("learning", "Learning", "View mentees learning progress"),
      on(
        "performance",
        "Performance",
        "Track mentees' progress and indicators (e.g completion, performance markers)",
      ),
      on("feedback", "Feedback", "Give and receive feedback from mentees"),
      off("reports", "Reports", "View mentorship and mentee progress report"),
      on(
        "settings",
        "Settings",
        "Manage personal mentorship preference (e.g availability, notifications)",
      ),
    ],
  },
  {
    slug: "instructor",
    name: "Instructor",
    /* The design reuses the mentor's description here. */
    description: "Teach assigned tracks and manage learning activities.",
    permissions: [
      on(
        "students",
        "Students",
        "View and manage students in assigned tracks and cohorts",
      ),
      on(
        "curriculum",
        "Curriculum",
        "Update and organize curriculum (modules, lessons, resources, assignments)",
      ),
      on(
        "assignments",
        "Assignments",
        "Create, manage, and grade assignments and submissions",
      ),
      on("performance", "Performance", "Track student progress and indicators"),
      on(
        "feedback",
        "Feedback",
        "Give feedback on assignments and receive feedback from students",
      ),
      off(
        "reports",
        "Reports",
        "View classes and cohort-level reports (e.g completion, submissions, performance)",
      ),
      on(
        "settings",
        "Settings",
        "Manage teaching preference (e.g grading, notifications)",
      ),
    ],
  },
  {
    slug: "student",
    name: "Student",
    description:
      "Access learning materials, complete assignments and track progress.",
    permissions: [
      on(
        "learning",
        "Learning",
        "Access curriculum materials (e.g lessons, resources and recordings)",
      ),
      on("assignments", "Assignments", "View, complete and submit assignments"),
      on(
        "progress",
        "Progress",
        "Track personal learning progress and performance",
      ),
      on(
        "feedback",
        "Feedback",
        "Give feedback on lessons, assignments and learning experience",
      ),
      off("reports", "Reports", "View personal progress and achievement reports"),
      on(
        "settings",
        "Settings",
        "Manage personal learning preference (e.g appearance, notifications)",
      ),
    ],
  },
];

export function findAcademyRole(slug: string): AcademyRole | undefined {
  return academyRoles.find((role) => role.slug === slug);
}

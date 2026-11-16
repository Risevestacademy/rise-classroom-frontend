export type InstructorAnnouncementRole =
  | "PROGRAM_COORDINATOR"
  | "INSTRUCTOR";

export type InstructorAnnouncementAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number | null;
};

export type InstructorAnnouncement = {
  id: string;
  title: string;
  body: string;
  sender: { id: string; name: string; role: InstructorAnnouncementRole };
  isPinned: boolean;
  isRead: boolean;
  attachments: InstructorAnnouncementAttachment[];
  createdAt: string;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(duration: number) {
  return new Date(Date.now() - duration).toISOString();
}

const coordinator = {
  id: "instructor-sample-coordinator",
  name: "Amaka Obi",
  role: "PROGRAM_COORDINATOR",
} as const;

const instructor = {
  id: "instructor-sample-sender",
  name: "Tunde Bello",
  role: "INSTRUCTOR",
} as const;

/** Temporary instructor-only fixtures until the notifications API is available. */
/** Instructor announcement fixtures until an announcements API is available. */
export const instructorAnnouncements: InstructorAnnouncement[] = [
  {
    id: "welcome-to-cohort",
    title: "Welcome to Cohort 2026",
    body: "Everything you need to get started: your schedule, how live classes work and where to find your resources.\n\nRead through the attached guide before your first live class.",
    sender: coordinator,
    isPinned: true,
    isRead: true,
    attachments: [
      {
        id: "getting-started-guide",
        name: "Getting started guide",
        url: "#",
        mimeType: "application/pdf",
        size: 860_000,
      },
    ],
    createdAt: ago(24 * DAY),
  },
  {
    id: "live-class-schedule",
    title: "Live class schedule for September",
    body: "Live classes hold on Tuesdays and Thursdays at 6:00 PM. Recordings are shared within 24 hours.",
    sender: coordinator,
    isPinned: true,
    isRead: true,
    attachments: [],
    createdAt: ago(23 * DAY),
  },
  {
    id: "product-design-demo-day",
    title: "Product Design demo day",
    body: [
      "Hi everyone,",
      "Demo Day is almost here. Our Product Design cohort will present their final projects to the whole program, and we'd love to see you there.",
      "What to expect\n• Each student presents their capstone project in 8 minutes, followed by 4 minutes of questions.\n• Instructors and guests give short feedback after each presentation.\n• There will be a closing session to celebrate the cohort.",
      "For students\nPlease submit your final slides by Wed, Dec 16 at 11:59 PM, and test your screen sharing before the day.",
      "For instructors\nPlease join to support your students and share feedback. You can add the event to your calendar below.",
      "How to join\nThe event runs live on Zoom. Use the join link on this page when it opens, 10 minutes before the start. A recording will be shared afterwards.",
      "We're proud of how far this cohort has come. See you there!",
      "Program Admin",
    ].join("\n\n"),
    sender: coordinator,
    isPinned: false,
    isRead: false,
    attachments: [],
    createdAt: ago(4 * HOUR),
  },
  {
    id: "town-hall",
    title: "Town hall meeting on Wednesday",
    body: "Join the program town hall at 8:00 PM to hear updates and ask questions.",
    sender: coordinator,
    isPinned: false,
    isRead: false,
    attachments: [],
    createdAt: ago(1 * DAY),
  },
  {
    id: "assignment-deadline",
    title: "Assignment 1 deadline moved to Friday",
    body: "Hi everyone,\n\nThe deadline for Module 1 · Assignment 1 has moved from Thursday to Friday at 11:59 PM. This gives you extra time to polish your landing page and double-check your link access.\n\nPlease make sure your Figma link is set to “Anyone with the link can view” before you submit.\n\nIf you have questions, bring them to the next live class.\n\nTunde",
    sender: instructor,
    isPinned: false,
    isRead: true,
    attachments: [
      {
        id: "updated-assignment-brief",
        name: "Updated assignment brief",
        url: "#",
        mimeType: "application/pdf",
        size: 1_200_000,
      },
    ],
    createdAt: ago(6 * HOUR),
  },
  {
    id: "new-recording",
    title: "New recording available: Live Class 1",
    body: "The recording for Foundations is now in Module 1. Watch it before the next live class.",
    sender: instructor,
    isPinned: false,
    isRead: true,
    attachments: [],
    createdAt: ago(2 * DAY),
  },
];

export const instructorNotificationRoleLabels: Record<
  InstructorAnnouncementRole,
  string
> = {
  PROGRAM_COORDINATOR: "Program coordinator",
  INSTRUCTOR: "Instructor",
};

const locallyReadIds = new Set<string>();

export function isInstructorAnnouncementRead(id: string, initialRead: boolean) {
  return initialRead || locallyReadIds.has(id);
}

export function markInstructorAnnouncementRead(id: string) {
  locallyReadIds.add(id);
}

export function markAllInstructorAnnouncementsRead() {
  for (const item of instructorAnnouncements) locallyReadIds.add(item.id);
}

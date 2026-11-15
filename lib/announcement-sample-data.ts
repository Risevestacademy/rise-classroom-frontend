/**
 * SAMPLE DATA — not real.
 *
 * The notifications design has an Announcements tab and an announcement page,
 * but the backend has no announcements endpoint yet. This feeds them so the
 * flow can be built and reviewed against the design.
 *
 * Only used in local development (process.env.NODE_ENV === "development");
 * deployed builds show the empty state. See `lib/student-notifications.ts`.
 */

import type { Announcement } from "@/lib/student-notifications";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const coordinator = {
  id: "sample-coordinator",
  name: "Amaka Obi",
  role: "PROGRAM_COORDINATOR",
} as const;

const instructor = {
  id: "sample-instructor",
  name: "Tunde Bello",
  role: "INSTRUCTOR",
} as const;

function ago(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

export function sampleAnnouncements(): Announcement[] {
  return [
    {
      id: "welcome-to-cohort",
      title: "Welcome to the cohort",
      body: "Everything you need to get started: your schedule, how live classes work, and where to find recordings.\n\nRead through the attached guide before your first live class.",
      sender: coordinator,
      isPinned: true,
      isRead: true,
      attachments: [
        {
          id: "sample-guide",
          name: "Getting started guide",
          url: "#",
          mimeType: "application/pdf",
          size: 860_000,
        },
      ],
      createdAt: ago(20 * DAY),
    },
    {
      id: "live-class-schedule",
      title: "Live class schedule",
      body: "Live classes hold on Tuesdays and Thursdays at 6:00 PM. Recordings are shared within 24 hours.",
      sender: coordinator,
      isPinned: true,
      isRead: true,
      attachments: [],
      createdAt: ago(14 * DAY),
    },
    {
      id: "assignment-1-deadline",
      title: "Assignment 1 deadline moved to Friday",
      body: "Hi everyone,\n\nThe deadline for Module 1 · Assignment 1 has moved from Thursday to Friday at 11:59 PM. This gives you extra time to polish your landing page and double-check your link access.\n\nPlease make sure your Figma link is set to “Anyone with the link can view” before you submit. Submissions can’t be edited once they are sent.\n\nIf you have questions, bring them to the next live class.\n\nTunde",
      sender: instructor,
      isPinned: false,
      isRead: false,
      attachments: [
        {
          id: "sample-brief",
          name: "Updated assignment brief",
          url: "#",
          mimeType: "application/pdf",
          size: 1_200_000,
        },
      ],
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
      id: "recording-live-class-1",
      title: "New recording available: Live Class 1",
      body: "The recording for Foundations is now in Module 1. Watch it before the next live class.",
      sender: instructor,
      isPinned: false,
      isRead: true,
      attachments: [],
      createdAt: ago(2 * DAY),
    },
    {
      id: "control-tower-reminder",
      title: "Reminder: fill in your Control Tower",
      body: "Take a few minutes to set your goals for the week and note what came out of your mentor meeting.",
      sender: coordinator,
      isPinned: false,
      isRead: true,
      attachments: [],
      createdAt: ago(3 * DAY),
    },
  ];
}

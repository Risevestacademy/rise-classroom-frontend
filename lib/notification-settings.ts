/* PENDING-BACKEND: the API has no notification settings yet, so these are the
   design's defaults and changes last until the page is reloaded. */

export type NotificationToggle = { key: string; label: string; description: string };

export const notificationChannels: NotificationToggle[] = [
  {
    key: "email",
    label: "Email notifications",
    description: "Send important updates to users email",
  },
  {
    key: "inApp",
    label: "In-app notifications",
    description: "Show updates inside Rise Classroom",
  },
];

export type NotificationRecipient =
  | "students"
  | "instructors"
  | "admins"
  | "mentors";

export const notificationRecipientLabels: Record<NotificationRecipient, string> =
  {
    students: "Students",
    mentors: "Mentors",
    instructors: "Instructors",
    admins: "Admins",
  };

export const notificationEvents: (NotificationToggle & {
  recipients: NotificationRecipient[];
})[] = [
  {
    key: "newAssignments",
    label: "New assignments",
    description: "When an assignment is created",
    recipients: ["students"],
  },
  {
    key: "upcomingClass",
    label: "Upcoming class",
    description: "Reminder for scheduled classes or sessions",
    recipients: ["students", "mentors"],
  },
  {
    key: "assignmentSubmission",
    label: "Assignment submission",
    description: "When a student submits an assignment",
    recipients: ["students", "mentors"],
  },
  {
    key: "gradePublished",
    label: "Grade published",
    description: "When a grade or feedback is released",
    recipients: ["students", "mentors"],
  },
  {
    key: "announcement",
    label: "Announcement",
    description: "Academy or cohort-wide updates",
    recipients: ["students", "mentors"],
  },
  {
    key: "mentorshipCheckIn",
    label: "Mentorship check-in",
    description: "Reminders for upcoming or missed sessions",
    recipients: ["students", "mentors"],
  },
];

export const notificationRecipientDefaults: (NotificationToggle & {
  key: NotificationRecipient;
})[] = [
  {
    key: "students",
    label: "Students",
    description: "Receive academy updates, assignments, grades and reminders",
  },
  {
    key: "instructors",
    label: "Instructors",
    description:
      "Receive submissions alert, performance updates and announcements",
  },
  {
    key: "admins",
    label: "Admins",
    description:
      "Receive operational updates, program changes and critical alerts",
  },
  {
    key: "mentors",
    label: "Mentors",
    description: "Receive mentorship activities, student updates and reminders",
  },
];

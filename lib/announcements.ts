import { adminSampleAnnouncements } from "@/lib/announcement-sample-data";

export const announcementCategories = [
  { value: "GENERAL", label: "General" },
  { value: "ACADEMIC_UPDATE", label: "Academic update" },
  { value: "EVENT", label: "Events" },
  { value: "DEADLINE", label: "Deadlines" },
] as const;

export type AnnouncementCategory =
  (typeof announcementCategories)[number]["value"];

export const audienceRoles = [
  { value: "STUDENT", label: "Students", hint: "Only students" },
  { value: "INSTRUCTOR", label: "Instructors", hint: "Only instructors" },
  { value: "MENTOR", label: "Mentors", hint: "Only mentors" },
  // Admins as an audience are deferred to the next version.
] as const;

export type AudienceRole = (typeof audienceRoles)[number]["value"];

export type AnnouncementAudience =
  | { type: "EVERYONE" }
  | { type: "ROLES"; roles: AudienceRole[] }
  | { type: "TRACKS"; tracks: { id: string; name: string }[] };

export type AdminAnnouncement = {
  id: string;
  title: string;
  /** Plain text; line breaks are kept. */
  content: string;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  publishedAt: string;
};

export const categoryLabel = (category: AnnouncementCategory) =>
  announcementCategories.find((item) => item.value === category)!.label;

/** "Everyone", "Students", "Students, Mentors", "Design track", "Design, Frontend tracks" */
export function audienceLabel(audience: AnnouncementAudience) {
  if (audience.type === "EVERYONE") return "Everyone";
  if (audience.type === "ROLES") {
    return audienceRoles
      .filter((role) => audience.roles.includes(role.value))
      .map((role) => role.label)
      .join(", ");
  }
  const names = audience.tracks.map((track) => track.name).join(", ");
  return `${names} ${audience.tracks.length === 1 ? "track" : "tracks"}`;
}

/** "Jan 1, 2026 at 08:00 AM" */
export function publishedLabel(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} at ${time}`;
}

/** The Audience filter's value: "all", "EVERYONE", a role, or `track:<name>`. */
export type AudienceFilter = "all" | "EVERYONE" | AudienceRole | `track:${string}`;

export function matchesAudience(
  audience: AnnouncementAudience,
  filter: AudienceFilter,
) {
  if (filter === "all") return true;
  if (filter === "EVERYONE") return audience.type === "EVERYONE";
  if (filter.startsWith("track:")) {
    const name = filter.slice("track:".length);
    return (
      audience.type === "TRACKS" &&
      audience.tracks.some((track) => track.name === name)
    );
  }
  return (
    audience.type === "ROLES" && audience.roles.includes(filter as AudienceRole)
  );
}

export const dateRanges = [
  { value: "all", label: "All time", days: null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
] as const;

export type DateRange = (typeof dateRanges)[number]["value"];

export function inDateRange(iso: string, range: DateRange, now = Date.now()) {
  const days = dateRanges.find((item) => item.value === range)!.days;
  return days === null || now - new Date(iso).getTime() <= days * 86_400_000;
}

/**
 * PENDING-BACKEND: there are no announcement endpoints yet. In local
 * development the page shows sample announcements so it can be reviewed
 * against the design; deployed builds show the empty state.
 */
export const useSampleAdminAnnouncements =
  process.env.NODE_ENV === "development";

export function initialAdminAnnouncements(): AdminAnnouncement[] {
  return useSampleAdminAnnouncements ? adminSampleAnnouncements() : [];
}
